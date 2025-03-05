const express = require("express");
const { app, server } = require("./socket/socket.js");
const { setupSocketConnection } = require("./socket/socket.js");
const { setupSocketEvents } = require("./controller/messageController.js");
const cors = require("cors");
const dotenv = require("dotenv");
const Connection = require("./config/db.js");

const PORT = process.env.PORT || 5000;

dotenv.config();




app.use(express.json());
app.use(cors({ origin: "*" }));
server.listen(PORT, () => {
    Connection();
    setupSocketConnection();
    setupSocketEvents();
    console.log(`server running on the port : ${PORT}`);
})