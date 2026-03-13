const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");

const onlineUsers = new Map();

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await prisma.user.findUnique({
        where:  { id: decoded.id },
        select: { id: true, name: true, avatarUrl: true, role: true },
      });
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`);
    io.emit("online_count", onlineUsers.size);

    socket.on("join_room",  (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user_joined", { user: socket.user, roomId });
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user_left", { user: socket.user, roomId });
    });

    socket.on("send_message", ({ roomId, message }) => {
      io.to(roomId).emit("new_message", { user: socket.user, message, timestamp: new Date() });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online_count", onlineUsers.size);
      console.log(`🔌 Disconnected: ${socket.user.name}`);
    });
  });
};

const emitToUser = (io, userId, event, data) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) io.to(socketId).emit(event, data);
};

module.exports = { initSocket, emitToUser };
