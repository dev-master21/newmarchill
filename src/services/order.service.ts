import api from './api';
import { Order } from '../types';

export interface CreateOrderData {
  delivery_method: 'standard' | 'express';
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country?: string;
  payment_method?: string;
  gift_message?: string;
  notes?: string;
  promo_code?: string;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
}

class OrderService {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post('/orders', data);
    return response.data.order;
  }
  
  async getOrders(filters?: OrderFilters): Promise<{
    orders: Order[];
    page: number;
    limit: number;
  }> {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  }
  
  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  }
  
  async getAllOrders(filters?: any): Promise<{
    orders: Order[];
    page: number;
    limit: number;
  }> {
    const response = await api.get('/orders/admin/all', { params: filters });
    return response.data;
  }
  
  async updateOrderStatus(id: string, status: string, trackingNumber?: string): Promise<Order> {
    const response = await api.put(`/orders/${id}/status`, {
      status,
      tracking_number: trackingNumber
    });
    return response.data.order;
  }
  
  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Order> {
    const response = await api.put(`/orders/${id}/payment-status`, {
      payment_status: paymentStatus
    });
    return response.data.order;
  }
  
  async getStatistics(dateFrom?: string, dateTo?: string): Promise<any> {
    const response = await api.get('/orders/admin/statistics', {
      params: { date_from: dateFrom, date_to: dateTo }
    });
    return response.data.statistics;
  }
}

export default new OrderService();