import api from './api';
import { Product } from '../types';

export interface ProductFilters {
  type?: string;
  category_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

class ProductService {
  async getProducts(filters?: ProductFilters): Promise<{
    products: Product[];
    page: number;
    limit: number;
  }> {
    const response = await api.get('/products', { params: filters });
    return response.data;
  }
  
  // ОБНОВЛЕННЫЙ МЕТОД для получения всех продуктов
  async getAllProducts(): Promise<Product[]> {
    try {
      // Пробуем admin endpoint
      const response = await api.get('/admin/products');
      console.log('Admin products response:', response.data);
      
      // Проверяем разные форматы ответа
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
      }
      
      console.warn('Unexpected products format, trying public endpoint');
      // Fallback на публичный endpoint без пагинации
      const publicResponse = await api.get('/products', { params: { limit: 1000 } });
      return publicResponse.data.products || [];
    } catch (error) {
      console.error('Failed to load all products:', error);
      // Последний fallback - пробуем публичный API
      try {
        const response = await api.get('/products', { params: { limit: 1000 } });
        return response.data.products || [];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }
  
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get('/products/low-stock');
    return response.data.products;
  }
  
  async createProduct(data: FormData): Promise<Product> {
    const response = await api.post('/products', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.product;
  }
  
  async updateProduct(id: string, data: FormData): Promise<Product> {
    const response = await api.put(`/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.product;
  }
  
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
}

export default new ProductService();