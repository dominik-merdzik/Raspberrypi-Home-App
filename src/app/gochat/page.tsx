"use client";

import { useEffect, useState } from 'react';

import config from '../../../config.json';

interface Message {
    username: string;
    message: string;
    color: string;
}

const MAX_MESSAGE_LENGTH = 574;
const COOLDOWN_TIME = 5; //cooldown time in seconds
const CONNECTION_TIMEOUT = 7000; // 7 seconds timeout for connection

const GoChat = () => {
    const [username, setUsername] = useState<string>('');
    const [color, setColor] = useState<string>('#61dafb');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [chat, setChat] = useState<Message[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [charCount, setCharCount] = useState<number>(MAX_MESSAGE_LENGTH);
    const [cooldownTime, setCooldownTime] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [connectionFailed, setConnectionFailed] = useState<boolean>(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoggedIn) {
            setLoading(true);
            setConnectionFailed(false);

            // const socket = new WebSocket('ws://localhost:8080/ws');
            const socket = new WebSocket(config.localWebSocketURL);

            const timeoutId = setTimeout(() => {
                if (socket.readyState !== WebSocket.OPEN) {
                    socket.close(); // Close the socket if it's still trying to connect
                    setLoading(false);
                    setConnectionFailed(true);
                }
            }, CONNECTION_TIMEOUT);

            socket.onopen = () => {
                clearTimeout(timeoutId);
                socket.send(JSON.stringify({ username, color }));
                setLoading(false);
            };

            socket.onmessage = (event) => {
                const incomingMessage = JSON.parse(event.data);

                if (incomingMessage.message.includes("Username is already taken")) {
                    setUsernameError(incomingMessage.message);
                    setIsLoggedIn(false); //go back to login state to allow user to choose a new name
                    setWs(null);
                } else if (incomingMessage.message.includes("Please wait")) {
                    setCooldownTime(COOLDOWN_TIME);
                } else {
                    setChat((prevChat) => [...prevChat, incomingMessage]);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionFailed(true);
            };

            setWs(socket);

            return () => {
                clearTimeout(timeoutId);
                socket.close();
            };
        }
    }, [isLoggedIn]);

    const retryConnection = () => {
        setConnectionFailed(false);
        setIsLoggedIn(false); //resets the login state to allow re-login
    };

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownTime !== null) {
            if (cooldownTime > 0) {
                const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setCooldownTime(null);
            }
        }
    }, [cooldownTime]);

    const sendMessage = () => {
        if (ws && message.trim() && cooldownTime === null) {
            const newMessage = { username, message, color };
            ws.send(JSON.stringify(newMessage));
            setMessage('');
            setCharCount(MAX_MESSAGE_LENGTH);
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMessage = e.target.value;
        if (newMessage.length <= MAX_MESSAGE_LENGTH) {
            setMessage(newMessage);
            setCharCount(MAX_MESSAGE_LENGTH - newMessage.length);
        }
    };

    const handleLogin = () => {
        if (username.trim()) {
            setUsernameError(null);
            setIsLoggedIn(true);
        }
    };

    return (
        <div style={styles.container}>
            {!isLoggedIn ? (
                <div style={styles.loginContainer}>
                    <h2 style={styles.heading}>Enter Your Name and Choose a Color</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        placeholder="Your name"
                    />
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={styles.colorPicker}
                    />
                    {usernameError && <p style={styles.error}>{usernameError}</p>}
                    <button onClick={handleLogin} style={styles.button}>Join Chat</button>
                </div>
            ) : loading ? (
                <div style={styles.loadingContainer}>
                    <h2 style={styles.loadingText}>Connecting to chat...</h2>
                </div>
            ) : connectionFailed ? (
                <div style={styles.loadingContainer}>
                    <h2 style={styles.loadingText}>Hmm.. the connection failed.</h2>
                    <button onClick={retryConnection} style={styles.buttonError}>Retry</button>
                </div>
            ) : (
                <div style={styles.chatContainer}>
                    <div style={styles.headingContainer}>
                    <h1 style={styles.heading}>Blueberry Chat</h1>
                    <strong style={styles.headingUsername}>{username}</strong>
                    </div>
                    <div id="chatbox" style={styles.chatBox}>
                        {chat.map((msg, index) => (
                            <p
                                key={index}
                                style={msg.username === "System"
                                    ? { color: 'lightgray', opacity: 0.2 } //light grey for server messages
                                    : styles.chatMessage
                                }
                            >
                                <strong style={{ color: msg.username === "System" ? 'lightgray' : msg.color }}>
                                    {msg.username}:{" "}
                                </strong>
                                <span style={{ color: msg.username === "System" ? 'lightgray' : 'white' }}>
                                    {msg.message}
                                </span>
                            </p>
                        ))}
                    </div>
                    <input
                        type="text"
                        id="message"
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Enter message..."
                        style={styles.input}
                    />
                    <div style={styles.infoContainer}>
                        <span style={styles.timer}>
                            {cooldownTime !== null ? `Cooldown: ${cooldownTime}s` : null}
                        </span>
                        <span style={styles.charCounter}>{charCount} characters remaining</span>
                    </div>
                    <button onClick={sendMessage} style={styles.button} disabled={cooldownTime !== null}>
                        Send
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1A202C',
        color: 'white',
    },
    loginContainer: {
        textAlign: 'center' as const,
    },
    loadingContainer: {
        textAlign: 'center' as const,
    },
    loadingText: {
        width: '300px',
        fontSize: '20px',
        color: 'lightgray',
        marginBottom: '20px',
    },
    chatContainer: {
        width: '600px',
        padding: '20px',
        backgroundColor: '#333',
        borderRadius: '8px',
    },
    headingContainer: {
        display: 'flex',
        justifyContent: 'space-between' as const,
    },
    heading: {
        marginBottom: '20px',
    },
    headingUsername: {
        textAlign: 'right' as const,
        color: '#5f5f5f9b',
    },
    chatBox: {
        height: '500px',
        overflowY: 'scroll' as const,
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#222',
        borderRadius: '8px',
    },
    chatMessage: {
        marginBottom: '10px',
    },
    systemMessage: {
        marginBottom: '10px',
        color: 'lightgray',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #555',
        backgroundColor: '#444',
        color: 'white',
    },
    colorPicker: {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #555',
        backgroundColor: '#444',
        color: 'white',
    },
    infoContainer: {
        display: 'flex',
        justifyContent: 'space-between' as const,
        marginBottom: '10px',
        color: 'lightgray',
    },
    timer: {
        color: 'red',
    },
    charCounter: {
        textAlign: 'right' as const,
        color: 'lightgray',
    },
    button: {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#61dafb',
        border: 'none',
        color: '#000',
        cursor: 'pointer',
    },
    buttonError: {
        width: '75%',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#61dafb',
        border: 'none',
        color: '#000',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginTop: '10px',
    },
};

export default GoChat;
