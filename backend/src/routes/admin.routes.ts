import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { asyncHandler } from '../middleware/error.middleware';
import * as strainController from '../controllers/strain.controller';
import * as promoController from '../controllers/promocode.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard statistics
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  // Get overall statistics
  const [orderStats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as orders_today,
      SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total ELSE 0 END) as revenue_30d
    FROM orders
  `);
  
  const [userStats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
    FROM users
    WHERE role = 'customer'
  `);
  
  const [productStats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN p.id IN (
        SELECT product_id FROM inventory WHERE (quantity - reserved_quantity) <= low_stock_threshold
      ) THEN 1 END) as low_stock_products
    FROM products p
    WHERE is_active = true
  `);
  
  // Get recent orders
  const [recentOrders] = await pool.execute<RowDataPacket[]>(`
    SELECT o.id, o.order_number, o.total, o.status, o.created_at,
           u.name as customer_name, u.email as customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);
  
  res.json({
    success: true,
    stats: {
      orders: orderStats[0],
      users: userStats[0],
      products: productStats[0],
      recentOrders
    }
  });
}));

// Strain management routes
router.get('/strains', strainController.getStrains);
router.get('/strains/:id', strainController.getStrain);
router.post('/strains', strainController.createStrain);
router.put('/strains/:id', strainController.updateStrain);
router.delete('/strains/:id', strainController.deleteStrain);

// Promo code management routes
router.get('/promo-codes', promoController.getAllPromoCodes);
router.get('/promo-codes/:id', promoController.getPromoCode);
router.post('/promo-codes', promoController.createPromoCode);
router.put('/promo-codes/:id', promoController.updatePromoCode);
router.delete('/promo-codes/:id', promoController.deletePromoCode);

export default router;