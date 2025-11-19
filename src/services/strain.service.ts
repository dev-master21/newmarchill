import api from './api';

export interface Strain {
  id: number; // Убираем optional, делаем обязательным
  name: string;
  description?: string;
  type?: string;
  thc_content?: string;
  cbd_content?: string;
  terpenes?: string;
  aroma_taste?: string;
  effects?: string;
  flavors?: string[];
}

class StrainService {
  async getStrains(): Promise<Strain[]> {
    const response = await api.get('/admin/strains');
    return response.data.strains;
  }
  
  async getStrain(id: number): Promise<Strain> {
    const response = await api.get(`/admin/strains/${id}`);
    return response.data.strain;
  }
  
  async createStrain(data: Partial<Strain>): Promise<Strain> {
    const response = await api.post('/admin/strains', data);
    return response.data.strain;
  }
  
  async updateStrain(id: number, data: Partial<Strain>): Promise<Strain> {
    const response = await api.put(`/admin/strains/${id}`, data);
    return response.data.strain;
  }
  
  async deleteStrain(id: number): Promise<void> {
    await api.delete(`/admin/strains/${id}`);
  }
  
  async getStrainTemplate(id: number): Promise<Partial<Strain>> {
    const response = await api.get(`/admin/strains/${id}/template`);
    return response.data.template;
  }
}

export default new StrainService();