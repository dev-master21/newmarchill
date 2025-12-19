import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Get user statistics (admin only) - ВАЖНО: этот роут должен быть ПЕРЕД /:id
router.get('/statistics', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const [stats] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
      COUNT(CASE WHEN telegram_id IS NOT NULL THEN 1 END) as telegram_users,
      COUNT(CASE WHEN email IS NOT NULL AND telegram_id IS NULL THEN 1 END) as email_users
    FROM users
  `);
  
  res.json({
    success: true,
    statistics: stats[0]
  });
}));

// Get user preferences (for current user)
router.get('/preferences', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT preferred_whatsapp, preferred_telegram, preferred_phone_contact,
            preferred_payment_methods, saved_delivery_address, saved_delivery_coordinates
     FROM users WHERE id = ?`,
    [userId]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.json({
    success: true,
    preferences: rows[0]
  });
}));

// Update user preferences (for current user)
router.put('/preferences', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const {
    preferred_whatsapp,
    preferred_telegram,
    preferred_phone_contact,
    preferred_payment_methods,
    saved_delivery_address,
    saved_delivery_coordinates
  } = req.body;
  
  await pool.execute(
    `UPDATE users SET 
      preferred_whatsapp = ?,
      preferred_telegram = ?,
      preferred_phone_contact = ?,
      preferred_payment_methods = ?,
      saved_delivery_address = ?,
      saved_delivery_coordinates = ?
     WHERE id = ?`,
    [
      preferred_whatsapp || null,
      preferred_telegram || null,
      preferred_phone_contact || null,
      preferred_payment_methods ? JSON.stringify(preferred_payment_methods) : null,
      saved_delivery_address || null,
      saved_delivery_coordinates ? JSON.stringify(saved_delivery_coordinates) : null,
      userId
    ]
  );
  
  res.json({
    success: true,
    message: 'Preferences saved successfully'
  });
}));

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string || '').trim();
  const role = req.query.role as string || '';
  const status = req.query.status as string || '';
  
  let query = `
    SELECT 
      id,
      name,
      email,
      phone,
      username,
      telegram_id,
      telegram_username,
      first_name,
      last_name,
      role,
      points,
      level,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR username LIKE ? OR telegram_username LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (role && role !== 'ALL') {
    query += ` AND role = ?`;
    params.push(role);
  }
  
  if (status === 'active') {
    query += ` AND is_active = 1`;
  } else if (status === 'inactive') {
    query += ` AND is_active = 0`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  
  const userIds = rows.map((user: any) => user.id);
  let orderStats: any[] = [];
  
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        user_id,
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE user_id IN (${placeholders})
      GROUP BY user_id`,
      userIds
    );
    orderStats = stats;
  }
  
  const usersWithStats = rows.map((user: any) => {
    const userStat = orderStats.find((stat: any) => stat.user_id === user.id);
    return {
      ...user,
      total_orders: userStat?.total_orders || 0,
      total_spent: parseFloat(userStat?.total_spent || 0),
      last_order_date: userStat?.last_order_date || null
    };
  });
  
  let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
  const countParams: any[] = [];
  
  if (search) {
    countQuery += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR username LIKE ? OR telegram_username LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (role && role !== 'ALL') {
    countQuery += ` AND role = ?`;
    countParams.push(role);
  }
  
  if (status === 'active') {
    countQuery += ` AND is_active = 1`;
  } else if (status === 'inactive') {
    countQuery += ` AND is_active = 0`;
  }
  
  const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
  const total = countResult[0].total;
  
  res.json({
    success: true,
    users: usersWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Get user by ID with detailed info (admin only)
router.get('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  
  const [userRows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM users WHERE id = ?`,
    [userId]
  );
  
  if (userRows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  const user = userRows[0];
  delete user.password;
  
  const [orderStats] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total_spent,
      MAX(created_at) as last_order_date
    FROM orders
    WHERE user_id = ?`,
    [userId]
  );
  
  const [orders] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_number, status, payment_status, total, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5`,
    [userId]
  );
  
  res.json({
    success: true,
    user: {
      ...user,
      total_orders: orderStats[0]?.total_orders || 0,
      total_spent: parseFloat(orderStats[0]?.total_spent || 0),
      last_order_date: orderStats[0]?.last_order_date || null
    },
    recentOrders: orders
  });
}));

// Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  
  const { name, email, phone, role, is_active, level, points } = req.body;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }
  if (level !== undefined) {
    updates.push('level = ?');
    params.push(level);
  }
  if (points !== undefined) {
    updates.push('points = ?');
    params.push(points);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  
  params.push(userId);
  
  await pool.execute(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );
  
  res.json({
    success: true,
    message: 'User updated successfully'
  });
}));

export default router;