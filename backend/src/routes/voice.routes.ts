import { Router } from 'express';
import { processVoice, generateSpeech } from '../controllers/voice.controller';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { voiceLimitMiddleware } from '../middleware/voiceLimit.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', authenticate, voiceLimitMiddleware, upload.single('audio'), processVoice);
router.post('/tts', authenticate, generateSpeech);

export default router;
