import { create } from 'zustand';
import { Product } from '../types';
// Экспортируем CartItem для использования в других компонентах
export type { CartItem } from '../types';
import type { CartItem } from '../types';
import api from '../services/api';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean; // Добавляем состояние открытия корзины
  
  // Actions
  toggleCart: () => void; // Добавляем функцию переключения корзины
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity: number, strain?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string, strain?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Computed
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  isOpen: false,

  toggleCart: () => {
    set(state => ({ isOpen: !state.isOpen }));
  },

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        try {
          const items = JSON.parse(localCart);
          set({ items: Array.isArray(items) ? items : [] });
        } catch {
          set({ items: [] });
        }
      }
      return;
    }

    set({ isLoading: true });
    
    try {
      const response = await api.get('/cart');
      
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        const items = response.data.items.map((item: any) => ({
          id: item.id?.toString(),
          product: item.product,
          quantity: item.quantity,
          strain: item.strain?.name,
          strain_id: item.strain_id,
          name: item.product?.name || '',
          image: item.product?.image || '',
          price: item.product?.price || 0,
          type: item.product?.type || '',
          size: item.product?.size || ''
        }));
        
        set({ items });
      } else {
        set({ items: [] });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product, quantity: number = 1, strainId?: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const currentItems = get().items;
      
      // Для локального хранилища находим название сорта по ID
      let strainName: string | undefined;
      if (strainId) {
        try {
          const response = await api.get('/strains');
          const strain = response.data.find((s: any) => s.id === parseInt(strainId));
          strainName = strain?.name;
        } catch {
          strainName = undefined;
        }
      }
      
      const existingItem = currentItems.find(
        item => item.product.id === product.id && item.strain === strainName
      );
      
      if (existingItem) {
        const updatedItems = currentItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        set({ items: updatedItems });
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      } else {
        try {
          const newItem: CartItem = {
            id: `${product.id}-${strainId || 'no-strain'}-${Date.now()}`,
            product,
            quantity,
            strain: strainName,
            strain_id: strainId ? parseInt(strainId) : undefined,
            name: product.name,
            image: product.image,
            price: product.price,
            type: product.type,
            size: product.sizes?.[0] || product.size || '1g',
          };
          const updatedItems = [...currentItems, newItem];
          set({ items: updatedItems });
          localStorage.setItem('cart', JSON.stringify(updatedItems));
        } catch (error) {
          console.error('Failed to add to cart:', error);
          throw error;
        }
      }
      return;
    }
  
    try {
      await api.post('/cart', { 
        product_id: product.id, 
        quantity,
        strain_id: strainId ? parseInt(strainId) : null
      });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const updatedItems = get().items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      set({ items: updatedItems });
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      return;
    }

    try {
      await api.put(`/cart/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  },

  removeItem: async (itemId: string, _strain?: string) => {
    await get().removeFromCart(itemId);
  },

  removeFromCart: async (itemId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const updatedItems = get().items.filter(item => item.id !== itemId);
      set({ items: updatedItems });
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      return;
    }

    try {
      await api.delete(`/cart/${itemId}`);
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ items: [] });
      localStorage.removeItem('cart');
      return;
    }

    try {
      await api.delete('/cart');
      set({ items: [] });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  },

  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },
}));