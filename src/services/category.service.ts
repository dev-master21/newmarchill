// src/services/category.service.ts
import api from './api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

class CategoryService {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data.categories;
  }
  
  async getCategory(id: number): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data.category;
  }
  
  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data.category;
  }
  
  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.category;
  }
  
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoryService();