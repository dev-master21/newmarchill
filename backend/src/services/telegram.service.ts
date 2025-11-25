import TelegramBot from 'node-telegram-bot-api';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import crypto from 'crypto';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const clientUrl = process.env.CLIENT_URL || 'https://market.chillium.asia';

if (!botToken) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

let bot: TelegramBot | null = null;

if (botToken) {
  bot = new TelegramBot(botToken, { polling: true });
}

export class TelegramService {
  
  // Generate unique token for authorization
  static async generateAuthToken(telegramId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.execute(
      `INSERT INTO telegram_auth_tokens (token, telegram_id, expires_at, used) 
       VALUES (?, ?, ?, false)`,
      [token, telegramId, expiresAt]
    );

    return token;
  }

  // Validate token WITHOUT marking it as used (for checking if user exists)
  static async validateToken(token: string): Promise<{ telegramId: number; userId: number | null }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM telegram_auth_tokens 
       WHERE token = ? AND used = false AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      throw new Error('Invalid or expired token');
    }

    const tokenData = rows[0];

    return {
      telegramId: tokenData.telegram_id,
      userId: tokenData.user_id
    };
  }

  // Validate and mark token as used (for final registration/authorization)
  static async validateAndUseToken(token: string): Promise<{ telegramId: number; userId: number | null }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM telegram_auth_tokens 
       WHERE token = ? AND used = false AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      throw new Error('Invalid or expired token');
    }

    const tokenData = rows[0];

    // Mark token as used
    await pool.execute(
      'UPDATE telegram_auth_tokens SET used = true WHERE id = ?',
      [tokenData.id]
    );

    return {
      telegramId: tokenData.telegram_id,
      userId: tokenData.user_id
    };
  }

  // Check channel/chat subscription
  static async checkSubscription(telegramId: number): Promise<boolean> {
    if (!bot || !chatId) {
      console.error('Bot or chatId not configured');
      return false;
    }

    try {
      const member = await bot.getChatMember(chatId, telegramId);
      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Initialize bot
  static initBot() {
    if (!bot) {
      console.log('Telegram bot not initialized - missing TELEGRAM_BOT_TOKEN');
      return;
    }

    console.log('Telegram bot started');

    // Handle /start command
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id;

      if (!telegramId) return;

      // Request contact
      await bot!.sendMessage(chatId, 
        '👋 Welcome to Chillium Market!\n\n' +
        'To authorize on the website, please share your contact.',
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 Share Contact', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    });

    // Handle contact reception
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contact = msg.contact;
      const telegramId = msg.from?.id;

      if (!contact || !telegramId) return;

      // Check subscription
      const isSubscribed = await this.checkSubscription(telegramId);

      if (!isSubscribed) {
        await bot!.sendMessage(chatId,
          '❌ Channel subscription is required for authorization.\n\n' +
          'After subscribing, press /start again.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📢 Subscribe to Channel', url: `https://t.me/${process.env.TELEGRAM_CHAT_ID?.replace('-100', '')}` }]
              ]
            }
          }
        );
        return;
      }

      // Generate authorization token
      const token = await this.generateAuthToken(telegramId);
      const authUrl = `${clientUrl}auth/telegram-callback?token=${token}`;

      await bot!.sendMessage(chatId,
        '✅ Great! You are subscribed to the channel.\n\n' +
        'Now click the button below to authorize on the website.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Authorize', url: authUrl }]
            ],
            remove_keyboard: true
          }
        }
      );
    });

    // Handle errors
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  // Link Telegram account with existing user
  static async linkTelegramToUser(userId: number, telegramId: number, telegramUsername?: string): Promise<void> {
    await pool.execute(
      'UPDATE users SET telegram_id = ?, telegram_username = ? WHERE id = ?',
      [telegramId, telegramUsername || null, userId]
    );
  }

  // Find user by Telegram ID
  static async findUserByTelegramId(telegramId: number): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }
}