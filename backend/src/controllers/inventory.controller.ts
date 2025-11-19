import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.productId);
  const inventory = await InventoryService.getInventory(productId);
  
  res.json({
    success: true,
    inventory
  });
});

export const updateStock = asyncHandler(async (req: any, res: Response) => {
  const productId = parseInt(req.params.productId);
  const { quantity, type, notes } = req.body;
  
  await InventoryService.updateStock(
    productId,
    quantity,
    type || 'adjustment',
    req.user.id,
    notes
  );
  
  res.json({
    success: true,
    message: 'Stock updated successfully'
  });
});

export const updateLowStockThreshold = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.productId);
  const { threshold } = req.body;
  
  await InventoryService.updateLowStockThreshold(productId, threshold);
  
  res.json({
    success: true,
    message: 'Low stock threshold updated'
  });
});

export const getInventoryLogs = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId ? parseInt(req.params.productId) : undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const logs = await InventoryService.getInventoryLogs(productId, limit);
  
  res.json({
    success: true,
    logs
  });
});