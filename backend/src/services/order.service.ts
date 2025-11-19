import pool from '../config/database';
import { Order, OrderItem, User } from '../types';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { generateOrderNumber } from '../utils/auth.utils';
import { InventoryService } from './inventory.service';
import { UserService } from './user.service';

export class OrderService {
  static async create(userId: number, orderData: Partial<Order>): Promise<Order> {
    const connection: PoolConnection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Generate unique order number
      const orderNumber = generateOrderNumber();
      
      // Validate and reserve inventory
      if (!orderData.items || orderData.items.length === 0) {
        throw new AppError('Order must contain at least one item', 400);
      }
      
      // Check stock availability
      for (const item of orderData.items) {
        const available = await InventoryService.checkAvailability(
          item.product_id!,
          item.quantity
        );
        
        if (!available) {
          throw new AppError(`Product ${item.product_id} is out of stock`, 400);
        }
      }
      
      // Calculate totals
      let subtotal = 0;
      for (const item of orderData.items) {
        item.total = item.price * item.quantity;
        subtotal += item.total;
      }
      
      const discountAmount = orderData.discount_amount || 0;
      const deliveryFee = orderData.delivery_fee || 0;
      const total = subtotal - discountAmount + deliveryFee;
      
      // Create order
// Create order
const [orderResult] = await connection.execute<ResultSetHeader>(
  `INSERT INTO orders (
    order_number, user_id, status, subtotal, discount_amount, 
    delivery_fee, total, currency, delivery_method, payment_method, payment_status,
    delivery_name, delivery_phone, delivery_address, delivery_city,
    delivery_postal_code, delivery_country, gift_message, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    orderNumber,
    userId,
    'pending',
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    orderData.currency || 'THB',
    orderData.delivery_method || 'standard',
    orderData.payment_method || 'pending',
    'pending',
    orderData.delivery_name,
    orderData.delivery_phone,
    orderData.delivery_address,
    orderData.delivery_city,
    orderData.delivery_postal_code,
    orderData.delivery_country || 'Thailand',
    orderData.gift_message || null,
    orderData.notes || null
  ]
);
      
      const orderId = orderResult.insertId;
      
      // Create order items
      for (const item of orderData.items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, strain_id, quantity, price, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.strain_id || null,
            item.quantity,
            item.price,
            item.total
          ]
        );
        
        // Reserve inventory directly (instead of calling non-existent reserve method)
        await connection.execute(
          `UPDATE inventory 
           SET reserved_quantity = reserved_quantity + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }
      
      await connection.commit();
      
      // Award points to user
      const pointsEarned = Math.floor(total * 0.1); // 10% of order total
      await UserService.updatePoints(userId, pointsEarned);
      
      // Get complete order
      return this.findById(orderId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async findById(id: number): Promise<Order> {
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (orderRows.length === 0) {
      throw new AppError('Order not found', 404);
    }
    
    const order = orderRows[0] as Order;
    
    // Get order items
    const [itemRows] = await pool.execute<RowDataPacket[]>(
      `SELECT oi.*, p.name as product_name, p.image as product_image,
              s.name as strain_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN strains s ON oi.strain_id = s.id
       WHERE oi.order_id = ?`,
      [id]
    );
    
    order.items = itemRows as OrderItem[];
    
    return order;
  }
  
  static async findByUserId(userId: number, filters: any = {}): Promise<Order[]> {
    // Базовый запрос
    let query = `
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.user_id = ?`;
    
    const params: any[] = [userId];
    
    // Добавляем фильтр по статусу, если есть
    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }
    
    // Сортировка
    query += ' ORDER BY o.created_at DESC';
    
    // Добавляем LIMIT и OFFSET, если указаны
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 10;
      const page = parseInt(filters.page) || 1;
      const offset = (page - 1) * limit;
      
      // Важно: используем прямую конкатенацию для LIMIT и OFFSET
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    
    // Выполняем запрос
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as Order[];
  }
  
  static async findAll(filters: any = {}): Promise<Order[]> {
    // Базовый запрос
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1`;
    
    const params: any[] = [];
    
    // Добавляем фильтры
    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }
    
    if (filters.payment_status) {
      query += ' AND o.payment_status = ?';
      params.push(filters.payment_status);
    }
    
    if (filters.date_from) {
      query += ' AND o.created_at >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      query += ' AND o.created_at <= ?';
      params.push(filters.date_to);
    }
    
    // Сортировка
    query += ' ORDER BY o.created_at DESC';
    
    // Добавляем LIMIT и OFFSET
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 20;
      const page = parseInt(filters.page) || 1;
      const offset = (page - 1) * limit;
      
      // Важно: используем прямую конкатенацию для LIMIT и OFFSET
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    
    // Выполняем запрос
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as Order[];
  }
  
  static async updateStatus(id: number, status: string, trackingNumber?: string): Promise<Order> {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid order status', 400);
    }
    
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];
    
    if (trackingNumber) {
      updates.push('tracking_number = ?');
      values.push(trackingNumber);
    }
    
    if (status === 'delivered') {
      updates.push('delivered_at = NOW()');
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }
  
  static async updatePaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!validStatuses.includes(paymentStatus)) {
      throw new AppError('Invalid payment status', 400);
    }
    
    await pool.execute(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [paymentStatus, id]
    );
    
    return this.findById(id);
  }
  
  static async getStatistics(dateFrom?: Date, dateTo?: Date): Promise<any> {
    let dateFilter = '';
    const params: any[] = [];
    
    if (dateFrom && dateTo) {
      dateFilter = ' WHERE created_at BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    } else if (dateFrom) {
      dateFilter = ' WHERE created_at >= ?';
      params.push(dateFrom);
    } else if (dateTo) {
      dateFilter = ' WHERE created_at <= ?';
      params.push(dateTo);
    }
    
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END) as avg_order_value
       FROM orders${dateFilter}`,
      params
    );
    
    return stats[0];
  }
}