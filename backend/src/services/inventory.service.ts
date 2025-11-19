import pool from '../config/database';
import { Inventory } from '../types';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class InventoryService {
  static async checkAvailability(productId: number, quantity: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT quantity, reserved_quantity FROM inventory WHERE product_id = ?',
      [productId]
    );
    
    if (rows.length === 0) {
      return false;
    }
    
    const inventory = rows[0];
    const availableQuantity = inventory.quantity - inventory.reserved_quantity;
    
    return availableQuantity >= quantity;
  }
  
  static async getInventory(productId: number): Promise<Inventory> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM inventory WHERE product_id = ?',
      [productId]
    );
    
    if (rows.length === 0) {
      throw new AppError('Inventory record not found', 404);
    }
    
    return rows[0] as Inventory;
  }
  
  static async updateStock(
    productId: number, 
    quantity: number, 
    type: string = 'adjustment',
    userId?: number,
    notes?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update inventory
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE inventory SET quantity = quantity + ?, last_restock_date = NOW() WHERE product_id = ?',
        [quantity, productId]
      );
      
      if (result.affectedRows === 0) {
        throw new AppError('Product inventory not found', 404);
      }
      
      // Log the change
      await connection.execute(
        `INSERT INTO inventory_logs (product_id, type, quantity, notes, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [productId, type, quantity, notes, userId]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async getLowStockProducts(): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, i.quantity, i.reserved_quantity, i.low_stock_threshold
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE (i.quantity - i.reserved_quantity) <= i.low_stock_threshold
       AND p.is_active = true
       ORDER BY (i.quantity - i.reserved_quantity) ASC`
    );
    
    return rows;
  }
  
  static async getInventoryLogs(productId?: number, limit: number = 50): Promise<any[]> {
    let query = `
      SELECT il.*, p.name as product_name, u.name as created_by_name
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      LEFT JOIN users u ON il.created_by = u.id
    `;
    
    const params: any[] = [];
    
    if (productId) {
      query += ' WHERE il.product_id = ?';
      params.push(productId);
    }
    
    query += ' ORDER BY il.created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    return rows;
  }
  
  static async updateLowStockThreshold(productId: number, threshold: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE inventory SET low_stock_threshold = ? WHERE product_id = ?',
      [threshold, productId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError('Product inventory not found', 404);
    }
  }
}