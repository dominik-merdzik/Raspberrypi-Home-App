// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToSocket, sendMessage, receiveMessages, disconnectUser } from '@/chat';

// Handling POST requests
export async function POST(req: NextRequest) {
    console.log('Handling POST request');
    const { username, message, color } = await req.json();

    if (!username || !color) {
        console.log('Missing username or color');
        return NextResponse.json({ success: false, error: 'Username and color are required' }, { status: 400 });
    }

    try {
        console.log(`Connecting to socket for user ${username} with color ${color}`);
        await connectToSocket(username, color);

        if (message) {
            console.log(`Sending message: ${message}`);
            await sendMessage(username, message, color);
        }

        console.log('Message sent successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in chat API during POST:', error);
        return NextResponse.json({ success: false, error: 'Failed to connect/send message' }, { status: 500 });
    }
}

// Handling GET requests
export async function GET(req: NextRequest) {
    console.log('Handling GET request');
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        console.log('Missing username');
        return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    try {
        console.log(`Receiving messages for user ${username}`);

        const stream = new ReadableStream({
            start(controller) {
                receiveMessages(username, (msg) => {
                    console.log('Received message:', msg);

                    // Only enqueue if the stream is still open
                    if (!controller.desiredSize || controller.desiredSize > 0) {
                        const encodedMessage = new TextEncoder().encode(JSON.stringify(msg) + '\n');
                        controller.enqueue(encodedMessage);
                    } else {
                        console.warn('Stream controller is already closed, skipping message.');
                    }
                });
            },
            cancel() {
                console.log(`Stream for user ${username} was cancelled`);
                disconnectUser(username);
            }
        });

        return new NextResponse(stream, {
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error) {
        console.error('Error receiving messages:', error);
        return NextResponse.json({ success: false, error: 'Failed to receive messages' }, { status: 500 });
    }
}
