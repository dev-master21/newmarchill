// src/services/admin.service.ts
import api from './api';

interface DashboardStats {
  orders: {
    total_orders: number;
    pending_orders: number;
    processing_orders: number;
    orders_today: number;
    total_revenue: number;
    revenue_30d: number;
  };
  users: {
    total_users: number;
    new_users_30d: number;
  };
  products: {
    total_products: number;
    low_stock_products: number;
  };
  recentOrders: any[];
  topProducts: any[];
}

interface UserStatistics {
  total_users: number;
  active_users: number;
  new_users_30d: number;
  admins: number;
}

interface UsersResponse {
  users: User[];
  total: number;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }

  async getUsers(): Promise<UsersResponse> {
    const response = await api.get('/admin/users');
    return response.data;
  }

  async getUserStatistics(): Promise<UserStatistics> {
    const response = await api.get('/admin/users/statistics');
    return response.data;
  }
}

export default new AdminService();

export type ProductType = 'WHITE' | 'BLACK' | 'CYAN';
export type Strain = 'Mimosa' | 'Lemon Mint' | 'Classic' | 'Pinapple Express' | 'Gorilla Glue' | 'Grape Stomper' | 'Strawberry Cough' | 'Green Haze';

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  category: string;
  category_id?: number;
  category_name?: string;
  strains: Strain[];
  price: number;
  originalPrice?: number;
  discount?: number;
  sizes?: string[];
  size: string;
  image: string;
  images: string[];
  description: string;
  features: string[];
  inStock: boolean;
  stock: number;
  rating?: number;
  reviews?: number;
  thc?: string;
  cbd?: string;
  featured?: boolean;
  new?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  strain?: string;
  strain_id?: number;
  // Прямые ссылки для удобства
  name: string;
  image: string;
  price: number;
  type: string;
  size: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  delivery_method: 'standard' | 'express';
  payment_method?: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country: string;
  gift_message?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  strain_id?: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
  strain?: Strain;
}