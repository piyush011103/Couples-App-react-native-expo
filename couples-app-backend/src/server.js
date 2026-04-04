import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import countdownRoutes from './routes/countdownRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import initializeSockets from './sockets/socketHandlers.js';
import { setIO } from './controllers/authController.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // For dev - strictly set this in production
        methods: ['GET', 'POST']
    }
});

// Share io with auth controller (for partner-connected notifications)
setIO(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/countdown', countdownRoutes);
app.use('/api/game', gameRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Couples App Backend is running');
});

// Socket.io connection handling
initializeSockets(io);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
