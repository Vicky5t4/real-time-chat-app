require('dotenv').config();   // 👈 .env load karne ke liye
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const Message = require('./models/Message');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// HTTP + Socket.io server
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
app.set('io', io);

// Socket.io events
io.on('connection', (socket) => {
  console.log('⚡ New client connected');

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`📌 User ${userId} joined room`);
  });

  socket.on('send_message', async (message) => {
    console.log('📨 Message received on server', message);
    const { from, to, content, timestamp } = message;

    if (from && to && content) {
      const newMessage = new Message({ from, to, content, timestamp });
      await newMessage.save();

      io.to(to).emit('receive_message', message);
    } else {
      console.error('❌ Message is missing from/to/content');
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
