import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  idParamsSchema,
} from '../validators';
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', validate({ body: createCustomerSchema }), createCustomer);
router.get('/:id', validate({ params: idParamsSchema }), getCustomerById);
router.put('/:id', validate({ params: idParamsSchema, body: updateCustomerSchema }), updateCustomer);
router.delete('/:id', validate({ params: idParamsSchema }), deleteCustomer);

export default router;
