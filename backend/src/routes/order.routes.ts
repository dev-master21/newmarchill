import { Router, Request, Response } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { orderValidation, validate } from '../middleware/validation.middleware';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrder);


// Admin routes - Get all orders with details
router.get('/admin/all', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string || '';
  const search = (req.query.search as string || '').trim();

  let query = `
    SELECT 
      o.id,
      o.order_number,
      o.user_id,
      o.status,
      o.payment_status,
      o.payment_method,
      o.subtotal,
      o.discount_amount,
      o.delivery_fee,
      o.total,
      o.currency,
      o.delivery_method,
      o.delivery_name,
      o.delivery_phone,
      o.delivery_address,
      o.delivery_city,
      o.delivery_postal_code,
      o.delivery_country,
      o.gift_message,
      o.notes,
      o.tracking_number,
      o.created_at,
      o.updated_at,
      u.name as user_name,
      u.email as user_email,
      u.phone as user_phone,
      u.telegram_username as user_telegram,
      COUNT(oi.id) as items_count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;

  const params: any[] = [];

  // Status filter
  if (status && status !== 'ALL') {
    query += ` AND o.status = ?`;
    params.push(status);
  }

  // Search filter
  if (search) {
    query += ` AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.delivery_phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);

  // Convert numeric strings to numbers
  const orders = rows.map(order => ({
    ...order,
    subtotal: parseFloat(order.subtotal) || 0,
    discount_amount: parseFloat(order.discount_amount) || 0,
    delivery_fee: parseFloat(order.delivery_fee) || 0,
    total: parseFloat(order.total) || 0,
    items_count: parseInt(order.items_count) || 0
  }));

  // Get total count
  let countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1`;
  const countParams: any[] = [];

  if (status && status !== 'ALL') {
    countQuery += ` AND o.status = ?`;
    countParams.push(status);
  }

  if (search) {
    countQuery += ` AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.delivery_phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
  const total = countResult[0].total;

  res.json({
    success: true,
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Get order details with items
router.get('/admin/order/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ success: false, message: 'Invalid order ID' });
  }

  // Get order details
  const [orderRows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      o.*,
      u.name as user_name,
      u.email as user_email,
      u.phone as user_phone,
      u.telegram_username as user_telegram,
      u.telegram_id as user_telegram_id
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?`,
    [orderId]
  );

  if (orderRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const orderData = orderRows[0];

  // Get order items with product details
  const [itemsRows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      oi.*,
      p.name as product_name,
      p.image as product_image,
      p.type as product_type,
      s.name as strain_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN strains s ON oi.strain_id = s.id
    WHERE oi.order_id = ?`,
    [orderId]
  );

  // Convert numeric strings to numbers in items
  const items = itemsRows.map(item => ({
    ...item,
    quantity: parseInt(item.quantity) || 0,
    price: parseFloat(item.price) || 0,
    total: parseFloat(item.total) || 0
  }));

  // Convert numeric strings to numbers in order
  const order = {
    ...orderData,
    subtotal: parseFloat(orderData.subtotal) || 0,
    discount_amount: parseFloat(orderData.discount_amount) || 0,
    delivery_fee: parseFloat(orderData.delivery_fee) || 0,
    total: parseFloat(orderData.total) || 0,
    items
  };

  res.json({
    success: true,
    order
  });
}));

// Admin - Get order statistics
router.get('/admin/statistics', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const [stats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as orders_today,
      COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total ELSE 0 END), 0) as revenue_30d
    FROM orders
  `);

  const statistics = {
    total_orders: parseInt(stats[0].total_orders) || 0,
    pending_orders: parseInt(stats[0].pending_orders) || 0,
    processing_orders: parseInt(stats[0].processing_orders) || 0,
    delivered_orders: parseInt(stats[0].delivered_orders) || 0,
    cancelled_orders: parseInt(stats[0].cancelled_orders) || 0,
    orders_today: parseInt(stats[0].orders_today) || 0,
    total_revenue: parseFloat(stats[0].total_revenue) || 0,
    revenue_30d: parseFloat(stats[0].revenue_30d) || 0
  };

  res.json({
    success: true,
    statistics
  });
}));

// Update order status
router.put('/:id/status', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;

  if (isNaN(orderId)) {
    return res.status(400).json({ success: false, message: 'Invalid order ID' });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  await pool.execute(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, orderId]
  );

  res.json({
    success: true,
    message: 'Order status updated successfully'
  });
}));

// Update payment status
router.put('/:id/payment-status', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { payment_status } = req.body;

  if (isNaN(orderId)) {
    return res.status(400).json({ success: false, message: 'Invalid order ID' });
  }

  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status' });
  }

  await pool.execute(
    'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [payment_status, orderId]
  );

  res.json({
    success: true,
    message: 'Payment status updated successfully'
  });
}));

// Delete order
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ success: false, message: 'Invalid order ID' });
  }

  // Delete order items first
  await pool.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  
  // Delete order
  await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);

  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
}));

export default router;