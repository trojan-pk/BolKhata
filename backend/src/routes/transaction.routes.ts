import { Router } from 'express';
import { createTransaction, getTransactionsByCustomer } from '../controllers/transaction.controller';

const router = Router();

router.post('/', createTransaction);
router.get('/customer/:id', getTransactionsByCustomer);

export default router;
