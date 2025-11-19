import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils';
import pool from '../config/database';
import { User } from '../types';

// ЭКСПОРТИРУЕМ интерфейс
export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );
    
    const users = rows as User[];
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = users[0];
    delete req.user.password;
    
    console.log('✅ User authenticated:', {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};