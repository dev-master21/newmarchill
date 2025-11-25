import pool from '../config/database';
import { CartItem } from '../types';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class CartService {
  static async getCart(userId: number): Promise<CartItem[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, 
              p.name as product_name,
              p.price as product_price,
              p.image as product_image,
              p.type as product_type,
              p.size as product_size,
              s.name as strain_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN strains s ON c.strain_id = s.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    return rows as CartItem[];
  }
  
  static async addItem(userId: number, productId: number, strainId?: number, quantity: number = 1): Promise<CartItem> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if product exists and is active
      const [productRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ? AND is_active = true',
        [productId]
      );
      
      if (productRows.length === 0) {
        throw new AppError('Product not found or inactive', 404);
      }
      
      // Check if item already in cart
      const [existingRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND (strain_id = ? OR (strain_id IS NULL AND ? IS NULL))',
        [userId, productId, strainId, strainId]
      );
      
      if (existingRows.length > 0) {
        // Update quantity
        await connection.execute(
          'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
          [quantity, existingRows[0].id]
        );
      } else {
        // Add new item
        await connection.execute(
          'INSERT INTO cart (user_id, product_id, strain_id, quantity) VALUES (?, ?, ?, ?)',
          [userId, productId, strainId, quantity]
        );
      }
      
      await connection.commit();
      
      // Return updated cart
      const cart = await this.getCart(userId);
      return cart.find(item => 
        item.product_id === productId && 
        item.strain_id === strainId
      )!;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async updateQuantity(userId: number, itemId: number, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(userId, itemId);
      return;
    }
    
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, itemId, userId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError('Cart item not found', 404);
    }
  }
  
  static async removeItem(userId: number, itemId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError('Cart item not found', 404);
    }
  }
  
  static async clearCart(userId: number): Promise<void> {
    await pool.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [userId]
    );
  }
  
  static async getCartSummary(userId: number): Promise<any> {
    const items = await this.getCart(userId);
    
    let subtotal = 0;
    let itemCount = 0;
    
    for (const item of items) {
      const itemTotal = (item.product as any).price * item.quantity;
      subtotal += itemTotal;
      itemCount += item.quantity;
    }
    
    return {
      itemCount,
      subtotal,
      items: items.length
    };
  }
}