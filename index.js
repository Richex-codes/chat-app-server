require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appUsers = require('./routes/index');
const { Server } = require('socket.io');


const app = express();
app.use(express.json());
app.use(cors());

// Socket.io setup
const server = app.listen(3001, () => console.log('Server is running on port 3001'));
const io = new Server(server, {
    path: '/socket.io',
    serveClient: false,
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});

// Socket.io setup and message queue implementation
let users = {};

const dashboardNamespace = io.of('/dashboard');
dashboardNamespace.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('user', (username) => {
        users[username] = { 
            socketId: socket.id,
            messagesQueue: [] // Queue for unsent messages
        };
        dashboardNamespace.emit('connectedUsers', Object.keys(users));
        console.log('Client connected:', username);
        
        // Send unsent messages if any
        if (users[username].messagesQueue.length > 0) {
            users[username].messagesQueue.forEach(message => {
                socket.emit('privateMessage', message);
            });
            users[username].messagesQueue = []; // Clear the queue after sending
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        for (let [username, userData] of Object.entries(users)) {
            if (userData.socketId === socket.id) {
                delete users[username];
                break;
            }
        }
        dashboardNamespace.emit('connectedUsers', Object.keys(users));
    });

    let typingTimeout;

    socket.on('active', ({ to }) => {
        if (typingTimeout) clearTimeout(typingTimeout);
        const targetSocketId = users[to] ? users[to].socketId : null;
        if (targetSocketId) {
            dashboardNamespace.to(targetSocketId).emit('activated', `Typing...`);
        }
        typingTimeout = setTimeout(() => {
            if (targetSocketId) {
                dashboardNamespace.to(targetSocketId).emit('activated', '');
            }
        }, 500);
    });

    socket.on('privateMessage', ({ from, to, message, time }) => {
        console.log(`Private message from ${from} to ${to} at ${time}: ${message}`);
        const targetSocketId = users[to] ? users[to].socketId : null;
        if (targetSocketId) {
            dashboardNamespace.to(targetSocketId).emit('privateMessage', {
                from: from,
                message: message,
                time: time
            });
            console.log('Private message sent successfully');
        } else {
            console.log(`User ${to} not found, storing message for later`);
            if (!users[to]) {
                users[to] = { messagesQueue: [] };
            }
            users[to].messagesQueue.push({ from, message, time }); // Store message in queue
        }
    });
});


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch((error) => {
        console.error('Error connecting to the database:', error);
    });

app.use('/', appUsers);
