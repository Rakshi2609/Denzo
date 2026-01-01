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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- UPDATED MIDDLEWARE SECTION ---

// 1. Helmet Configuration
app.use(helmet({
  // Disabling CSP is the fastest way to fix Firebase blocks in monorepos.
  // If you need it later, you can re-enable it with very specific whitelists.
  contentSecurityPolicy: false, 
  // CRITICAL: This allows the Google Login popup to talk back to your Render app
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS Configuration
app.use(cors({
  // Ensure this matches your Render URL exactly (no trailing slash)
  origin: ['https://denzo.onrender.com', 'http://localhost:5173'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES & STATIC FILES ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api', routes);

// Serve static files from the client build folder
// Note: Adjusted path assuming your folder structure is /server/app.js and /client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React Router - Ensure non-API requests serve the frontend
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    next();
  }
});

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });

    await startAgenda();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;