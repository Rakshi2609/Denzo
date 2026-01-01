import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/database.js';
import { startAgenda } from './src/services/agendaJobs.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://apis.google.com",
        "https://accounts.google.com",
        "https://www.gstatic.com"
      ],
      frameAncestors: ["'self'"], 
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://tasktapper.firebaseapp.com", // Specific domain
        "https://tasktapper.web.app"          // Specific domain
      ],
      connectSrc: [
        "'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://firebase.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://lh3.googleusercontent.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  },
  // Add this to allow the popup to communicate back to your appcrossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "same-origin-allow-popups" },
  // crossOriginOpenerPolicy: { policy: "same-origin-allow-cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
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

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React Router - send all non-API requests to index.html
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    next();
  }
});

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
    await startAgenda();

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
