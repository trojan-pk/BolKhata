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

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
