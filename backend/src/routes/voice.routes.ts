import { Router } from 'express';
import { processVoice, generateSpeech } from '../controllers/voice.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.single('audio'), processVoice);
router.post('/tts', generateSpeech);

export default router;
