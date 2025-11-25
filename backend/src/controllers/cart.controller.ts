import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getCart = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const cartItems = await CartService.getCart(userId);
  
  // Форматируем ответ правильно
  const formattedItems = cartItems.map(item => ({
    id: item.id?.toString(),
    product_id: item.product_id,
    strain_id: item.strain_id,
    quantity: item.quantity,
    product: {
      id: item.product_id?.toString(),
      name: (item as any).product_name,
      price: (item as any).product_price,
      image: (item as any).product_image,
      type: (item as any).product_type,
      size: (item as any).product_size,
      stock: (item as any).stock_quantity || 0
    },
    strain: item.strain_id ? {
      id: item.strain_id,
      name: (item as any).strain_name
    } : null
  }));
  
  res.json({
    success: true,
    items: formattedItems // Важно: возвращаем массив в поле items
  });
});

export const addToCart = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { product_id, strain_id, quantity } = req.body;
  
  const cartItem = await CartService.addItem(
    userId,
    product_id,
    strain_id,
    quantity
  );
  
  res.json({
    success: true,
    item: cartItem
  });
});

export const updateCartItem = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const itemId = parseInt(req.params.id);
  const { quantity } = req.body;
  
  await CartService.updateQuantity(userId, itemId, quantity);
  
  res.json({
    success: true,
    message: 'Cart updated successfully'
  });
});

export const removeFromCart = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const itemId = parseInt(req.params.id);
  
  await CartService.removeItem(userId, itemId);
  
  res.json({
    success: true,
    message: 'Item removed from cart'
  });
});

export const clearCart = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  
  await CartService.clearCart(userId);
  
  res.json({
    success: true,
    message: 'Cart cleared successfully'
  });
});