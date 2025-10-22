import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AxiosError } from 'axios';
import type {
  Video,
  UploadVideoParams,
  LoadVideosParams,
  DeleteVideoParams,
} from 'src/shared/types/video';

// Реэкспортируем типы для удобства
export type {
  Video,
  UploadVideoParams,
  LoadVideosParams,
  DeleteVideoParams,
};

interface VideoStoreState {
  videos: Video[];
  recentVideos: Video[];
  totalVideos: number;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
}

export const useVideoStore = defineStore('video', {
  state: (): VideoStoreState => ({
    videos: [],
    recentVideos: [],
    totalVideos: 0,
    loading: false,
    uploading: false,
    uploadProgress: 0,
  }),

  actions: {
    async uploadVideo(params: UploadVideoParams): Promise<Video> {
      this.uploading = true;
      this.uploadProgress = 0;

      const formData = new FormData();
      formData.append('video', params.file);
      formData.append('userId', params.userId);

      if (params.name?.trim()) {
        formData.append('name', params.name.trim());
      }

      try {
        const response = await api.post<{ message: string; video: Video }>(
          '/videos/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                this.uploadProgress = progress;
                params.onProgress?.(progress);
              }
            },
          }
        );

        const video = response.data.video;

        // Добавляем видео в список недавно загруженных
        this.recentVideos.unshift(video);
        // Ограничиваем список до 5 элементов
        if (this.recentVideos.length > 5) {
          this.recentVideos = this.recentVideos.slice(0, 5);
        }

        // Добавляем в общий список, если он загружен
        if (this.videos.length > 0) {
          this.videos.unshift(video);
          this.totalVideos++;
        }

        return video;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка при загрузке видео';
        throw new Error(message);
      } finally {
        this.uploading = false;
        this.uploadProgress = 0;
      }
    },

    async loadVideos(params: LoadVideosParams): Promise<void> {
      this.loading = true;

      try {
        const limit = params.limit || 100;
        const offset = params.offset || 0;

        const response = await api.get<{ videos: Video[]; total: number }>(
          `/videos?userId=${params.userId}&limit=${limit}&offset=${offset}`
        );

        this.videos = response.data.videos;
        this.totalVideos = response.data.total;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка при загрузке списка видео';
        throw new Error(message);
      } finally {
        this.loading = false;
      }
    },

    async deleteVideo(params: DeleteVideoParams): Promise<void> {
      try {
        await api.delete(`/videos/${params.videoId}`, {
          data: { userId: params.userId },
        });

        // Удаляем видео из списков
        this.videos = this.videos.filter((v) => v.id !== params.videoId);
        this.recentVideos = this.recentVideos.filter((v) => v.id !== params.videoId);
        this.totalVideos--;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Ошибка при удалении видео';
        throw new Error(message);
      }
    },

    getVideoUrl(videoId: string, userId: string): string {
      return `http://localhost:3000/videos/${videoId}/stream?userId=${userId}`;
    },

    clearRecentVideos() {
      this.recentVideos = [];
    },

    clearVideos() {
      this.videos = [];
      this.totalVideos = 0;
    },
  },
});

