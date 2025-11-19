import pool from '../config/database';
import { PromoCode, PromoCodeUsage } from '../types';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class PromoCodeService {
  static async findAll(): Promise<PromoCode[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pc.*, 
              COUNT(DISTINCT upu.user_id) as total_users,
              COUNT(upu.user_id) as total_uses
       FROM promo_codes pc
       LEFT JOIN user_promo_usage upu ON pc.id = upu.promo_code_id
       GROUP BY pc.id
       ORDER BY pc.created_at DESC`
    );
    
    // Загружаем связанные товары для каждого промокода
    for (const promo of rows) {
      const [products] = await pool.execute<RowDataPacket[]>(
        'SELECT product_id FROM promo_code_products WHERE promo_code_id = ?',
        [promo.id]
      );
      promo.products = products.map(p => p.product_id);
    }
    
    return rows as PromoCode[];
  }
  
  static async findById(id: number): Promise<PromoCode> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pc.*,
              COUNT(DISTINCT upu.user_id) as total_users,
              COUNT(upu.user_id) as total_uses
       FROM promo_codes pc
       LEFT JOIN user_promo_usage upu ON pc.id = upu.promo_code_id
       WHERE pc.id = ?
       GROUP BY pc.id`,
      [id]
    );
    
    if (rows.length === 0) {
      throw new AppError('Promo code not found', 404);
    }
    
    const promo = rows[0];
    
    // Загружаем связанные товары
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM promo_code_products WHERE promo_code_id = ?',
      [promo.id]
    );
    promo.products = products.map(p => p.product_id);
    
    return promo as PromoCode;
  }
  
  static async findByCode(code: string): Promise<PromoCode | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM promo_codes WHERE code = ?',
      [code]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const promo = rows[0];
    
    // Загружаем связанные товары
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM promo_code_products WHERE promo_code_id = ?',
      [promo.id]
    );
    promo.products = products.map(p => p.product_id);
    
    return promo as PromoCode;
  }
  
  static async create(promoData: Partial<PromoCode>): Promise<PromoCode> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO promo_codes (
          code, description, discount_type, discount_value, discount_value_rub, discount_value_usd,
          min_order_amount, usage_limit, used_count, 
          valid_from, valid_until, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          promoData.code?.toUpperCase(),
          promoData.description || null,
          promoData.discount_type,
          promoData.discount_value,
          promoData.discount_value_rub || 0,
          promoData.discount_value_usd || 0,
          promoData.min_order_amount || 0,
          promoData.usage_limit || null,
          promoData.valid_from,
          promoData.valid_until || null,
          promoData.is_active !== false
        ]
      );
      
      const promoId = result.insertId;
      
      // Добавляем связи с товарами
      if (promoData.products && promoData.products.length > 0) {
        for (const productId of promoData.products) {
          await connection.execute(
            'INSERT INTO promo_code_products (promo_code_id, product_id) VALUES (?, ?)',
            [promoId, productId]
          );
        }
      }
      
      await connection.commit();
      return this.findById(promoId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async update(id: number, promoData: Partial<PromoCode>): Promise<PromoCode> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      await connection.execute(
        `UPDATE promo_codes SET
          code = ?,
          description = ?,
          discount_type = ?,
          discount_value = ?,
          discount_value_rub = ?,
          discount_value_usd = ?,
          min_order_amount = ?,
          usage_limit = ?,
          valid_from = ?,
          valid_until = ?,
          is_active = ?
         WHERE id = ?`,
        [
          promoData.code?.toUpperCase(),
          promoData.description || null,
          promoData.discount_type,
          promoData.discount_value,
          promoData.discount_value_rub || 0,
          promoData.discount_value_usd || 0,
          promoData.min_order_amount || 0,
          promoData.usage_limit || null,
          promoData.valid_from,
          promoData.valid_until || null,
          promoData.is_active !== false,
          id
        ]
      );
      
      // Обновляем связи с товарами
      await connection.execute(
        'DELETE FROM promo_code_products WHERE promo_code_id = ?',
        [id]
      );
      
      if (promoData.products && promoData.products.length > 0) {
        for (const productId of promoData.products) {
          await connection.execute(
            'INSERT INTO promo_code_products (promo_code_id, product_id) VALUES (?, ?)',
            [id, productId]
          );
        }
      }
      
      await connection.commit();
      return this.findById(id);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async delete(id: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM promo_codes WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError('Promo code not found', 404);
    }
  }
  
  static async getUsageStats(id: number): Promise<{
    totalUses: number;
    totalUsers: number;
    users: PromoCodeUsage[];
  }> {
    const [usageRows] = await pool.execute<RowDataPacket[]>(
      `SELECT upu.*, u.name, u.email, u.avatar
       FROM user_promo_usage upu
       JOIN users u ON upu.user_id = u.id
       WHERE upu.promo_code_id = ?
       ORDER BY upu.used_at DESC`,
      [id]
    );
    
    const users = usageRows as PromoCodeUsage[];
    
    return {
      totalUses: users.length,
      totalUsers: new Set(users.map(u => u.user_id)).size,
      users
    };
  }
  
  static async validatePromoCode(
    code: string, 
    userId: number, 
    cartTotal: number,
    productIds: number[],
    currency: string = 'THB'
  ): Promise<{
    valid: boolean;
    discount: number;
    message?: string;
  }> {
    const promo = await this.findByCode(code);
    
    if (!promo) {
      return { valid: false, discount: 0, message: 'Invalid promo code' };
    }
    
    if (!promo.is_active) {
      return { valid: false, discount: 0, message: 'Promo code is not active' };
    }
    
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;
    
    if (now < validFrom) {
      return { valid: false, discount: 0, message: 'Promo code not yet valid' };
    }
    
    if (validUntil && now > validUntil) {
      return { valid: false, discount: 0, message: 'Promo code expired' };
    }
    
    if (cartTotal < promo.min_order_amount) {
      return { 
        valid: false, 
        discount: 0, 
        message: `Minimum order amount is ${promo.min_order_amount} ${currency}` 
      };
    }
    
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return { valid: false, discount: 0, message: 'Promo code usage limit reached' };
    }
    
    // Проверяем, применим ли промокод к товарам в корзине
    if (promo.products && promo.products.length > 0) {
      const hasApplicableProduct = productIds.some(id => promo.products!.includes(id));
      if (!hasApplicableProduct) {
        return { 
          valid: false, 
          discount: 0, 
          message: 'Promo code not applicable to items in cart' 
        };
      }
    }
    
    // Вычисляем скидку
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = cartTotal * (promo.discount_value / 100);
    } else {
      // Фиксированная скидка - выбираем значение по валюте
      switch (currency) {
        case 'RUB':
          discount = promo.discount_value_rub || 0;
          break;
        case 'USD':
          discount = promo.discount_value_usd || 0;
          break;
        case 'THB':
        default:
          discount = promo.discount_value;
          break;
      }
    }
    
    return { valid: true, discount };
  }
  
  static async recordUsage(promoCodeId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      await connection.execute(
        'INSERT INTO user_promo_usage (user_id, promo_code_id, used_at) VALUES (?, ?, NOW())',
        [userId, promoCodeId]
      );
      
      await connection.execute(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?',
        [promoCodeId]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}