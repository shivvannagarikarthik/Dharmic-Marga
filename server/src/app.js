const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');
const redisClient = require('./config/redis');
const { User, Conversation, Message } = require('./models');
const initializeSocket = require('./socket');
const aiBot = require('./utils/aiBot');
const startCleanupJob = require('./cron/messageCleanup');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Socket.io CORS
    methods: ["GET", "POST"]
  }
});

// Explicit CORS for Express
app.use(cors({
  origin: ['https://dharmic-marga.pages.dev', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const groupRoutes = require('./routes/groupRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
  res.send('Dharmic Marga API is running');
});

initializeSocket(io, redisClient);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // REDIS OPTIONAL - Commented out to prevent crash if Redis is missing
    // if (!redisClient.isOpen) await redisClient.connect();
    
    await sequelize.authenticate();
    console.log('Database connected.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synced.');
    
    // Bot initialization needs DB
    await aiBot.initBot(); 
    startCleanupJob(); 

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer();
