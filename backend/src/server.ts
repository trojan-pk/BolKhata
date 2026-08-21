import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import transactionRoutes from './routes/transaction.routes';
import voiceRoutes from './routes/voice.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins, methods, and headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json());

// Basic health check
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'BolKhata API is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/transactions', transactionRoutes);
app.use('/voice', voiceRoutes);
app.use('/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT} (all interfaces)`);
});
