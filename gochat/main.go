package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

// clientInfo stores username and color for each client
type ClientInfo struct {
	Username string
	Color    string
}

var clients = make(map[net.Conn]ClientInfo) // map of connections to ClientInfo
var broadcast = make(chan Message)
var recentMessages []Message
var mu sync.Mutex

// message defines our message object
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
	Color    string `json:"color"`
	IsSystem bool   `json:"isSystem"`
}

// anti-spam control
var lastMessageTimes = make(map[string]time.Time)
var messageCounts = make(map[string]int)

const spamThreshold = 3
const spamCooldown = 5 * time.Second

func sanitizeMessage(input string) string {
	return strings.ReplaceAll(input, "<", "&lt;")
}

func handleConnections(conn net.Conn) {
	defer func() {
		mu.Lock()
		delete(clients, conn)
		if len(clients) == 0 {
			recentMessages = nil // clear chat logs when no more users are connected
		}
		mu.Unlock()
		conn.Close()
		log.Printf("Connection closed by client %s", conn.RemoteAddr())
	}()

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("New connection established from %s", remoteAddr)

	reader := bufio.NewReader(conn)

	// read the first message to get the username and color
	usernameBytes, err := reader.ReadBytes('\n')
	if err != nil {
		if err == io.EOF {
			log.Printf("Connection closed by client %s", remoteAddr)
		} else {
			log.Printf("Error reading message: %v", err)
		}
		return
	}

	// expecting a message in the format "username:color"
	userInfo := strings.TrimSpace(string(usernameBytes))
	infoParts := strings.Split(userInfo, ":")
	if len(infoParts) < 2 {
		log.Printf("Invalid user info from client %s", remoteAddr)
		return
	}

	username := strings.TrimSpace(infoParts[0])
	color := strings.TrimSpace(infoParts[1])

	mu.Lock()
	clients[conn] = ClientInfo{Username: username, Color: color}
	mu.Unlock()

	// log the new user connection with bold username
	log.Printf("A new user \033[1m%s\033[0m has connected to the chat.", username)

	// send the last 5 messages to the new user
	mu.Lock()
	for _, msg := range recentMessages {
		if msg.IsSystem {
			fmt.Fprintf(conn, "System: %s\n", msg.Message)
		} else {
			fmt.Fprintf(conn, "%s: %s\n", msg.Username, msg.Message)
		}
	}
	mu.Unlock()

	// continue reading messages from the user
	for {
		messageBytes, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				log.Printf("Connection closed by client %s", remoteAddr)
			} else {
				log.Printf("Error reading message: %v", err)
			}
			return
		}

		messageText := strings.TrimSpace(string(messageBytes))

		// if the message is empty, skip processing
		if messageText == "" {
			continue
		}

		// remove any leading username from the messageText, if it exists
		if strings.HasPrefix(messageText, username+": ") {
			messageText = strings.TrimPrefix(messageText, username+": ")
		}

		// log the user's message
		log.Printf("\033[1m%s\033[0m sent message: \"%s\"", username, messageText)

		msg := Message{
			Username: username,
			Message:  sanitizeMessage(messageText),
			Color:    color,
			IsSystem: false,
		}

		mu.Lock()
		recentMessages = append(recentMessages, msg)
		if len(recentMessages) > 5 {
			recentMessages = recentMessages[1:] // keep only the last 5 messages
		}
		mu.Unlock()

		broadcast <- msg

		// spam detection and timeout
		now := time.Now()
		lastMsgTime, exists := lastMessageTimes[username]
		if exists && now.Sub(lastMsgTime) < spamCooldown {
			messageCounts[username]++
			if messageCounts[username] >= spamThreshold {
				systemMsg := Message{
					Username: "System",
					Message:  "You are being timed out for 5 seconds due to spamming.",
					Color:    "#00FF00", // green color for system messages
					IsSystem: true,
				}

				mu.Lock()
				recentMessages = append(recentMessages, systemMsg)
				if len(recentMessages) > 5 {
					recentMessages = recentMessages[1:] // keep only the last 5 messages
				}
				mu.Unlock()

				// send the system message only to the specific user
				fmt.Fprintf(conn, "System: %s\n", systemMsg.Message)

				// handle timeout by waiting 5 seconds before allowing more messages
				time.Sleep(spamCooldown)
				messageCounts[username] = 0 // reset the spam counter
			}
		} else {
			messageCounts[username] = 1
			lastMessageTimes[username] = now
		}
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		mu.Lock()
		for client := range clients {
			if msg.IsSystem {
				continue // skip system messages in the general broadcast
			}
			// send the username, message, and color
			_, err := fmt.Fprintf(client, "%s:%s:%s\n", msg.Username, msg.Message, msg.Color)
			if err != nil {
				log.Printf("Error sending message: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
		mu.Unlock()
	}
}

func main() {
	socketPath := "/tmp/go-server.sock"

	// clean up any previous socket file
	if err := os.RemoveAll(socketPath); err != nil {
		log.Fatalf("Error removing old socket file: %v", err)
	}

	// create a listener on the Unix socket
	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatalf("Error creating Unix socket listener: %v", err)
	}
	defer listener.Close()

	go handleMessages()

	log.Printf("Starting server on %s", socketPath)
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		go handleConnections(conn)
	}
}
