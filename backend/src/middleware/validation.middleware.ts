import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Экспортируем body и другие валидаторы из express-validator
export { body, query, param } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg
      }))
    });
  }
  next();
};

export const authValidation = {
  register: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('last_name')
      .optional()
      .trim()
  ],
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  registerTelegram: [
    body('token')
      .notEmpty()
      .withMessage('Telegram token is required'),
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('last_name')
      .optional()
      .trim()
  ]
};

export const productValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('type').isIn(['WHITE', 'BLACK', 'CYAN']).withMessage('Invalid product type'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category_id').optional().isInt().withMessage('Category ID must be an integer')
  ],
  update: [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('type').optional().isIn(['WHITE', 'BLACK', 'CYAN']).withMessage('Invalid product type'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
  ]
};

export const orderValidation = {
  create: [
    body('delivery_method').isIn(['standard', 'express']).withMessage('Invalid delivery method'),
    body('delivery_name').trim().notEmpty().withMessage('Delivery name is required'),
    body('delivery_phone').notEmpty().withMessage('Delivery phone is required'),
    body('delivery_address').trim().notEmpty().withMessage('Delivery address is required'),
    body('delivery_city').trim().notEmpty().withMessage('Delivery city is required'),
    body('delivery_postal_code').trim().notEmpty().withMessage('Postal code is required')
  ]
};

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isString().withMessage('Sort must be a string'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
];