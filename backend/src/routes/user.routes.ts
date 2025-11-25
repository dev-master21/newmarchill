import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, email, phone, role, points, level, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  
  res.json({
    success: true,
    users: rows,
    page,
    limit
  });
}));

// Get user statistics (admin only)
router.get('/statistics', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const [stats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
    FROM users
  `);
  
  res.json({
    success: true,
    statistics: stats[0]
  });
}));

export default router;