const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);
const onlineUsers = {};
const badWords = require('bad-words');
const filter = new badWords();



const port = process.env.PORT || 3000;

const MESSAGE_EVENT = "chat message";

// Set up the static file directory
app.use(express.static(path.join(__dirname, "public")));

// Set up a route for the root URL path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("forceDisconnect", function () {
    socket.disconnect();
  });

  socket.on("connect", () => {
    const updatedUsername = getUniqueUsername(username);
    socket.emit("join room", { roomName, username: updatedUsername });
  });

  socket.on("join room", ({ roomName, username }) => {
    socket.join(roomName);
    if (!onlineUsers[roomName]) {
      onlineUsers[roomName] = [];
    }
    onlineUsers[roomName].push(username);
    io.to(roomName).emit("update online users", onlineUsers[roomName]);
    io.to(roomName).emit(
      MESSAGE_EVENT,
      `${username} has joined ${roomName} room`
    );
  });

  socket.on("chat message", ({ roomName, username, message }) => {
    if (filter.isProfane(message)) {
      // send a message to the user
      io.to(roomName).emit("chat message", `${username} have been disconnected for using inappropriate language.`);
      socket.disconnect()
    } else {
      console.log(`New message to room ${roomName} || ${username} => ${message}`);
      io.to(roomName).emit("chat message", `${username}: ${message}`);
    };
  });
  socket.on("disconnecting", () => {
    const rooms = Object.keys(socket.rooms);
    const roomName = rooms[1];
    if (onlineUsers[roomName]) {
      onlineUsers[roomName] = onlineUsers[roomName].filter(
        (username) => username !== socket.username
      );
      io.to(roomName).emit("update online users", onlineUsers[roomName]);
    }
  });

  // Emit a message when a user disconnects
  socket.on("disconnect", ({ roomName, username }) => {
    console.log("user disconnected");
    io.to(roomName).emit(
      MESSAGE_EVENT,
      `${username} has left ${roomName} room`
    );
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Error handling
server.on("error", (err) => {
  console.error(`Server error: ${err}`);
});

io.on("error", (err) => {
  console.error(`Socket.io error: ${err}`);
});

process.on("uncaughtException", (err) => {
  console.error(`Uncaught exception: ${err}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled rejection: ${err}`);
});
