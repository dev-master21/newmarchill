import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { orderValidation, validate } from '../middleware/validation.middleware';

const router = Router();

// Customer routes
router.post('/', authenticate, orderValidation.create, validate, orderController.createOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrder);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), orderController.getAllOrders);
router.get('/admin/statistics', authenticate, authorize('admin'), orderController.getOrderStatistics);
router.put('/:id/status', authenticate, authorize('admin'), orderController.updateOrderStatus);
router.put('/:id/payment-status', authenticate, authorize('admin'), orderController.updatePaymentStatus);

export default router;