import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import authService, { RegisterData, TelegramRegisterData } from '../services/auth.service';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  telegramAuthInit: () => Promise<string>;
  telegramAuthCallback: (token: string) => Promise<void>;
  registerTelegram: (data: TelegramRegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
      
      login: async (username: string, password: string) => {
        try {
          const { token, user } = await authService.login({ username, password });
          set({ user, token, isAuthenticated: true });
          console.log('Login successful, user role:', user.role);
        } catch (error) {
          throw error;
        }
      },
      
      register: async (data: RegisterData) => {
        try {
          const { token, user } = await authService.register(data);
          set({ user, token, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      telegramAuthInit: async () => {
        try {
          const botUrl = await authService.initTelegramAuth();
          return botUrl;
        } catch (error) {
          throw error;
        }
      },

      telegramAuthCallback: async (token: string) => {
        try {
          const { token: jwtToken, user } = await authService.telegramAuthCallback(token);
          set({ user, token: jwtToken, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      registerTelegram: async (data: TelegramRegisterData) => {
        try {
          const { token, user } = await authService.registerTelegram(data);
          set({ user, token, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },
      
      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateProfile: async (data: Partial<User>) => {
        try {
          const user = await authService.updateProfile(data);
          set({ user });
        } catch (error) {
          throw error;
        }
      },
      
      refreshUserData: async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const user = await authService.getProfile();
            set({ user, isAuthenticated: true });
            console.log('User data refreshed, role:', user.role);
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
      
      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const user = await authService.getProfile();
            set({ user, token, isAuthenticated: true, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);