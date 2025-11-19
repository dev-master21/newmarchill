import api from './api';
import { User } from '../types';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  first_name: string;
  last_name?: string;
}

export interface TelegramRegisterData {
  token: string;
  username: string;
  first_name: string;
  last_name?: string;
}

class AuthService {
  // Обычный логин
  async login(data: LoginData): Promise<{ token: string; user: User }> {
    const response = await api.post('/auth/login', data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }
  
  // Обычная регистрация
  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    const response = await api.post('/auth/register', data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }

  // Инициация Telegram авторизации
  async initTelegramAuth(): Promise<string> {
    const response = await api.get('/auth/telegram/init');
    return response.data.botUrl;
  }

  // Callback после Telegram авторизации
  async telegramAuthCallback(token: string): Promise<{ token: string; user: User }> {
    const response = await api.post('/auth/telegram/callback', { token });
    const { token: jwtToken, user } = response.data;
    
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token: jwtToken, user };
  }

  // Регистрация через Telegram
  async registerTelegram(data: TelegramRegisterData): Promise<{ token: string; user: User }> {
    const response = await api.post('/auth/telegram/register', data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }
  
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.user;
  }
  
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', data);
    const user = response.data.user;
    
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }
  
  async getAchievements(): Promise<any[]> {
    const response = await api.get('/auth/achievements');
    return response.data.achievements;
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
  
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();