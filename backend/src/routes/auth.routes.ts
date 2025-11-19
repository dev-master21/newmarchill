import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authValidation, validate } from '../middleware/validation.middleware';

const router = Router();

// Обычная авторизация/регистрация
router.post('/register', authValidation.register, validate, authController.register);
router.post('/login', authValidation.login, validate, authController.login);

// Telegram авторизация
router.get('/telegram/init', authController.initTelegramAuth);
router.post('/telegram/callback', authController.telegramAuthCallback);
router.post('/telegram/register', authValidation.registerTelegram, validate, authController.registerTelegram);

// Профиль
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.get('/achievements', authenticate, authController.getAchievements);

export default router;