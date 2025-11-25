import pool from '../config/database';
import { User } from '../types';
import { hashPassword, calculateUserLevel } from '../utils/auth.utils';
import { AppError } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class UserService {
  static async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password, phone, address, city, postal_code, country, role, username, first_name, last_name, telegram_id, telegram_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.name || null,
        userData.email || null, // Email is now optional
        userData.password || null,
        userData.phone || null,
        userData.address || null,
        userData.city || null,
        userData.postal_code || null,
        userData.country || 'Thailand',
        userData.role || 'customer',
        userData.username || null,
        userData.first_name || null,
        userData.last_name || null,
        userData.telegram_id || null,
        userData.telegram_username || null
      ]
    );
    
    return this.findById(result.insertId);
  }
  
  static async findById(id: number): Promise<User> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = rows[0] as User;
    delete user.password;
    return user;
  }
  
  static async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  }

  static async findByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  }

  static async findByTelegramId(telegramId: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  }
  
  static async update(id: number, userData: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const allowedFields = ['name', 'phone', 'address', 'city', 'postal_code', 'country', 'avatar', 'username', 'first_name', 'last_name', 'email'];
    
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }
  
  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }
  
  static async updatePoints(id: number, points: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [points, id]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError('User not found', 404);
    }
    
    // Update user level based on new points
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT points FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length > 0) {
      const totalPoints = rows[0].points;
      const newLevel = calculateUserLevel(totalPoints);
      
      await pool.execute(
        'UPDATE users SET level = ? WHERE id = ?',
        [newLevel, id]
      );
    }
  }
  
  static async getAchievements(userId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_achievements WHERE user_id = ?',
      [userId]
    );
    
    return rows;
  }
  
  static async addAchievement(userId: number, achievementType: string): Promise<void> {
    await pool.execute(
      'INSERT IGNORE INTO user_achievements (user_id, achievement_type) VALUES (?, ?)',
      [userId, achievementType]
    );
  }
}