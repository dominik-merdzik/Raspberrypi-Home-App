import { NextResponse } from 'next/server';
import net from 'net';
import { promisify } from 'util';

const userSockets: { [username: string]: net.Socket | null } = {};
const socketPath = '/tmp/go-server.sock';
const RECONNECT_INTERVAL = 5000; // 5 seconds

async function connectToSocket(username: string, color: string = '') { // set default value for color
    if (!userSockets[username]) {
        const socket = new net.Socket();
        const connect = promisify(socket.connect).bind(socket);

        try {
            await connect(socketPath);
            console.log(`Connected to Unix Domain Socket for user ${username}.`);
            userSockets[username] = socket;

            // send the username and color (if provided) immediately after connecting
            socket.write(`${username}:${color}\n`);
        } catch (err) {
            console.error(`Failed to connect to Unix Domain Socket for user ${username}:`, err);
            userSockets[username] = null;
            setTimeout(() => connectToSocket(username, color), RECONNECT_INTERVAL);
        }

        socket.on('close', () => {
            console.log(`Connection to Unix Domain Socket closed for user ${username}. Attempting to reconnect...`);
            userSockets[username] = null;
            setTimeout(() => connectToSocket(username, color), RECONNECT_INTERVAL);
        });

        socket.on('error', (err) => {
            console.error(`Unix Domain Socket error for user ${username}:`, err);
            socket.destroy();
            userSockets[username] = null;
            setTimeout(() => connectToSocket(username, color), RECONNECT_INTERVAL);
        });
    }
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);

        const { username, message, color } = body;

        if (!username || !color) {
            return NextResponse.json({ message: 'Username and color are required.' }, { status: 400 });
        }

        await connectToSocket(username, color); // pass both username and color

        if (message && userSockets[username]) {
            try {
                userSockets[username]?.write(`${username}: ${message}\n`);
                return NextResponse.json({ message: 'Message sent.' }, { status: 200 });
            } catch (err) {
                console.error(`Failed to send message for user ${username}:`, err);
                return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'User logged in.' }, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }
}

// get handler for streaming messages from Go server to the client
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ message: 'Username is required.' }, { status: 400 });
        }

        await connectToSocket(username); // pass username with default color

        const readableStream = new ReadableStream({
            start(controller) {
                const userSocket = userSockets[username];
                if (userSocket) {
                    userSocket.on('data', (data) => {
                        controller.enqueue(data);
                    });

                    userSocket.on('end', () => {
                        if (!controller.close) {
                            controller.close();
                        }
                    });

                    userSocket.on('error', (err) => {
                        console.error(`Error with Unix Domain Socket for user ${username}:`, err);
                        if (!controller.close) {
                            controller.error('Socket error');
                        }
                    });
                }
            },
            cancel() {
                const userSocket = userSockets[username];
                if (userSocket) {
                    userSocket.end();
                    userSockets[username] = null;
                }
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (err) {
        console.error('Failed to connect to Unix Domain Socket:', err);
        return NextResponse.json({ message: 'Failed to connect to Unix Domain Socket' }, { status: 500 });
    }
}
