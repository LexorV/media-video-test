import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AxiosError } from 'axios';
import type { User, RegisterData, LoginData } from 'shared/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: JSON.parse(localStorage.getItem('auth.isAuthenticated') ?? 'false') as boolean,
    user: JSON.parse(localStorage.getItem('auth.user') ?? 'null') as User | null,
  }),
  actions: {
    async register(data: RegisterData) {
      try {
        const response = await api.post<User>('/users', data);
        this.user = response.data;
        this.isAuthenticated = true;
        localStorage.setItem('auth.isAuthenticated', 'true');
        localStorage.setItem('auth.user', JSON.stringify(response.data));
        return { success: true, data: response.data };
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка регистрации';
        return { success: false, error: message };
      }
    },

    async login(data: LoginData) {
      try {
        const verifyResponse = await api.post('/users/verify', data);

        if (verifyResponse.data.valid) {
          // Получаем данные пользователя
          const usersResponse = await api.get<User[]>('/users');
          const userData = usersResponse.data.find(u => u.login === data.login);

          if (!userData) {
            return { success: false, error: 'Пользователь не найден' };
          }

          this.user = userData;
          this.isAuthenticated = true;
          localStorage.setItem('auth.isAuthenticated', 'true');
          localStorage.setItem('auth.user', JSON.stringify(userData));
          return { success: true, data: userData };
        }

        return { success: false, error: 'Неверный логин или пароль' };
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка авторизации';
        return { success: false, error: message };
      }
    },

    logout() {
      this.isAuthenticated = false;
      this.user = null;
      localStorage.setItem('auth.isAuthenticated', 'false');
      localStorage.removeItem('auth.user');
    },
  },
});




