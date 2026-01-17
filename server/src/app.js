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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

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
