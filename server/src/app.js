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

// Explicit CORS for Express
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://dharmic-marga.pages.dev',
    'https://dharmic-marga.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('CORS blocked (logging only mode):', origin);
            return callback(null, true);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

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

// MOUNTING FIX: Chat routes mounted at /api so /api/conversations works
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
    res.send('Dharmic Marga API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

initializeSocket(io, redisClient);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // REDIS OPTIONAL
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
