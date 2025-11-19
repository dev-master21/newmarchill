import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { InventoryService } from '../services/inventory.service';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const createProduct = asyncHandler(async (req: any, res: Response) => {
  console.log('=== CREATE PRODUCT REQUEST ===');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  const productData = { ...req.body };
  
  // Преобразуем is_active в boolean/number
  if (typeof productData.is_active === 'string') {
    productData.is_active = productData.is_active === 'true' ? 1 : 0;
  } else if (typeof productData.is_active === 'boolean') {
    productData.is_active = productData.is_active ? 1 : 0;
  }
  
  // Преобразуем цены в числа
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }
  if (productData.price_rub) {
    productData.price_rub = parseFloat(productData.price_rub);
  }
  if (productData.price_usd) {
    productData.price_usd = parseFloat(productData.price_usd);
  }
  
  // Handle image upload
  if (req.files) {
    if (req.files.image && req.files.image[0]) {
      productData.image = `/uploads/products/${req.files.image[0].filename}`;
    }
    
    if (req.files.gallery) {
      productData.gallery = req.files.gallery.map((file: any) => 
        `/uploads/products/${file.filename}`
      );
    }
  }
  
  // Parse JSON fields
  if (typeof productData.features === 'string') {
    try {
      productData.features = JSON.parse(productData.features);
    } catch {
      productData.features = [];
    }
  }
  
  // Parse strains array
  let strainsArray = [];
  if (typeof productData.strains === 'string') {
    try {
      strainsArray = JSON.parse(productData.strains);
    } catch {
      strainsArray = [];
    }
  } else if (Array.isArray(productData.strains)) {
    strainsArray = productData.strains;
  }
  
  // Convert strain_id to number if provided
  if (productData.strain_id && productData.strain_id !== '') {
    productData.strain_id = parseInt(productData.strain_id);
  } else {
    productData.strain_id = null;
  }
  
  // Convert stock to number
  if (productData.stock) {
    productData.stock = parseInt(productData.stock);
  }
  
  // Удаляем strains из productData перед созданием продукта
  delete productData.strains;
  
  const product = await ProductService.create(productData);
  
  // Сохраняем связи с сортами
  if (strainsArray.length > 0 && product.id) {
    await saveProductStrains(product.id, strainsArray);
  }
  
  res.status(201).json({
    success: true,
    product
  });
});

export const updateProduct = asyncHandler(async (req: any, res: Response) => {
  const productId = parseInt(req.params.id);
  const productData = { ...req.body };
  
  console.log('=== UPDATE PRODUCT REQUEST ===');
  console.log('Product ID:', productId);
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  // Преобразуем is_active
  if (typeof productData.is_active === 'string') {
    productData.is_active = productData.is_active === 'true' ? 1 : 0;
  } else if (typeof productData.is_active === 'boolean') {
    productData.is_active = productData.is_active ? 1 : 0;
  }
  
  // Преобразуем цены в числа
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }
  if (productData.price_rub) {
    productData.price_rub = parseFloat(productData.price_rub);
  }
  if (productData.price_usd) {
    productData.price_usd = parseFloat(productData.price_usd);
  }
  
  const currentProduct = await ProductService.findById(productId);
  
  // Handle main image upload
  if (req.files && req.files.image && req.files.image[0]) {
    productData.image = `/uploads/products/${req.files.image[0].filename}`;
  }
  
  // Handle gallery - ТОЛЬКО если что-то передано про галерею
  if (productData.removeGallery === 'true') {
    productData.gallery = [];
    delete productData.removeGallery;
  } else if (productData.keepExistingGallery || (req.files && req.files.gallery)) {
    let newGallery = [];
    
    if (productData.keepExistingGallery) {
      try {
        const keepExisting = JSON.parse(productData.keepExistingGallery);
        if (Array.isArray(keepExisting)) {
          newGallery = keepExisting;
        }
      } catch (e) {
        console.error('Failed to parse keepExistingGallery:', e);
      }
      delete productData.keepExistingGallery;
    }
    
    if (req.files && req.files.gallery) {
      const newImages = req.files.gallery.map((file: any) => 
        `/uploads/products/${file.filename}`
      );
      newGallery = [...newGallery, ...newImages];
    }
    
    productData.gallery = newGallery;
  }
  
  // Parse JSON fields
  if (typeof productData.features === 'string') {
    try {
      productData.features = JSON.parse(productData.features);
    } catch {
      productData.features = [];
    }
  }
  
  // Parse strains array
  let strainsArray = [];
  if (typeof productData.strains === 'string') {
    try {
      strainsArray = JSON.parse(productData.strains);
    } catch {
      strainsArray = [];
    }
  } else if (Array.isArray(productData.strains)) {
    strainsArray = productData.strains;
  }
  
  // Convert strain_id to number if provided
  if (productData.strain_id && productData.strain_id !== '') {
    productData.strain_id = parseInt(productData.strain_id);
    // Проверяем, что основной сорт входит в выбранные сорта
    if (strainsArray.length > 0 && !strainsArray.includes(productData.strain_id)) {
      productData.strain_id = null;
    }
  } else {
    productData.strain_id = null;
  }
  
  // Convert stock to number
  if (productData.stock) {
    productData.stock = parseInt(productData.stock);
  }
  
  // Удаляем strains из productData перед обновлением продукта
  delete productData.strains;
  
  console.log('Final productData for update:', productData);
  
  const product = await ProductService.update(productId, productData);
  
  // Обновляем связи с сортами
  await updateProductStrains(productId, strainsArray);
  
  res.json({
    success: true,
    product
  });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    type: req.query.type,
    product_category: req.query.product_category,
    category_id: req.query.category_id,
    is_active: req.query.is_active !== 'false',
    search: req.query.search,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20
  };
  
  const products = await ProductService.findAll(filters);
  
  res.json({
    success: true,
    products,
    page: filters.page,
    limit: filters.limit
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const product = await ProductService.findById(productId);
  
  res.json({
    success: true,
    product
  });
});

export const getProductStrains = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  
  const [strains] = await pool.execute<RowDataPacket[]>(`
    SELECT s.* 
    FROM strains s
    INNER JOIN product_strains ps ON s.id = ps.strain_id
    WHERE ps.product_id = ?
    ORDER BY s.name ASC
  `, [productId]);
  
  res.json({
    success: true,
    strains
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  
  const product = await ProductService.findById(productId);
  
  // Удаляем связи с сортами
  await pool.execute('DELETE FROM product_strains WHERE product_id = ?', [productId]);
  
  await ProductService.delete(productId);
  
  // Delete images
  if (product.image && product.image.startsWith('/uploads/')) {
    const imagePath = path.join(__dirname, '../../..', product.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  if (product.gallery && Array.isArray(product.gallery)) {
    for (const image of product.gallery) {
      if (image.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '../../..', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }
  }
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await InventoryService.getLowStockProducts();
  
  res.json({
    success: true,
    products
  });
});

// Вспомогательные функции для работы с связями продукт-сорта
async function saveProductStrains(productId: number, strainIds: number[]) {
  if (!strainIds || strainIds.length === 0) return;
  
  // Удаляем старые связи
  await pool.execute('DELETE FROM product_strains WHERE product_id = ?', [productId]);
  
  // Добавляем новые связи
  const values = strainIds.map(strainId => [productId, strainId]);
  const placeholders = values.map(() => '(?, ?)').join(', ');
  const flatValues = values.flat();
  
  await pool.execute(
    `INSERT INTO product_strains (product_id, strain_id) VALUES ${placeholders}`,
    flatValues
  );
}

async function updateProductStrains(productId: number, strainIds: number[]) {
  // Удаляем старые связи
  await pool.execute('DELETE FROM product_strains WHERE product_id = ?', [productId]);
  
  // Если есть новые сорта, добавляем их
  if (strainIds && strainIds.length > 0) {
    const values = strainIds.map(strainId => [productId, strainId]);
    const placeholders = values.map(() => '(?, ?)').join(', ');
    const flatValues = values.flat();
    
    await pool.execute(
      `INSERT INTO product_strains (product_id, strain_id) VALUES ${placeholders}`,
      flatValues
    );
  }
}