import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import { initAgenda } from './src/config/agenda.js';
import { defineAgendaJobs } from './src/services/agendaJobs.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Start Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API available at: http://localhost:${PORT}/api`);
    });

    // Initialize Agenda in background
    console.log('📅 Initializing Agenda scheduler...');
    const agenda = initAgenda();
    defineAgendaJobs(agenda);
    agenda.start().then(() => {
      console.log('✅ Agenda scheduler started');
    }).catch(err => {
      console.error('❌ Agenda start error:', err);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
