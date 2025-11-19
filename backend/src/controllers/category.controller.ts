import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { slugify } from '../utils/auth.utils';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM categories ORDER BY name ASC'
  );
  
  res.json({
    success: true,
    categories: rows
  });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM categories WHERE id = ?',
    [req.params.id]
  );
  
  if (rows.length === 0) {
    throw new AppError('Category not found', 404);
  }
  
  res.json({
    success: true,
    category: rows[0]
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, icon, color } = req.body;
  const slug = slugify(name);
  
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)',
    [name, slug, description || null, icon || null, color || null]
  );
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM categories WHERE id = ?',
    [result.insertId]
  );
  
  res.status(201).json({
    success: true,
    category: rows[0]
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, icon, color } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  
  if (name) {
    updates.push('name = ?', 'slug = ?');
    values.push(name, slugify(name));
  }
  
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  
  if (icon !== undefined) {
    updates.push('icon = ?');
    values.push(icon);
  }
  
  if (color !== undefined) {
    updates.push('color = ?');
    values.push(color);
  }
  
  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }
  
  values.push(req.params.id);
  
  await pool.execute(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM categories WHERE id = ?',
    [req.params.id]
  );
  
  res.json({
    success: true,
    category: rows[0]
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM categories WHERE id = ?',
    [req.params.id]
  );
  
  if (result.affectedRows === 0) {
    throw new AppError('Category not found', 404);
  }
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});