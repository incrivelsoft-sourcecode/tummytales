const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"],
        credentials: true
    },
    pingTimeout: 60000, // 60 seconds (default 20000)
    pingInterval: 45000  // 45 seconds (default 25000)
});

// User socket mapping
const userSocketMap = {};

// Function to get receiver socket ID
const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Socket connection setup
const setupSocketConnection = () => {
    // Add more detailed logging
    io.engine.on("connection", (socket) => {
        console.log("Raw Socket.io engine connection established");
    });

    io.engine.on("error", (err) => {
        console.error("Socket.io engine error:", err);
    });

    // Handle socket connections
    io.on("connection", (socket) => {
        try {
            console.log("Socket.io connection established. Socket ID:", socket.id);
            // console.log("Handshake details:", socket.handshake);
            
            const userId = socket.handshake.query.userId;
            console.log("User ID from query:", userId);
            
            if (userId && userId !== "undefined") {
                userSocketMap[userId] = socket.id;
                console.log("Added user to socket map:", userId, "->", socket.id);
                console.log("Current user socket map:", userSocketMap);
            }
            
            // Set up a ping interval to keep the connection alive
            const pingInterval = setInterval(() => {
                socket.emit("ping");
            }, 20000);
            
            // Emit online users
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
            
            // Add test event for debugging
            socket.on("test", (data) => {
                console.log("Test event received:", data);
                socket.emit("testResponse", { message: "Test received!" });
            });
            
            // Handle disconnection
            socket.on("disconnect", () => {
                console.log("User disconnected", socket.id);
                clearInterval(pingInterval); // Clear the ping interval
                if (userId) {
                    delete userSocketMap[userId];
                }
                io.emit("getOnlineUsers", Object.keys(userSocketMap));
            });
            
            // Handle pong response
            socket.on("pong", () => {
                console.log("Received pong from client:", socket.id);
            });
        } catch (error) {
            console.error("Error in connection handler:", error);
        }
    });
};

module.exports = {
    app,
    server,
    io,
    getReceiverSocketId,
    userSocketMap,
    setupSocketConnection
};