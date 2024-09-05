// chat/server.ts

import net from 'net';
import { promisify } from 'util';

const socketPath = '/tmp/go-server.sock';
const RECONNECT_INTERVAL = 5000; // 5 seconds

interface Message {
    username: string;
    message: string;
    color: string;
    isSystem: boolean;
}

interface UserConnection {
    socket: net.Socket | null;
    connected: boolean;
}

const userConnections: { [username: string]: UserConnection } = {};

// Function to connect to the Unix domain socket
async function connectToSocket(username: string, color: string = ''): Promise<net.Socket | null> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const connect = promisify(socket.connect).bind(socket);

        socket.on('connect', () => {
            console.log(`Connected to Go server as ${username}`);
            socket.write(`${username}:${color}\n`);
            userConnections[username] = { socket, connected: true };
            resolve(socket);
        });

        socket.on('close', () => {
            console.log(`Connection closed for user ${username}. Reconnecting...`);
            userConnections[username].connected = false;
            setTimeout(() => connectToSocket(username, color), RECONNECT_INTERVAL);
        });

        socket.on('error', (err) => {
            console.error(`Error on socket for user ${username}:`, err);
            socket.destroy();
            userConnections[username].connected = false;
            setTimeout(() => connectToSocket(username, color), RECONNECT_INTERVAL);
            reject(err);
        });

        socket.connect(socketPath);
    });
}

// Function to send a message
async function sendMessage(username: string, message: string, color: string): Promise<void> {
    const connection = userConnections[username];

    if (connection && connection.socket && connection.connected) {
        connection.socket.write(`${username}: ${message}\n`);
    } else {
        console.warn(`User ${username} is not connected. Attempting to reconnect...`);
        const socket = await connectToSocket(username, color);
        if (socket) {
            socket.write(`${username}: ${message}\n`);
        }
    }
}

// Function to receive messages from the Go server
async function receiveMessages(username: string, onMessage: (message: Message) => void): Promise<void> {
    const connection = userConnections[username];

    if (connection && connection.socket && connection.connected) {
        connection.socket.on('data', (data) => {
            const messages = data.toString().split('\n').filter(msg => msg.trim() !== '');
            messages.forEach((msg) => {
                const [user, message, color] = msg.split(':');
                onMessage({
                    username: user.trim(),
                    message: message.trim(),
                    color: color ? color.trim() : '#ffffff',
                    isSystem: user.trim() === 'System',
                });
            });
        });
    } else {
        console.warn(`User ${username} is not connected. Attempting to reconnect...`);
        await connectToSocket(username);
        receiveMessages(username, onMessage);
    }
}

// Function to disconnect a user
function disconnectUser(username: string): void {
    const connection = userConnections[username];
    if (connection && connection.socket) {
        connection.socket.end();
        connection.socket = null;
        connection.connected = false;
    }
}

export { connectToSocket, sendMessage, receiveMessages, disconnectUser };
