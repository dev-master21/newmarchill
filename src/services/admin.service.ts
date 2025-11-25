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
  customers: number;
  admins: number;
  active_users: number;
  inactive_users: number;
  new_users_30d: number;
  telegram_users: number;
  email_users: number;
}

interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  orders_today: number;
  total_revenue: number;
  revenue_30d: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrdersResponse {
  orders: OrderType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  telegram_id?: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  role: 'customer' | 'admin';
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

interface OrderType {
  id: number;
  order_number: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_telegram?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  currency: string;
  delivery_method: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country: string;
  gift_message?: string;
  notes?: string;
  tracking_number?: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard');
    return response.data.stats;
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UsersResponse> {
    const response = await api.get('/users', { params });
    return response.data;
  }

  async getUserById(id: number): Promise<{ user: User; recentOrders: any[] }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async getUserStatistics(): Promise<UserStatistics> {
    const response = await api.get('/users/statistics');
    return response.data.statistics;
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    await api.put(`/users/${id}`, data);
  }

  // Order methods
  async getOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<OrdersResponse> {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  }

  async getOrderById(id: number): Promise<{ order: any }> {
    const response = await api.get(`/orders/admin/order/${id}`);
    return response.data;
  }

  async getOrderStatistics(): Promise<OrderStatistics> {
    const response = await api.get('/orders/admin/statistics');
    return response.data.statistics;
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await api.put(`/orders/${id}/status`, { status });
  }

  async updatePaymentStatus(id: number, payment_status: string): Promise<void> {
    await api.put(`/orders/${id}/payment-status`, { payment_status });
  }

  async deleteOrder(id: number): Promise<void> {
    await api.delete(`/orders/${id}`);
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

export interface UserType {
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