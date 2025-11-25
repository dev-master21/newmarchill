import express from 'express';
import { sendOrderToTelegram } from '../controllers/telegram.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// ВАЖНО: authenticate middleware обязателен
router.post('/send-order', authenticate, sendOrderToTelegram);

export default router;