import { Router } from 'express';
import { processVoice } from '../controllers/voice.controller';

const router = Router();

// In a real app we'd use multer to handle multipart/form-data audio uploads
// For this mock MVP, we'll just accept a POST request.
router.post('/process', processVoice);

export default router;
