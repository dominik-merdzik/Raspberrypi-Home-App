"use client";

import { useEffect, useState, CSSProperties } from 'react';

interface Message {
    username: string;
    message: string;
    color: string;
    isSystem: boolean;
}

const MAX_MESSAGE_LENGTH = 574;
const COOLDOWN_TIME = 5; // cooldown time in seconds
const CONNECTION_TIMEOUT = 7000; // 7 seconds timeout for connection

const GoChat = () => {
    const [username, setUsername] = useState<string>('');
    const [color, setColor] = useState<string>('#61dafb');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [chat, setChat] = useState<Message[]>([]);
    const [charCount, setCharCount] = useState<number>(MAX_MESSAGE_LENGTH);
    const [cooldownTime, setCooldownTime] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [connectionFailed, setConnectionFailed] = useState<boolean>(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    const retryConnection = () => {
        setConnectionFailed(false);
        setIsLoggedIn(false); // resets the login state to allow re-login
    };

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

    const sendMessage = async () => {
        if (message.trim() && cooldownTime === null) {
            const newMessage = { username, message, color, isSystem: false };
            try {
                const response = await fetch('/api/goChat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newMessage),
                });

                if (!response.ok) {
                    console.error('Failed to send message:', await response.text());
                } else {
                    setMessage('');
                    setCharCount(MAX_MESSAGE_LENGTH);
                }
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMessage = e.target.value;
        if (newMessage.length <= MAX_MESSAGE_LENGTH) {
            setMessage(newMessage);
            setCharCount(MAX_MESSAGE_LENGTH - newMessage.length);
        }
    };

    const handleLogin = async () => {
        if (username.trim()) {
            setUsernameError(null);
            setLoading(true);
            setConnectionFailed(false);

            try {
                const response = await fetch('/api/goChat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, color }),
                });

                if (response.ok) {
                    setLoading(false);
                    setIsLoggedIn(true);
                } else {
                    setUsernameError('Failed to connect');
                    setLoading(false);
                    setConnectionFailed(true);
                }
            } catch (error) {
                console.error('Connection error:', error);
                setConnectionFailed(true);
            }
        }
    };

    const fetchMessages = async (username: string) => {
        try {
            const response = await fetch(`/api/goChat?username=${encodeURIComponent(username)}`);
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let partialMessage = '';

            if (reader) {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    partialMessage += chunk;

                     // log the chunk received from the API
                     console.log(`Chunk received: ${chunk}`);

                    const messages = partialMessage.split('\n');
                    partialMessage = messages.pop() || '';

                    messages.forEach((messageStr) => {
                        if (messageStr.trim()) {
                            const [username, message] = messageStr.split(':');
                            const userColor = chat.find(msg => msg.username === username.trim())?.color || '#ffffff';
                            setChat((prevChat) => [...prevChat, { username: username.trim(), message: message?.trim() || '', color: username === "System" ? "#00FF00" : userColor, isSystem: username === "System" }]);
                        }
                    });
                }

                if (partialMessage.trim()) {
                    const [username, message] = partialMessage.split(':');
                    const userColor = chat.find(msg => msg.username === username.trim())?.color || '#ffffff';
                    setChat((prevChat) => [...prevChat, { username: username.trim(), message: message?.trim() || '', color: username === "System" ? "#00FF00" : userColor, isSystem: username === "System" }]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchMessages(username);
        }
    }, [isLoggedIn]);

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
                            <div key={index} style={msg.isSystem ? { padding: '10px', backgroundColor: '#222', borderRadius: '8px' } : {}}>
                                <p style={{ color: msg.isSystem ? '#00FF00' : 'white', opacity: msg.isSystem ? 1 : undefined }}>
                                    <strong style={{ color: msg.color }}>
                                        {msg.username !== "System" ? `${msg.username}: ` : ''}
                                    </strong>
                                    <span>
                                        {msg.message}
                                    </span>
                                </p>
                            </div>
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
                            {cooldownTime !== null ? `${cooldownTime}s` : null}
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

// Explicitly typing the styles object as a CSSProperties type
const styles: Record<string, CSSProperties> = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1A202C',
        color: 'white',
    },
    loginContainer: {
        textAlign: 'center',
    },
    loadingContainer: {
        textAlign: 'center',
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
        justifyContent: 'space-between',
    },
    heading: {
        marginBottom: '20px',
    },
    headingUsername: {
        textAlign: 'right',
        color: '#5f5f5f9b',
    },
    chatBox: {
        height: '500px',
        overflowY: 'scroll',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#222',
        borderRadius: '8px',
    },
    chatMessage: {
        marginBottom: '10px',
        color: 'white',
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
        justifyContent: 'space-between',
        marginBottom: '10px',
        color: 'lightgray',
    },
    timer: {
        color: 'red',
    },
    charCounter: {
        textAlign: 'right',
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
