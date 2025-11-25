import api from './api';

interface InventoryItem {
  product_id: number;
  stock: number;
  low_stock_threshold: number;
}

const inventoryService = {
  async getInventory(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory');
    return response.data;
  },

  async updateStock(productId: number, stock: number): Promise<void> {
    await api.put(`/inventory/${productId}`, { stock });
  },

  async updateLowStockThreshold(productId: number, threshold: number): Promise<void> {
    await api.put(`/inventory/${productId}/threshold`, { threshold });
  }
};

export default inventoryService;