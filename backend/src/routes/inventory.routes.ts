import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/product/:productId', inventoryController.getInventory);
router.put('/product/:productId/stock', inventoryController.updateStock);
router.put('/product/:productId/threshold', inventoryController.updateLowStockThreshold);
router.get('/logs/:productId?', inventoryController.getInventoryLogs);

export default router;