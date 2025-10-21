import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: JSON.parse(localStorage.getItem('auth.isAuthenticated') ?? 'false') as boolean,
  }),
  actions: {
    login() {
      this.isAuthenticated = true;
      localStorage.setItem('auth.isAuthenticated', 'true');
    },
    logout() {
      this.isAuthenticated = false;
      localStorage.setItem('auth.isAuthenticated', 'false');
    },
  },
});


