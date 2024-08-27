package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool)           //connected clients
var clientUsernames = make(map[string]*websocket.Conn) //map of usernames to websocket connections
var broadcast = make(chan Message)                     //broadcast channel
var recentMessages []Message                           //store recent messages
var mu sync.Mutex                                      //mutex to ensure thread-safe writes

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		//allow all connections by default
		return true
	},
}

// define our message object
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
	Color    string `json:"color"`
}

// anti-spam control
var lastMessageTimes = make(map[string]time.Time)
var messageCounts = make(map[string]int) //track the number of messages sent

const spamThreshold = 3              //allow 3 messages before cooldown
const spamCooldown = 5 * time.Second //5 seconds cooldown

func sanitizeMessage(input string) string {
	//basic sanitization: escape any dangerous characters
	return strings.ReplaceAll(input, "<", "&lt;")
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	mu.Lock()
	clients[ws] = true
	mu.Unlock()

	//receive the initial message with username and color
	var initialMessage Message
	err = ws.ReadJSON(&initialMessage)
	if err != nil {
		log.Printf("Error reading initial message: %v", err)
		ws.Close()
		mu.Lock()
		delete(clients, ws)
		mu.Unlock()
		return
	}

	//check if the username is already taken
	mu.Lock()
	if _, exists := clientUsernames[initialMessage.Username]; exists {
		mu.Unlock()
		//send an error message back to the client
		ws.WriteJSON(Message{Username: "Server", Message: "Username is already taken. Please choose a different name.", Color: "#ff0000"})
		ws.Close()
		mu.Lock()
		delete(clients, ws)
		mu.Unlock()
		return
	}

	//store the username and its connection
	clientUsernames[initialMessage.Username] = ws
	mu.Unlock()

	//send join notification as a system message
	systemMsg := Message{
		Username: "System",
		Message:  fmt.Sprintf("%s has joined the chat!", initialMessage.Username),
		Color:    "#999999", //light grey for the system message
	}
	broadcast <- systemMsg

	//send the last 5 messages to the newly connected client
	mu.Lock()
	for _, msg := range recentMessages {
		err := ws.WriteJSON(msg)
		if err != nil {
			log.Printf("Error sending recent messages: %v", err)
			ws.Close()
			delete(clients, ws)
			delete(clientUsernames, initialMessage.Username)
			mu.Unlock()
			return
		}
	}
	mu.Unlock()

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading json: %v", err)
			mu.Lock()
			delete(clients, ws)
			delete(clientUsernames, initialMessage.Username)
			if len(clients) == 0 {
				recentMessages = []Message{} //clear recent messages if no clients are connected
				log.Printf("No clients connected. Cleared recent messages.")
			}
			mu.Unlock()
			break
		}

		//check message length
		if len(msg.Message) > 574 {
			mu.Lock()
			ws.WriteJSON(Message{Username: "Server", Message: "Message too long. Max 574 characters.", Color: "#ff0000"})
			mu.Unlock()
			continue
		}

		//sanitize the message
		msg.Message = sanitizeMessage(msg.Message)

		//anti-spam logic
		now := time.Now()
		lastMsgTime, exists := lastMessageTimes[msg.Username]
		if exists && now.Sub(lastMsgTime) < spamCooldown {
			//increment the message count if within the cooldown period
			messageCounts[msg.Username]++
			if messageCounts[msg.Username] > spamThreshold {
				mu.Lock()
				ws.WriteJSON(Message{Username: "Server", Message: "You're sending messages too quickly. Please wait.", Color: "#ff0000"})
				mu.Unlock()
				continue
			}
		} else {
			//reset message count if outside the cooldown period
			messageCounts[msg.Username] = 1
			lastMessageTimes[msg.Username] = now
		}

		//add the new message to recentMessages
		mu.Lock()
		recentMessages = append(recentMessages, msg)
		if len(recentMessages) > 5 {
			recentMessages = recentMessages[1:] //keep only the last 5 messages
		}
		mu.Unlock()

		//send the newly received message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		mu.Lock()
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("Error writing json: %v", err)
				client.Close()
				delete(clients, client)
				delete(clientUsernames, msg.Username)
			}
		}
		if len(clients) == 0 {
			recentMessages = []Message{} //clear recent messages if no clients are connected
		}
		mu.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	//start listening for incoming chat messages
	go handleMessages()

	log.Println("Starting WebSocket server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}