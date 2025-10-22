export type { User, RegisterData, LoginData } from './auth';
export type { UpdateProfileData } from './settings';

// Утилитарный тип для ответов API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

