import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { CartService } from '../services/cart.service';
import { PromoCodeService } from '../services/promocode.service';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const createOrder = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { 
    delivery_method,
    delivery_name,
    delivery_phone,
    delivery_address,
    delivery_city,
    delivery_postal_code,
    delivery_country,
    payment_method,
    gift_message,
    notes,
    promo_code,
    currency
  } = req.body;
  
  const orderCurrency = currency || 'THB';
  
  // Get cart items
  const cartItems = await CartService.getCart(userId);
  
  if (cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  
  // Calculate subtotal
  let subtotal = 0;
  const orderItems = cartItems.map(item => {
    const price = (item.product as any).price;
    const total = price * item.quantity;
    subtotal += total;
    
    return {
      product_id: item.product_id,
      strain_id: item.strain_id,
      quantity: item.quantity,
      price: price,
      total: total
    };
  });
  
  // Calculate delivery fee
  const deliveryFee = delivery_method === 'express' ? 200 : 100;
  
  // Apply promo code if provided
  let discountAmount = 0;
  let promoCodeId = null;
  
if (promo_code) {
  const promoResult = await PromoCodeService.validatePromoCode(
    promo_code,
    userId,
    subtotal,
    cartItems.map(item => item.product_id),
    orderCurrency
  );
  
  if (!promoResult.valid) {
    throw new AppError(promoResult.message || 'Invalid promo code', 400);
  }
  
  discountAmount = promoResult.discount;
  const promo = await PromoCodeService.findByCode(promo_code);
  if (promo) {
    promoCodeId = promo.id;
  }
}
  
  // Check for free delivery
  const totalBeforeDelivery = subtotal - discountAmount;
  const finalDeliveryFee = totalBeforeDelivery >= 2500 ? 0 : deliveryFee;
  
  // Create order
// Create order
const order = await OrderService.create(userId, {
  items: orderItems,
  subtotal,
  discount_amount: discountAmount,
  delivery_fee: finalDeliveryFee,
  total: totalBeforeDelivery + finalDeliveryFee,
  currency: orderCurrency,
  delivery_method,
  delivery_name,
  delivery_phone,
  delivery_address,
  delivery_city,
  delivery_postal_code,
  delivery_country,
  payment_method,
  gift_message,
  notes
});
  
  // Record promo code usage
  if (promoCodeId) {
    await PromoCodeService.recordUsage(promoCodeId, userId);
  }
  
  res.status(201).json({
    success: true,
    order
  });
});

export const getOrders = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const filters = {
    status: req.query.status,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10
  };
  
  const orders = await OrderService.findByUserId(userId, filters);
  
  res.json({
    success: true,
    orders,
    page: filters.page,
    limit: filters.limit
  });
});

export const getOrder = asyncHandler(async (req: any, res: Response) => {
  const orderId = parseInt(req.params.id);
  const order = await OrderService.findById(orderId);
  
  // Check if user owns this order
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }
  
  res.json({
    success: true,
    order
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status,
    payment_status: req.query.payment_status,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20
  };
  
  const orders = await OrderService.findAll(filters);
  
  res.json({
    success: true,
    orders,
    page: filters.page,
    limit: filters.limit
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { status, tracking_number } = req.body;
  
  const order = await OrderService.updateStatus(orderId, status, tracking_number);
  
  res.json({
    success: true,
    order
  });
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { payment_status } = req.body;
  
  const order = await OrderService.updatePaymentStatus(orderId, payment_status);
  
  res.json({
    success: true,
    order
  });
});

export const getOrderStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const stats = await OrderService.getStatistics(
    date_from ? new Date(date_from as string) : undefined,
    date_to ? new Date(date_to as string) : undefined
  );
  
  res.json({
    success: true,
    statistics: stats
  });
});