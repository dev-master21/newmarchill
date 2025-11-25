import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // MySQL errors
  if (err.message.includes('ER_DUP_ENTRY')) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  if (err.message.includes('ER_NO_REFERENCED_ROW')) {
    const message = 'Referenced record not found';
    error = new AppError(message, 400);
  }

  res.status((error as AppError).statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};