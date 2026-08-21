import { Router } from 'express';
import { processVoice } from '../controllers/voice.controller';

import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.single('audio'), processVoice);

export default router;
