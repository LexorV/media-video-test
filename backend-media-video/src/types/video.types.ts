/**
 * Интерфейс для создания видео
 */
export interface CreateVideoData {
  userId: string;
  name: string;
  filename: string;
  originalName: string;
  originalFormat: string;
  mimeType: string;
  size: number;
  duration?: number;
  isConverted?: boolean;
  conversionStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'none';
}

/**
 * Интерфейс для результата конвертации
 */
export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number;
}

/**
 * Интерфейс для метаданных видео
 */
export interface VideoMetadata {
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

/**
 * Опции для получения списка видео
 */
export interface GetVideosOptions {
  limit?: number;
  offset?: number;
}

