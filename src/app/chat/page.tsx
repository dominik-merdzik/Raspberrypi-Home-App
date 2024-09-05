"use client";

import { useEffect, useState, CSSProperties } from "react";

interface Message {
    username: string;
    message: string;
    color: string;
    isSystem: boolean;
}

const MAX_MESSAGE_LENGTH = 574;
const COOLDOWN_TIME = 5; // cooldown time in seconds

const chat = () => {
    const [username, setUsername] = useState<string>('');
    const [color, setColor] = useState<string>('#61dafb');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [chat, setChat] = useState<Message[]>([]);
    const [charCount, setCharCount] = useState<number>(MAX_MESSAGE_LENGTH);
    const [cooldownTime, setCooldownTime] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);

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

    const handleLogin = async () => {
        if (username.trim()) {
            setUsernameError(null);
            setLoading(true);

            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, color }),
                });
                setIsLoggedIn(true);
                setLoading(false);
                fetchMessages(username);
            } catch (error) {
                console.error('Connection error:', error);
                setUsernameError('Failed to connect');
                setLoading(false);
            }
        }
    };

    const sendMessageHandler = async () => {
        if (message.trim() && cooldownTime === null) {
            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, message, color }),
                });
                setMessage('');
                setCharCount(MAX_MESSAGE_LENGTH);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const fetchMessages = async (username: string) => {
        try {
            const response = await fetch(`/api/chat?username=${encodeURIComponent(username)}`);
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let partialMessage = '';
            while (true) {
                const { value, done } = await reader?.read()!;
                if (done) break;

                const chunk = decoder.decode(value);
                partialMessage += chunk;

                const messages = partialMessage.split('\n');
                partialMessage = messages.pop()!; // Save the incomplete message

                messages.forEach((msgStr) => {
                    const msg = JSON.parse(msgStr);
                    setChat((prevChat) => [...prevChat, msg]);
                });
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMessage = e.target.value;
        if (newMessage.length <= MAX_MESSAGE_LENGTH) {
            setMessage(newMessage);
            setCharCount(MAX_MESSAGE_LENGTH - newMessage.length);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setChat([]);
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
            ) : (
                <div style={styles.chatContainer}>
                    <div style={styles.headingContainer}>
                        <h1 style={styles.heading}>Blueberry Chat</h1>
                        <strong style={styles.headingUsername}>{username}</strong>
                        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                    </div>
                    <div id="chatbox" style={styles.chatBox}>
                        {chat.map((msg, index) => (
                            <div key={index} style={msg.isSystem ? styles.systemMessage : {}}>
                                <p style={{ color: msg.isSystem ? '#00FF00' : 'white' }}>
                                    <strong style={{ color: msg.color }}>
                                        {msg.username !== "System" ? `${msg.username}: ` : ''}
                                    </strong>
                                    <span>{msg.message}</span>
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
                    <button onClick={sendMessageHandler} style={styles.button} disabled={cooldownTime !== null}>
                        Send
                    </button>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, CSSProperties> = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#282c34',
        color: 'white',
    },
    loginContainer: {
        textAlign: 'center' as const,
    },
    heading: {
        fontSize: '2em',
    },
    input: {
        margin: '10px 0',
        padding: '10px',
        fontSize: '1em',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    colorPicker: {
        margin: '10px 0',
        width: '100px',
        height: '40px',
        cursor: 'pointer',
    },
    button: {
        padding: '10px 20px',
        fontSize: '1em',
        backgroundColor: '#61dafb',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    loadingContainer: {
        textAlign: 'center' as const,
    },
    loadingText: {
        fontSize: '1.5em',
    },
    chatContainer: {
        width: '400px',
        textAlign: 'left' as const,
    },
    headingContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headingUsername: {
        fontSize: '1.2em',
        color: '#61dafb',
    },
    logoutButton: {
        padding: '5px 10px',
        backgroundColor: '#ff4d4d',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
    },
    chatBox: {
        textAlign: 'left',
        marginTop: '20px',
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: '#333',
        height: '300px',
        overflowY: 'scroll' as const,
        borderRadius: '4px',
    },
    systemMessage: {
        padding: '10px',
        backgroundColor: '#222',
        borderRadius: '8px',
    },
    infoContainer: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    timer: {
        color: 'red',
    },
    charCounter: {
        textAlign: 'left',
        color: '#aaa',

    },
    error: {
        color: 'red',
    },
};

export default chat;
