import { Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/error.middleware';
import { PromoCodeService } from '../services/promocode.service';
import { AuthRequest } from '../middleware/auth.middleware'; // ДОБАВЬ ИМПОРТ

const BOT_TOKEN = '8325192043:AAGS5bjyt4IcdMhLRUzCEHygYXRCCS_v4Hw';
const CHAT_ID = '-5064949329';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  type?: string;
  strain?: string;
  size?: string;
}

interface ContactMethod {
  type: 'whatsapp' | 'telegram' | 'phone';
  value: string;
}

interface TelegramOrderData {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  contactMethods: ContactMethod[];
  userName?: string;
  userEmail?: string;
}

const escapeMarkdown = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

const getTypeEmoji = (type?: string): string => {
  if (!type) return '📦';
  
  switch (type.toUpperCase()) {
    case 'WHITE':
      return '⚪';
    case 'BLACK':
      return '⚫';
    case 'CYAN':
      return '🔵';
    default:
      return '📦';
  }
};

const getTypeName = (type?: string): string => {
  if (!type) return 'Unknown';
  
  switch (type.toUpperCase()) {
    case 'WHITE':
      return 'White (Sativa)';
    case 'BLACK':
      return 'Black (Indica)';
    case 'CYAN':
      return 'Cyan (Hybrid)';
    default:
      return type;
  }
};

// ИЗМЕНЕНО: используем AuthRequest вместо any
export const sendOrderToTelegram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderData: TelegramOrderData = req.body;
  
  console.log('=== ORDER DATA ===');
  console.log('User from req.user:', req.user);
  console.log('User ID:', req.user?.id);
  console.log('User Name:', req.user?.name);
  console.log('Promo Code:', orderData.promoCode);
  console.log('Has Auth:', !!req.user);
  console.log('==================');
  
  // Записываем использование промокода
  if (orderData.promoCode && req.user?.id) {
    try {
      console.log('Attempting to record promo usage...');
      const promo = await PromoCodeService.findByCode(orderData.promoCode);
      console.log('Found promo:', promo);
      
      if (promo && promo.id) {
        await PromoCodeService.recordUsage(promo.id, req.user.id);
        console.log('✅ Promo usage recorded successfully for user ID:', req.user.id);
      } else {
        console.log('❌ Promo not found in database');
      }
    } catch (error) {
      console.error('❌ Failed to record promo usage:', error);
    }
  } else if (orderData.promoCode && !req.user?.id) {
    console.log('⚠️ Promo code used but user ID not available');
    console.log('req.user object:', req.user);
  }
  
  // Формируем сообщение
  let message = '🛍️ *НОВЫЙ ЗАКАЗ*\n\n';
  
  // Используем данные из req.user если доступны
  const userName = req.user?.name || orderData.userName || 'Guest';
  const userEmail = req.user?.email || orderData.userEmail;
  
  message += `👤 *Клиент:* ${escapeMarkdown(userName)}\n`;
  if (userEmail) {
    message += `📧 *Email:* ${escapeMarkdown(userEmail)}\n`;
  }
  if (req.user?.id) {
    message += `🆔 *User ID:* ${req.user.id}\n`;
  }
  message += '\n';
  
  message += '📞 *Контакты:*\n';
  orderData.contactMethods.forEach(method => {
    const icon = method.type === 'whatsapp' ? '📱' : method.type === 'telegram' ? '✈️' : '☎️';
    const label = method.type === 'whatsapp' ? 'WhatsApp' : method.type === 'telegram' ? 'Telegram' : 'Phone';
    message += `${icon} ${label}: \`${escapeMarkdown(method.value)}\`\n`;
  });
  message += '\n';
  
  message += '🛒 *Товары:*\n';
  message += '━━━━━━━━━━━━━━━━━━\n';
  
  orderData.items.forEach((item, index) => {
    const typeEmoji = getTypeEmoji(item.type);
    const typeName = getTypeName(item.type);
    
    message += `\n${index + 1}\\. *${escapeMarkdown(item.name)}*\n`;
    
    if (item.type) {
      message += `   ${typeEmoji} Type: ${escapeMarkdown(typeName)}\n`;
    }
    
    if (item.strain) {
      message += `   🌿 Strain: *${escapeMarkdown(item.strain)}*\n`;
    }
    
    if (item.size) {
      message += `   📦 Size: ${escapeMarkdown(item.size)}\n`;
    }
    
    const pricePerUnit = item.price.toLocaleString();
    const totalPrice = (item.quantity * item.price).toLocaleString();
    message += `   💰 ${item.quantity} x ฿${escapeMarkdown(pricePerUnit)} \\= *฿${escapeMarkdown(totalPrice)}*\n`;
  });
  
  message += '\n━━━━━━━━━━━━━━━━━━\n\n';
  
  message += '💳 *Сумма:*\n';
  message += `Subtotal: ฿${escapeMarkdown(orderData.subtotal.toLocaleString())}\n`;
  
  if (orderData.discount > 0) {
    message += `Discount: \\-฿${escapeMarkdown(orderData.discount.toLocaleString())}`;
    if (orderData.promoCode) {
      message += ` \\(${escapeMarkdown(orderData.promoCode)}\\)`;
    }
    message += '\n';
  }
  
  message += `\n*TOTAL: ฿${escapeMarkdown(orderData.total.toLocaleString())}*\n`;
  message += '\n━━━━━━━━━━━━━━━━━━\n';
  message += `📅 ${escapeMarkdown(new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bangkok' }))}`;
  
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'MarkdownV2'
    });
    
    res.json({
      success: true,
      message: 'Order sent to Telegram successfully'
    });
  } catch (error: any) {
    console.error('Telegram API error:', error.response?.data || error.message);
    throw new Error('Failed to send order to Telegram');
  }
});