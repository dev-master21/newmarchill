import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate); // All cart routes require authentication

router.get('/', cartController.getCart);
router.post(
  '/',
  [
    body('product_id').isInt().withMessage('Product ID must be an integer'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be positive')
  ],
  validate,
  cartController.addToCart
);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;