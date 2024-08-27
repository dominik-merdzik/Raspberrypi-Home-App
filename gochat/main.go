package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var clients = make(map[*websocket.Conn]bool)           // connected clients
var clientUsernames = make(map[string]*websocket.Conn) // map of usernames to websocket connections
var broadcast = make(chan Message)                     // broadcast channel
var recentMessages []Message                           // store recent messages
var mu sync.Mutex                                      // mutex to ensure thread-safe writes

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// allow all connections by default
		return true
	},
}

// Message defines our message object
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
	Color    string `json:"color"`
}

// Anti-spam control
var lastMessageTimes = make(map[string]time.Time)
var messageCounts = make(map[string]int) // track the number of messages sent

const spamThreshold = 3              // allow 3 messages before cooldown
const spamCooldown = 5 * time.Second // 5 seconds cooldown

func sanitizeMessage(input string) string {
	// basic sanitization: escape any dangerous characters
	return strings.ReplaceAll(input, "<", "&lt;")
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	// Log when a new connection is established
	log.Printf("New connection established from %s", r.RemoteAddr)

	mu.Lock()
	clients[ws] = true
	mu.Unlock()

	// Receive the initial message with username and color
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

	// Log the username of the connected client
	log.Printf("User connected: %s from %s", initialMessage.Username, r.RemoteAddr)

	// Check if the username is already taken
	mu.Lock()
	if _, exists := clientUsernames[initialMessage.Username]; exists {
		mu.Unlock()
		// Send an error message back to the client
		ws.WriteJSON(Message{Username: "Server", Message: "Username is already taken. Please choose a different name.", Color: "#ff0000"})
		ws.Close()
		mu.Lock()
		delete(clients, ws)
		mu.Unlock()
		return
	}

	// Store the username and its connection
	clientUsernames[initialMessage.Username] = ws
	mu.Unlock()

	// Send join notification as a system message
	systemMsg := Message{
		Username: "System",
		Message:  fmt.Sprintf("%s has joined the chat!", initialMessage.Username),
		Color:    "#999999", // light grey for the system message
	}
	broadcast <- systemMsg

	// Send the last 5 messages to the newly connected client
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
				recentMessages = []Message{} // clear recent messages if no clients are connected
				log.Printf("No clients connected. Cleared recent messages.")
			}
			mu.Unlock()
			break
		}

		// Check message length
		if len(msg.Message) > 574 {
			mu.Lock()
			ws.WriteJSON(Message{Username: "Server", Message: "Message too long. Max 574 characters.", Color: "#ff0000"})
			mu.Unlock()
			continue
		}

		// Sanitize the message
		msg.Message = sanitizeMessage(msg.Message)

		// Anti-spam logic
		now := time.Now()
		lastMsgTime, exists := lastMessageTimes[msg.Username]
		if exists && now.Sub(lastMsgTime) < spamCooldown {
			// Increment the message count if within the cooldown period
			messageCounts[msg.Username]++
			if messageCounts[msg.Username] > spamThreshold {
				mu.Lock()
				ws.WriteJSON(Message{Username: "Server", Message: "You're sending messages too quickly. Please wait.", Color: "#ff0000"})
				mu.Unlock()
				continue
			}
		} else {
			// Reset message count if outside the cooldown period
			messageCounts[msg.Username] = 1
			lastMessageTimes[msg.Username] = now
		}

		// Add the new message to recentMessages
		mu.Lock()
		recentMessages = append(recentMessages, msg)
		if len(recentMessages) > 5 {
			recentMessages = recentMessages[1:] // keep only the last 5 messages
		}
		mu.Unlock()

		// Send the newly received message to the broadcast channel
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
			recentMessages = []Message{} // clear recent messages if no clients are connected
		}
		mu.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	// Start listening for incoming chat messages
	go handleMessages()

	// Load the secrets file
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalf("Error loading secrets file: %v", err)
	}

	// Get certfile and keyfile paths from environment variables
	certFile := os.Getenv("CERTFILE")
	keyFile := os.Getenv("KEYFILE")

	if certFile == "" || keyFile == "" {
		log.Fatal("Certfile or Keyfile path not set in secrets file")
	}

	// Log that the server is starting
	log.Printf("Starting server on :8443")

	// Start the HTTPS server
	err = http.ListenAndServeTLS(":8443", certFile, keyFile, nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
