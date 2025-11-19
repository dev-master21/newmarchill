import api from './api';
import { CartItem } from '../types';

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  items: number;
}

class CartService {
  async getCart(): Promise<{
    cart: CartItem[];
    summary: CartSummary;
  }> {
    const response = await api.get('/cart');
    return response.data;
  }
  
  async addToCart(productId: number, strainId?: number, quantity: number = 1): Promise<CartItem> {
    const response = await api.post('/cart', {
      product_id: productId,
      strain_id: strainId,
      quantity
    });
    return response.data.item;
  }
  
  async updateQuantity(itemId: number, quantity: number): Promise<void> {
    await api.put(`/cart/${itemId}`, { quantity });
  }
  
  async removeItem(itemId: number): Promise<void> {
    await api.delete(`/cart/${itemId}`);
  }
  
  async clearCart(): Promise<void> {
    await api.delete('/cart');
  }
}

export default new CartService();