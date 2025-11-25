import TelegramBot from 'node-telegram-bot-api';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import crypto from 'crypto';
import axios from 'axios';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
// Убираем trailing slash если есть
const clientUrl = (process.env.CLIENT_URL || 'https://market.chillium.asia').replace(/\/$/, '');

console.log('=== TELEGRAM SERVICE INITIALIZATION ===');
console.log('Bot Token exists:', !!botToken);
console.log('Chat ID:', chatId);
console.log('Admin Chat ID:', process.env.TELEGRAM_ADMIN_CHAT_ID);
console.log('Client URL:', clientUrl);
console.log('======================================');

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

let bot: TelegramBot | null = null;

if (botToken) {
  try {
    bot = new TelegramBot(botToken, { polling: true });
    console.log('✅ Telegram bot instance created successfully');
  } catch (error) {
    console.error('❌ Failed to create Telegram bot instance:', error);
  }
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

  // Send order notification to admin - используем axios напрямую (как в рабочем telegram.controller.ts)
  static async sendOrderNotification(message: string): Promise<void> {
    // Используем те же данные что и в рабочем telegram.controller.ts
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8325192043:AAGS5bjyt4IcdMhLRUzCEHygYXRCCS_v4Hw';
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '-5064949329';
    
    console.log('\n📤 === Sending order notification ===');
    console.log('Target chat ID:', ADMIN_CHAT_ID);
    console.log('Message length:', message.length);
    
    try {
      const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });
      
      console.log('✅ Order notification sent successfully!');
      console.log('Message ID:', response.data.result?.message_id);
      console.log('=== End notification ===\n');
    } catch (error: any) {
      console.error('❌ Failed to send notification:', error.response?.data || error.message);
      // Don't throw - we don't want to fail the order
    }
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
      console.log('⚠️ Telegram bot not initialized - missing TELEGRAM_BOT_TOKEN');
      return;
    }

    console.log('✅ Initializing Telegram bot...');

    // Handle /start command
    bot.onText(/\/start/, async (msg) => {
      const msgChatId = msg.chat.id;
      const telegramId = msg.from?.id;

      if (!telegramId) return;

      console.log('📱 /start command received from user:', telegramId);

      // Request contact
      await bot!.sendMessage(msgChatId, 
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
      const msgChatId = msg.chat.id;
      const contact = msg.contact;
      const telegramId = msg.from?.id;

      if (!contact || !telegramId) return;

      console.log('📞 Contact received from user:', telegramId);

      // Check subscription
      const isSubscribed = await this.checkSubscription(telegramId);

      if (!isSubscribed) {
        await bot!.sendMessage(msgChatId,
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
      // ИСПРАВЛЕНО: правильный URL без двойного слеша
      const authUrl = `${clientUrl}/auth/telegram-callback?token=${token}`;
      
      console.log('🔗 Generated auth URL:', authUrl);

      await bot!.sendMessage(msgChatId,
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
      console.error('⚠️ Telegram polling error:', error);
    });

    console.log('✅ Telegram bot initialized successfully');
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