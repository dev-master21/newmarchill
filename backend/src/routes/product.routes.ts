import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body, validate } from '../middleware/validation.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'model_3d', maxCount: 1 }
  ]),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'model_3d', maxCount: 1 }
  ]),
  productController.updateProduct
);

router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

export default router;