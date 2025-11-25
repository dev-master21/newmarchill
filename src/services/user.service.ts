import api from './api';
import { User } from '../types';

class UserService {
  async update(userId: number, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${userId}`, data);
    return response.data.user;
  }
}

export default new UserService();