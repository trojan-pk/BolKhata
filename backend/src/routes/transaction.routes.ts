import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  idParamsSchema,
} from '../validators';
import {
  listTransactions,
  createTransaction,
  getTransactionsByCustomer,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listTransactionsQuerySchema }), listTransactions);
router.post('/', validate({ body: createTransactionSchema }), createTransaction);
router.get('/customer/:id', validate({ params: idParamsSchema }), getTransactionsByCustomer);
router.put('/:id', validate({ params: idParamsSchema, body: updateTransactionSchema }), updateTransaction);
router.delete('/:id', validate({ params: idParamsSchema }), deleteTransaction);

export default router;
