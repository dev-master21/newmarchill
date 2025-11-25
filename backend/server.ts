import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Import routes
import authRoutes from './src/routes/auth.routes';
import userRoutes from './src/routes/user.routes';
import productRoutes from './src/routes/product.routes';
import orderRoutes from './src/routes/order.routes';
import categoryRoutes from './src/routes/category.routes';
import adminRoutes from './src/routes/admin.routes';
import inventoryRoutes from './src/routes/inventory.routes';
import cartRoutes from './src/routes/cart.routes';
import telegramRoutes from './src/routes/telegram.routes';
import promoCodeRoutes from './src/routes/promocode.routes';

// Import middleware
import { errorHandler } from './src/middleware/error.middleware';

// Import services
import { startThumbnailCron } from './src/services/thumbnail.cron';
import { TelegramService } from './src/services/telegram.service';

const app = express();

// Создаем папку uploads в backend директории
const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');
const avatarsDir = path.join(uploadsDir, 'avatars');

[uploadsDir, productsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(compression());

app.use(cors({
  origin: [
    'https://market.chillium.asia',
    'http://market.chillium.asia',
    'http://localhost:5173',
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для uploads (только для разработки)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(uploadsDir));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/admin/promo-codes', promoCodeRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5965;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  
  // Запускаем cronjob для генерации thumbnails
  startThumbnailCron();
  
  // Инициализируем Telegram бота
  TelegramService.initBot();
});