import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { TelegramService } from '../services/telegram.service';

interface AuthRequest extends Request {
  user?: any;
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== CREATE ORDER DEBUG ===');
    console.log('User:', req.user);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================');
    
    await connection.beginTransaction();
    
    const userId = req.user?.id;
    if (!userId) {
      console.log('❌ No user ID');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const {
      items,
      subtotal,
      discount_amount = 0,
      delivery_fee = 0,
      total,
      currency = 'THB',
      promo_code,
      contact_methods,
      payment_methods,
      delivery_address,
      delivery_city = '',
      delivery_postal_code = '',
      delivery_country = 'Thailand',
      delivery_coordinates,
      gift_message,
      notes
    } = req.body;

    console.log('Parsed data:', { 
      items: items?.length, 
      delivery_address,
      contact_methods: contact_methods?.length,
      payment_methods: payment_methods?.length
    });

    // Validate
    if (!items || items.length === 0) {
      console.log('❌ No items');
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!delivery_address) {
      console.log('❌ No delivery address');
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    if (!contact_methods || contact_methods.length === 0) {
      console.log('❌ No contact methods');
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'At least one contact method is required' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log('📋 Generated order number:', orderNumber);

    // Extract contact info
    const primaryContact = contact_methods[0];
    const delivery_phone = primaryContact.value;
    const delivery_name = req.user?.name || 'Customer';

    // Format payment methods
    const paymentMethodStr = payment_methods && Array.isArray(payment_methods) 
      ? payment_methods.join(', ') 
      : 'pending';

    // Prepare notes with all contact methods and coordinates
    let orderNotes = '';
    if (contact_methods.length > 0) {
      orderNotes += 'Contact Methods:\n';
      contact_methods.forEach((method: any) => {
        orderNotes += `${method.type}: ${method.value}\n`;
      });
    }
    if (delivery_coordinates) {
      orderNotes += `\nDelivery Coordinates:\n`;
      orderNotes += `Latitude: ${delivery_coordinates.lat}\n`;
      orderNotes += `Longitude: ${delivery_coordinates.lng}\n`;
      if (delivery_coordinates.googleMapsLink) {
        orderNotes += `Google Maps: ${delivery_coordinates.googleMapsLink}\n`;
      }
    }
    if (notes) {
      orderNotes += `\nAdditional Notes:\n${notes}`;
    }

    // Create order
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (
        order_number, user_id, status, subtotal, discount_amount, 
        delivery_fee, total, currency, delivery_method, payment_method,
        payment_status, delivery_name, delivery_phone, delivery_address,
        delivery_city, delivery_postal_code, delivery_country, gift_message, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        'pending',
        subtotal,
        discount_amount,
        delivery_fee,
        total,
        currency,
        'standard',
        paymentMethodStr,
        'pending',
        delivery_name,
        delivery_phone,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        gift_message || null,
        orderNotes
      ]
    );

    const orderId = orderResult.insertId;
    console.log('✅ Order created in database with ID:', orderId);

    // Create order items
    for (const item of items) {
      const [productRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM products WHERE name = ? LIMIT 1',
        [item.name]
      );

      if (productRows.length === 0) {
        console.warn(`⚠️ Product not found: ${item.name}`);
        continue;
      }

      const productId = productRows[0].id;

      let strainId = null;
      if (item.strain) {
        const [strainRows] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM strains WHERE name = ? LIMIT 1',
          [item.strain]
        );
        if (strainRows.length > 0) {
          strainId = strainRows[0].id;
        }
      }

      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, strain_id, quantity, price, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, productId, strainId, item.quantity, item.price, item.price * item.quantity]
      );
    }

    await connection.commit();
    console.log('✅ Database transaction committed successfully');

    // Send Telegram notification
    console.log('\n📱 === SENDING TELEGRAM NOTIFICATION ===');
    console.log('Bot Token exists:', !!process.env.TELEGRAM_BOT_TOKEN);
    console.log('Admin Chat ID exists:', !!process.env.TELEGRAM_ADMIN_CHAT_ID);
    console.log('Admin Chat ID value:', process.env.TELEGRAM_ADMIN_CHAT_ID);
    
    try {
      const telegramData = {
        orderNumber,
        userName: delivery_name,
        userEmail: req.user?.email,
        items,
        subtotal,
        discount: discount_amount,
        total,
        currency,
        promoCode: promo_code,
        contactMethods: contact_methods,
        paymentMethods: payment_methods,
        deliveryAddress: delivery_address,
        deliveryCoordinates: delivery_coordinates,
        giftMessage: gift_message
      };

      console.log('📝 Preparing Telegram message with data:', {
        orderNumber: telegramData.orderNumber,
        userName: telegramData.userName,
        itemsCount: telegramData.items.length,
        total: telegramData.total,
        paymentMethods: telegramData.paymentMethods
      });

      const telegramMessage = formatOrderForTelegram(telegramData);
      console.log('📄 Telegram message formatted (first 300 chars):', telegramMessage.substring(0, 300));

      await TelegramService.sendOrderNotification(telegramMessage);
      console.log('✅ Telegram notification sent successfully!');
    } catch (telegramError: any) {
      console.error('❌ Failed to send Telegram notification:');
      console.error('Error name:', telegramError.name);
      console.error('Error message:', telegramError.message);
      console.error('Error stack:', telegramError.stack);
    }
    console.log('=== END TELEGRAM NOTIFICATION ===\n');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: orderId,
        order_number: orderNumber,
        status: 'pending',
        total
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
};

// Format order for Telegram - SAFE VERSION
function formatOrderForTelegram(data: any): string {
  console.log('🔧 Formatting Telegram message...');
  
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  let message = `🛍️ *NEW ORDER*\n\n`;
  message += `📋 Order: \`${data.orderNumber}\`\n`;
  message += `👤 Customer: ${data.userName}\n`;
  if (data.userEmail) {
    message += `📧 Email: ${data.userEmail}\n`;
  }
  message += `\n*📦 Items:*\n`;
  
  data.items.forEach((item: any, index: number) => {
    const itemPrice = toNumber(item.price);
    const itemTotal = itemPrice * item.quantity;
    
    message += `${index + 1}. ${item.name}\n`;
    if (item.strain) message += `   🌿 Strain: ${item.strain}\n`;
    if (item.size) message += `   📏 Size: ${item.size}\n`;
    message += `   💰 ${item.quantity} x ฿${itemPrice.toFixed(2)} = ฿${itemTotal.toFixed(2)}\n`;
  });
  
  const subtotal = toNumber(data.subtotal);
  const discount = toNumber(data.discount);
  const total = toNumber(data.total);
  
  message += `\n*💵 Summary:*\n`;
  message += `Subtotal: ฿${subtotal.toFixed(2)}\n`;
  if (discount > 0) {
    message += `Discount: -฿${discount.toFixed(2)}\n`;
    if (data.promoCode) {
      message += `Promo Code: \`${data.promoCode}\`\n`;
    }
  }
  message += `*Total: ฿${total.toFixed(2)}* ${data.currency}\n`;

  // Payment Methods
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    message += `\n*💳 Payment Methods:*\n`;
    const paymentLabels: Record<string, string> = {
      'cash': '💵 Cash',
      'bank_transfer': '🏦 Bank Transfer',
      'crypto': '₿ Crypto',
      'rub': '🇷🇺 RUB Transfer'
    };
    data.paymentMethods.forEach((method: string) => {
      message += `${paymentLabels[method] || method}\n`;
    });
  }
  
  message += `\n*📞 Contact Methods:*\n`;
  data.contactMethods.forEach((method: any) => {
    const emoji = method.type === 'whatsapp' ? '📱' : method.type === 'telegram' ? '✈️' : '☎️';
    message += `${emoji} ${method.type}: \`${method.value}\`\n`;
  });
  
  message += `\n*📍 Delivery Address:*\n`;
  message += `${data.deliveryAddress}\n`;
  
  if (data.deliveryCoordinates) {
    message += `\n*🗺️ Location:*\n`;
    const lat = toNumber(data.deliveryCoordinates.lat);
    const lng = toNumber(data.deliveryCoordinates.lng);
    message += `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}\n`;
    if (data.deliveryCoordinates.googleMapsLink) {
      message += `[Open in Google Maps](${data.deliveryCoordinates.googleMapsLink})\n`;
    }
  }
  
  if (data.giftMessage) {
    message += `\n*🎁 Gift Message:*\n${data.giftMessage}\n`;
  }
  
  console.log('✅ Telegram message formatted successfully');
  return message;
}

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT o.*, COUNT(oi.id) as items_count 
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      orders: rows
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const [itemRows] = await pool.execute<RowDataPacket[]>(
      `SELECT oi.*, p.name as product_name, p.image as product_image, s.name as strain_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN strains s ON oi.strain_id = s.id
       WHERE oi.order_id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      order: {
        ...orderRows[0],
        items: itemRows
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use admin routes' });
};

export const getOrderStatistics = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use admin routes' });
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use admin routes' });
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use admin routes' });
};