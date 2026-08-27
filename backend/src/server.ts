import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import transactionRoutes from './routes/transaction.routes';
import voiceRoutes from './routes/voice.routes';
import dashboardRoutes from './routes/dashboard.routes';
import waRoutes from './routes/whatsapp.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security & CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Veldger API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req: Request, res: Response) => {
  // If requested by a web browser, redirect to the Expo frontend
  if (req.accepts('html') && !req.xhr) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    res.redirect(frontendUrl);
    return;
  }
  res.json({
    status: 'ok',
    message: 'Veldger Voice Ledger API is running',
    version: '2.0.0',
  });
});

// App Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/transactions', transactionRoutes);
app.use('/voice', voiceRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/wa', waRoutes);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Veldger Backend] Running on http://0.0.0.0:${PORT} (Ready for Mobile & Web)`);
});

// Graceful Shutdown
const handleGracefulShutdown = (signal: string) => {
  console.log(`\n🛑 [Veldger Backend] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('✅ [Veldger Backend] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
