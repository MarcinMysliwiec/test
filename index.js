const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const GLOBAL_ROOM = "global";
const URL = "localhost";
const PORT = 3333;
const server = http.createServer(app);
let onlineUsers = [];

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const getUsersFromRoom = (room) => {
  return onlineUsers.filter((obj) => obj.room === room);
};

io.on("connection", (socket) => {
  console.log("connection", socket);

  socket.on("join_global", ({ username }) => {
    console.log("join_global", username);

    socket.join(GLOBAL_ROOM);

    const userData = {
      username,
      socketId: socket.id,
      room: GLOBAL_ROOM,
    };

    onlineUsers.push(userData);

    socket.to(GLOBAL_ROOM).emit("bot_message", {
      username: "BOT",
      message: `${username} has joined.`,
      // type: "CONNECTION",
      // time: new Date().toISOString(),
    });

    socket.to(GLOBAL_ROOM).emit("users_in_room", onlineUsers);
  });

  socket.on("send_message", (msgObj) => {
    console.log("send_message", msgObj);
    socket.to(GLOBAL_ROOM).emit("receive_message", msgObj);
  });

  socket.on("disconnect", () => {
    const index = onlineUsers.findIndex((obj) => obj.socketId === socket.id);
    const disconnectedUser = onlineUsers[index];
    if (index < 0) return 0;

    onlineUsers = onlineUsers.filter((obj) => obj.socketId !== socket.id);
    socket.to(GLOBAL_ROOM).emit("bot_message", {
      username: "BOT",
      message: `${username} has left.`,
      // type: "CONNECTION",
      // time: new Date().toISOString(),
    });
    socket.to(GLOBAL_ROOM).emit("users_in_room", getUsersFromRoom(GLOBAL_ROOM));
  });
});

app.get("/users", (req, res) => {
  return res.status(200).json(getUsersFromRoom(req.query.room));
});

server.listen(PORT, URL, () => {
  console.log("SERVER RUNNING");
});
