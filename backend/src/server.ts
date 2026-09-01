import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customer.routes';
import transactionRoutes from './routes/transaction.routes';
import voiceRoutes from './routes/voice.routes';
import dashboardRoutes from './routes/dashboard.routes';
import waRoutes from './routes/whatsapp.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ------------------------------------------------------- CORS allowlist -- */

/**
 * Browser origins allowed to call the API. Production origins come from env
 * (`FRONTEND_URL`, plus any extras in `ALLOWED_ORIGINS`); development also
 * accepts Expo web hosts on the LAN so physical devices can reach the server.
 * Native apps don't send an Origin header and are always allowed.
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
  'http://localhost:8081',
  'http://127.0.0.1:8081',
]
  .map((o) => o && o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isLanDevOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|(?:192\.168|10)\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/.test(
    origin
  );

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // native apps, curl, server-to-server
      if (allowedOrigins.includes(origin) || (NODE_ENV !== 'production' && isLanDevOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

/* -------------------------------------------------------- request log -- */

// Minimal dependency-free request log; skip the health probe to avoid noise.
app.use((req: Request, _res, next) => {
  if (req.path !== '/health') {
    console.log(`→ ${req.method} ${req.path}`);
  }
  next();
});

/* --------------------------------------------------------- health/root -- */

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'BolKhata API',
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
    message: 'BolKhata Voice Ledger API is running',
    version: '3.0.0',
  });
});

/* ------------------------------------------------------------- routes -- */
// All feature routes verify the Supabase JWT and scope data to req.user.id.
// Authentication itself lives client-side in Supabase Auth, so there is no
// /auth route group.

app.use('/customers', customerRoutes);
app.use('/transactions', transactionRoutes);
app.use('/voice', voiceRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/wa', waRoutes);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [BolKhata Backend] Running on http://0.0.0.0:${PORT} (Ready for Mobile & Web)`);
});

// Graceful Shutdown
const handleGracefulShutdown = (signal: string) => {
  console.log(`\n🛑 [BolKhata Backend] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('✅ [BolKhata Backend] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
