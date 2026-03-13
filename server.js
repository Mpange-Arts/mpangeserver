require("dotenv").config();
const http      = require("http");
const { Server } = require("socket.io");
const app       = require("./src/app");
const { connectDB } = require("./src/config/db");
const { initSocket } = require("./src/sockets");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:      [process.env.CLIENT_URL, process.env.ADMIN_URL],
    methods:     ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);
initSocket(io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`🔌 Socket.io ready`);
  });
};

start();
