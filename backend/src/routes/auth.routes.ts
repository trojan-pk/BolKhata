import { Router } from 'express';
import { login, signup, me } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', me);

export default router;
