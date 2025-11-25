import pool from '../config/database';
import { Product, Strain, Inventory } from '../types';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { slugify } from '../utils/auth.utils';

export class ProductService {
static async create(productData: Partial<Product>): Promise<Product> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO products (
        name, slug, type, product_category, category_id, description, 
        price, price_rub, price_usd, size, thc, cbd, terpenes, 
        aroma_taste, effects, image, gallery, model_3d, features, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.name,
        productData.slug,
        productData.type,
        productData.product_category,
        productData.category_id || null,
        productData.description || null,
        productData.price,
        productData.price_rub || 0,  // ДОБАВЛЕНО
        productData.price_usd || 0,  // ДОБАВЛЕНО
        productData.size || null,
        productData.thc || null,
        productData.cbd || null,
        productData.terpenes || null,
        productData.aroma_taste || null,
        productData.effects || null,
        productData.image || null,
        productData.gallery ? JSON.stringify(productData.gallery) : null,
        productData.model_3d || null,
        productData.features ? JSON.stringify(productData.features) : null,
        productData.is_active !== undefined ? productData.is_active : true
      ]
    );
      
      const productId = result.insertId;
      
      const initialStock = productData.stock || 0;
      await connection.execute(
        'INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES (?, ?, ?)',
        [productId, initialStock, 10]
      );
      
      if (productData.strains && productData.strains.length > 0) {
        for (const strainId of productData.strains) {
          await connection.execute(
            'INSERT INTO product_strains (product_id, strain_id) VALUES (?, ?)',
            [productId, strainId]
          );
        }
      }
      
      await connection.commit();
      return this.findById(productId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async findAll(filters: any = {}): Promise<Product[]> {
    let query = `
      SELECT p.*, 
             c.name as category_name,
             i.quantity as stock_quantity,
             i.reserved_quantity,
             i.low_stock_threshold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.type) {
      query += ' AND p.type = ?';
      params.push(filters.type);
    }
    
    if (filters.product_category) {
      query += ' AND p.product_category = ?';
      params.push(filters.product_category);
    }
    
    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.is_active !== undefined) {
      query += ' AND p.is_active = ?';
      params.push(filters.is_active);
    }
    
    if (filters.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 20;
      const page = parseInt(filters.page) || 1;
      const offset = (page - 1) * limit;
      
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    for (const product of rows) {
      // Логируем что приходит из базы
      console.log(`[Backend] Product ${product.id} - gallery from DB:`, {
        type: typeof product.gallery,
        value: product.gallery,
        raw: product.gallery,
        isBuffer: Buffer.isBuffer(product.gallery),
        length: product.gallery?.length
      });

      const [strainRows] = await pool.execute<RowDataPacket[]>(
        `SELECT s.* FROM strains s
         JOIN product_strains ps ON s.id = ps.strain_id
         WHERE ps.product_id = ?`,
        [product.id]
      );
      
      product.strains = strainRows;
      product.stock = product.stock_quantity || 0;
      
      // Парсим gallery
      if (product.gallery) {
        try {
          // Если это строка - парсим
          if (typeof product.gallery === 'string') {
            const trimmed = product.gallery.trim();
            if (trimmed && trimmed !== '[]' && trimmed !== 'null') {
              product.gallery = JSON.parse(trimmed);
              console.log(`[Backend] Product ${product.id} - parsed gallery (from string):`, product.gallery);
            } else {
              product.gallery = [];
              console.log(`[Backend] Product ${product.id} - empty gallery string, set to []`);
            }
          }
          // Если уже массив - оставляем как есть
          else if (Array.isArray(product.gallery)) {
            console.log(`[Backend] Product ${product.id} - gallery already array:`, product.gallery);
            // Оставляем как есть
          }
          // Если Buffer - конвертируем в строку и парсим
          else if (Buffer.isBuffer(product.gallery)) {
            const str = product.gallery.toString('utf8');
            console.log(`[Backend] Product ${product.id} - gallery is Buffer, converted to string:`, str);
            if (str && str !== '[]' && str !== 'null') {
              product.gallery = JSON.parse(str);
              console.log(`[Backend] Product ${product.id} - parsed gallery (from Buffer):`, product.gallery);
            } else {
              product.gallery = [];
            }
          }
          else {
            console.log(`[Backend] Product ${product.id} - unknown gallery type, setting to []`);
            product.gallery = [];
          }
        } catch (e) {
          console.error(`[Backend] Product ${product.id} - Failed to parse gallery:`, e, 'Raw value:', product.gallery);
          product.gallery = [];
        }
      } else {
        console.log(`[Backend] Product ${product.id} - gallery is null/undefined`);
        product.gallery = [];
      }
      
      // Финальная проверка
      if (!Array.isArray(product.gallery)) {
        console.error(`[Backend] Product ${product.id} - gallery is not array after parsing! Type:`, typeof product.gallery, 'Value:', product.gallery);
        product.gallery = [];
      }

      console.log(`[Backend] Product ${product.id} - final gallery:`, product.gallery);
      
      // Парсим features
      if (product.features) {
        try {
          if (typeof product.features === 'string') {
            const trimmed = product.features.trim();
            if (trimmed && trimmed !== '[]' && trimmed !== 'null') {
              product.features = JSON.parse(trimmed);
            } else {
              product.features = [];
            }
          } else if (Buffer.isBuffer(product.features)) {
            const str = product.features.toString('utf8');
            if (str && str !== '[]' && str !== 'null') {
              product.features = JSON.parse(str);
            } else {
              product.features = [];
            }
          } else if (!Array.isArray(product.features)) {
            product.features = [];
          }
        } catch (e) {
          console.error(`[Backend] Product ${product.id} - Failed to parse features:`, e);
          product.features = [];
        }
      } else {
        product.features = [];
      }
    }
    
    return rows as Product[];
  }
  
  static async findById(id: number): Promise<Product> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT p.*, 
             c.name as category_name,
             i.quantity as stock_quantity,
             i.reserved_quantity,
             i.low_stock_threshold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      throw new AppError('Product not found', 404);
    }
    
    const product = rows[0];
    
    const [strainRows] = await pool.execute<RowDataPacket[]>(`
      SELECT s.* 
      FROM strains s
      INNER JOIN product_strains ps ON s.id = ps.strain_id
      WHERE ps.product_id = ?
    `, [id]);
    
    product.strains = strainRows;
    
    // Парсим gallery
    if (product.gallery) {
      try {
        if (typeof product.gallery === 'string') {
          const trimmed = product.gallery.trim();
          if (trimmed && trimmed !== '[]' && trimmed !== 'null') {
            product.gallery = JSON.parse(trimmed);
          } else {
            product.gallery = [];
          }
        } else if (Buffer.isBuffer(product.gallery)) {
          const str = product.gallery.toString('utf8');
          if (str && str !== '[]' && str !== 'null') {
            product.gallery = JSON.parse(str);
          } else {
            product.gallery = [];
          }
        } else if (!Array.isArray(product.gallery)) {
          product.gallery = [];
        }
      } catch (e) {
        console.error('Failed to parse gallery JSON:', e);
        product.gallery = [];
      }
    } else {
      product.gallery = [];
    }
    
    // Парсим features
    if (product.features) {
      try {
        if (typeof product.features === 'string') {
          const trimmed = product.features.trim();
          if (trimmed && trimmed !== '[]' && trimmed !== 'null') {
            product.features = JSON.parse(trimmed);
          } else {
            product.features = [];
          }
        } else if (Buffer.isBuffer(product.features)) {
          const str = product.features.toString('utf8');
          if (str && str !== '[]' && str !== 'null') {
            product.features = JSON.parse(str);
          } else {
            product.features = [];
          }
        } else if (!Array.isArray(product.features)) {
          product.features = [];
        }
      } catch (e) {
        console.error('Failed to parse features JSON:', e);
        product.features = [];
      }
    } else {
      product.features = [];
    }
    
    return product as Product;
  }
  
  static async update(id: number, productData: Partial<Product>): Promise<Product> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (productData.name !== undefined) {
        updates.push('name = ?');
        values.push(productData.name);
      }
      
      if (productData.slug !== undefined) {
        updates.push('slug = ?');
        values.push(productData.slug);
      }
      
      if (productData.type !== undefined) {
        updates.push('type = ?');
        values.push(productData.type);
      }
      
      if (productData.product_category !== undefined) {
        updates.push('product_category = ?');
        values.push(productData.product_category);
      }
      
      if (productData.category_id !== undefined) {
        updates.push('category_id = ?');
        values.push(productData.category_id);
      }
      
      if (productData.description !== undefined) {
        updates.push('description = ?');
        values.push(productData.description);
      }
      
      if (productData.price !== undefined) {
        updates.push('price = ?');
        values.push(productData.price);
      }
      
      // ДОБАВЛЕНО
      if (productData.price_rub !== undefined) {
        updates.push('price_rub = ?');
        values.push(productData.price_rub);
      }
      
      // ДОБАВЛЕНО
      if (productData.price_usd !== undefined) {
        updates.push('price_usd = ?');
        values.push(productData.price_usd);
      }

      if (productData.size !== undefined) {
        updates.push('size = ?');
        values.push(productData.size);
      }
      
      if (productData.thc !== undefined) {
        updates.push('thc = ?');
        values.push(productData.thc);
      }
      
      if (productData.cbd !== undefined) {
        updates.push('cbd = ?');
        values.push(productData.cbd);
      }
      
      if (productData.image !== undefined) {
        updates.push('image = ?');
        values.push(productData.image);
      }
      
      if (productData.gallery !== undefined) {
        updates.push('gallery = ?');
        values.push(JSON.stringify(productData.gallery));
      }
      
      if (productData.model_3d !== undefined) {
        updates.push('model_3d = ?');
        values.push(productData.model_3d);
      }
      
      if (productData.features !== undefined) {
        updates.push('features = ?');
        values.push(JSON.stringify(productData.features));
      }
      
      if (productData.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(productData.is_active);
      }
      
      if (updates.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      
      if (productData.stock !== undefined) {
        await connection.execute(
          'UPDATE inventory SET quantity = ? WHERE product_id = ?',
          [productData.stock, id]
        );
      }
      
      if (productData.strains) {
        await connection.execute(
          'DELETE FROM product_strains WHERE product_id = ?',
          [id]
        );
        
        for (const strainId of productData.strains) {
          await connection.execute(
            'INSERT INTO product_strains (product_id, strain_id) VALUES (?, ?)',
            [id, strainId]
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
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  }
}