export interface Video {
  id: string;
  name: string;
  originalName: string;
  originalFormat?: string;
  size: number;
  mimeType: string;
  duration?: number;
  isConverted: boolean;
  conversionStatus: string;
  createdAt: string;
}

export interface UploadVideoParams {
  file: File;
  userId: string;
  name?: string;
  onProgress?: (progress: number) => void;
}

export interface LoadVideosParams {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface DeleteVideoParams {
  videoId: string;
  userId: string;
}

