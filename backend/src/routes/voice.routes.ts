import { Router } from 'express';
import { processVoice, generateSpeech } from '../controllers/voice.controller';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { voiceLimitMiddleware } from '../middleware/voiceLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { voiceTtsSchema } from '../validators';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', authenticate, voiceLimitMiddleware, upload.single('audio'), processVoice);
router.post('/tts', authenticate, validate({ body: voiceTtsSchema }), generateSpeech);

export default router;
