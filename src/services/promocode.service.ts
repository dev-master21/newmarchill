import api from './api';
import { PromoCode, PromoCodeStats } from '../types/promo.types';

class PromoCodeService {
  async getPromoCodes(): Promise<PromoCode[]> {
    const response = await api.get('/admin/promo-codes');
    return response.data.promoCodes;
  }
  
  async getPromoCode(id: number): Promise<PromoCode> {
    const response = await api.get(`/admin/promo-codes/${id}`);
    return response.data.promoCode;
  }
  
  async getPromoCodeStats(id: number): Promise<PromoCodeStats> {
    const response = await api.get(`/admin/promo-codes/${id}/stats`);
    return response.data.stats;
  }
  
  async createPromoCode(data: Partial<PromoCode>): Promise<PromoCode> {
    const response = await api.post('/admin/promo-codes', data);
    return response.data.promoCode;
  }
  
  async updatePromoCode(id: number, data: Partial<PromoCode>): Promise<PromoCode> {
    const response = await api.put(`/admin/promo-codes/${id}`, data);
    return response.data.promoCode;
  }
  
  async deletePromoCode(id: number): Promise<void> {
    await api.delete(`/admin/promo-codes/${id}`);
  }
  
  async validatePromoCode(code: string, cartTotal: number, productIds: number[]): Promise<{
    valid: boolean;
    discount: number;
    message?: string;
  }> {
    const response = await api.post('/admin/promo-codes/validate', {
      code,
      cart_total: cartTotal,
      product_ids: productIds
    });
    return response.data;
  }
}

export default new PromoCodeService();