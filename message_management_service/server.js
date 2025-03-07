const dotenv = require("dotenv");
dotenv.config();

// Import modules
const { app, server, setupSocketConnection } = require("./socket/socket.js");
const { setupSocketEvents } = require("./controller/messageController.js");
const cors = require("cors");
const Connection = require("./config/db.js");
const express = require("express");

// Get port from environment variables
const PORT = process.env.PORT || 5002;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Setup routes (if any)
app.get('/', (req, res) => {
    res.send('Socket.io server is running');
});

// Setup WebSocket connections
setupSocketConnection();

// Setup socket events from message controller
try {
    setupSocketEvents();
} catch (error) {
    console.error("Error setting up socket events:", error);
}

// Start server
server.listen(PORT, () => {
    try {
        Connection();
        console.log(`Server running on port: ${PORT}`);
    } catch (error) {
        console.error("Error starting server:", error);
    }
});