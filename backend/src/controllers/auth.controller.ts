import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { TelegramService } from '../services/telegram.service';
import { comparePassword, generateToken } from '../utils/auth.utils';
import { AppError, asyncHandler } from '../middleware/error.middleware';

// Register by username
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, first_name, last_name } = req.body;
  
  // Check if user with this username exists
  const existingUser = await UserService.findByUsername(username);
  if (existingUser) {
    throw new AppError('Username already taken', 400);
  }
  
  // Create user
  const user = await UserService.create({
    username,
    password,
    first_name,
    last_name,
    name: first_name + (last_name ? ` ${last_name}` : ''),
    role: 'customer'
  });
  
  // Generate token
  const token = generateToken(user);
  
  res.status(201).json({
    success: true,
    token,
    user
  });
});

// Login by username
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Find user by username
  const user = await UserService.findByUsername(username);
  
  if (!user || !user.password) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Check password
  const isMatch = await comparePassword(password, user.password);
  
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Account is disabled', 401);
  }
  
  // Remove password from response
  delete user.password;
  
  // Generate token
  const token = generateToken(user);
  
  res.json({
    success: true,
    token,
    user
  });
});

// Initiate Telegram authorization
export const initTelegramAuth = asyncHandler(async (req: Request, res: Response) => {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  
  if (!botUsername) {
    throw new AppError('Telegram bot not configured', 500);
  }

  res.json({
    success: true,
    botUrl: `https://t.me/${botUsername}?start=auth`
  });
});

// Callback after Telegram authorization
export const telegramAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token is required', 400);
  }

  // Validate token WITHOUT marking as used
  const { telegramId } = await TelegramService.validateToken(token);

  // Find user by telegram_id
  let user = await UserService.findByTelegramId(telegramId);

  if (!user) {
    throw new AppError('User not found. Please register first.', 404);
  }

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Account is disabled', 401);
  }

  // NOW mark token as used since authorization is successful
  await TelegramService.validateAndUseToken(token);

  // Remove password
  delete user.password;

  // Generate JWT token
  const jwtToken = generateToken(user);

  res.json({
    success: true,
    token: jwtToken,
    user
  });
});

// Register via Telegram
export const registerTelegram = asyncHandler(async (req: Request, res: Response) => {
  const { token, username, first_name, last_name } = req.body;

  if (!token) {
    throw new AppError('Token is required', 400);
  }

  if (!username || !first_name) {
    throw new AppError('Username and first name are required', 400);
  }

  // Validate and USE token (mark as used)
  const { telegramId } = await TelegramService.validateAndUseToken(token);

  // Check if this Telegram ID is already registered
  const existingTelegramUser = await UserService.findByTelegramId(telegramId);
  if (existingTelegramUser) {
    throw new AppError('This Telegram account is already registered', 400);
  }

  // Check username availability
  const existingUsername = await UserService.findByUsername(username);
  if (existingUsername) {
    throw new AppError('Username already taken', 400);
  }

  // Create user
  const user = await UserService.create({
    username,
    first_name,
    last_name,
    name: first_name + (last_name ? ` ${last_name}` : ''),
    telegram_id: telegramId,
    role: 'customer'
  });

  // Generate JWT token
  const jwtToken = generateToken(user);

  res.status(201).json({
    success: true,
    token: jwtToken,
    user
  });
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await UserService.findById(req.user.id);
  
  res.json({
    success: true,
    user
  });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const allowedUpdates = ['name', 'phone', 'address', 'city', 'postal_code', 'country', 'first_name', 'last_name'];
  const updates: any = {};
  
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }
  
  const user = await UserService.update(req.user.id, updates);
  
  res.json({
    success: true,
    user
  });
});

export const changePassword = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await UserService.findByUsername(req.user.username);
  
  if (!user || !user.password) {
    throw new AppError('User not found or password not set', 404);
  }
  
  // Check current password
  const isMatch = await comparePassword(currentPassword, user.password);
  
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  await UserService.updatePassword(req.user.id, newPassword);
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

export const getAchievements = asyncHandler(async (req: any, res: Response) => {
  const achievements = await UserService.getAchievements(req.user.id);
  
  res.json({
    success: true,
    achievements
  });
});