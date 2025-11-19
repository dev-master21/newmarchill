import { Router } from 'express';
import * as promoController from '../controllers/promocode.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/', authenticate, requireAdmin, promoController.getAllPromoCodes);
router.get('/:id', authenticate, requireAdmin, promoController.getPromoCode);
router.get('/:id/stats', authenticate, requireAdmin, promoController.getPromoCodeStats);
router.post('/', authenticate, requireAdmin, promoController.createPromoCode);
router.put('/:id', authenticate, requireAdmin, promoController.updatePromoCode);
router.delete('/:id', authenticate, requireAdmin, promoController.deletePromoCode);

// User route для валидации
router.post('/validate', authenticate, promoController.validatePromoCode);

export default router;