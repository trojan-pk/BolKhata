import { Router } from 'express';
import { getCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer } from '../controllers/customer.controller';

const router = Router();

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
