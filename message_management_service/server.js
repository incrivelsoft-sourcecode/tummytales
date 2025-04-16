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
app.use(cors({ origin: ["http://54.163.147.226:3000", "http://localhost:3000","https://tummytales.info"] }));

// Setup routes (if any)
app.get('/', (req, res) => {
    res.send('Socket.io server is running');
});


// Start server
server.listen(PORT, async() => {
    try {
        await Connection();
        console.log(`Server running on port: ${PORT}`);
        // Setup WebSocket connections
        await setupSocketConnection();

        // Setup socket events from message controller
        try {
            await setupSocketEvents();
        } catch (error) {
            console.error("Error setting up socket events:", error);
        }

    } catch (error) {
        console.error("Error starting server:", error);
    }
});
