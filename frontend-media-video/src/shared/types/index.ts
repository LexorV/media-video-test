export type { User, RegisterData, LoginData } from './auth';
export type { UpdateProfileData } from './settings';
export type {
  Video,
  UploadVideoParams,
  LoadVideosParams,
  DeleteVideoParams,
} from './video';

// Утилитарный тип для ответов API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

