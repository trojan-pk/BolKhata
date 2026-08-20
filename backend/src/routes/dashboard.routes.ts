import { Router } from 'express';
import { getDashboardInfo } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', getDashboardInfo);

export default router;
