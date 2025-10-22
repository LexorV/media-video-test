import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AxiosError } from 'axios';
import type { User, UpdateProfileData } from 'shared/types';
import { useAuthStore } from './auth-store';

export const useSettingsStore = defineStore('settings', {
  actions: {
    async updateProfile(userId: string, data: UpdateProfileData) {
      try {
        const response = await api.put<User>(`/users/${userId}`, data);

        // Обновляем данные пользователя в auth store
        const auth = useAuthStore();
        auth.user = response.data;
        localStorage.setItem('auth.user', JSON.stringify(response.data));

        return { success: true, data: response.data };
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка обновления профиля';
        return { success: false, error: message };
      }
    },

    async changePassword(userId: string, newPassword: string) {
      try {
        await api.patch(`/users/${userId}/password`, { newPassword });
        return { success: true };
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка изменения пароля';
        return { success: false, error: message };
      }
    },
  },
});

