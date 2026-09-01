import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardInfo } from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/', getDashboardInfo);

export default router;
