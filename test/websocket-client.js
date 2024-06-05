const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const socket = new WebSocket('ws://localhost:5000');

socket.on('open', () => {
    console.log('WebSocket connection opened');
    socket.send(JSON.stringify({ type: 'joinChannel', channelId: 'fac994be-e642-4817-9c66-1c4390d0c172', userId: 'aa504d9d-aa97-415e-ac38-86f8b9c3a905' }));
    socket.send(JSON.stringify({ type: 'sendMessage', channelId: 'fac994be-e642-4817-9c66-1c4390d0c172', userId: 'aa504d9d-aa97-415e-ac38-86f8b9c3a905', content: 'Hello, World!' }));
});

socket.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('Message from server:', message);
    } catch (error) {
        console.log('Error parsing message:', error);
    }
});

socket.on('close', (code, reason) => {
    console.log(`WebSocket connection closed with code: ${code}, reason: ${reason}`);
});

socket.on('error', (error) => {
    console.log('WebSocket error:', error);
});
