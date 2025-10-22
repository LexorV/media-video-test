import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { ConversionResult, VideoMetadata } from '../types/index.js';

// Настройка путей к ffmpeg и ffprobe
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Сервис для конвертации видео в поддерживаемые форматы
 * Следует принципу Single Responsibility - только конвертация видео
 */
export class VideoConversionService {
  private readonly uploadDir: string;
  
  // Форматы, которые требуют конвертации для стриминга
  private readonly FORMATS_REQUIRING_CONVERSION = ['avi', 'mkv', 'x-msvideo', 'x-matroska'];

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.UPLOAD_DIR || './uploads/videos';
  }

  /**
   * Проверяет, нужна ли конвертация файла
   */
  requiresConversion(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase().replace('.', '');
    const mime = mimeType.toLowerCase();
    
    // Проверяем по расширению
    if (this.FORMATS_REQUIRING_CONVERSION.includes(ext)) {
      return true;
    }
    
    // Проверяем по MIME-типу
    return this.FORMATS_REQUIRING_CONVERSION.some(format => mime.includes(format));
  }

  /**
   * Получает метаданные видео
   */
  async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        resolve({
          duration: metadata.format.duration,
          format: metadata.format.format_name,
          width: videoStream?.width,
          height: videoStream?.height,
          bitrate: metadata.format.bit_rate
        });
      });
    });
  }

  /**
   * Конвертирует видео в формат MP4 для стриминга
   * MP4 с кодеком H.264 поддерживается всеми современными браузерами
   */
  async convertToMP4(
    inputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      // Проверяем существование входного файла
      if (!fs.existsSync(inputPath)) {
        return {
          success: false,
          error: 'Входной файл не найден'
        };
      }

      // Генерируем имя для выходного файла
      const outputFilename = `${randomUUID()}.mp4`;
      const outputPath = path.join(this.uploadDir, outputFilename);

      // Получаем метаданные для расчета прогресса
      let totalDuration = 0;
      try {
        const metadata = await this.getVideoMetadata(inputPath);
        totalDuration = metadata.duration || 0;
      } catch (error) {
        console.warn('Не удалось получить метаданные видео:', error);
      }

      return new Promise((resolve) => {
        ffmpeg(inputPath)
          // Видео кодек H.264 - максимальная совместимость
          .videoCodec('libx264')
          // Аудио кодек AAC
          .audioCodec('aac')
          // Настройки для оптимизации стриминга
          .outputOptions([
            '-preset fast',              // Баланс между скоростью и качеством
            '-crf 23',                   // Качество (0-51, 23 - хорошее качество)
            '-movflags +faststart',      // Оптимизация для стриминга (moov atom в начале)
            '-pix_fmt yuv420p'          // Совместимость с большинством плееров
          ])
          // Формат MP4
          .format('mp4')
          // Отслеживание прогресса
          .on('progress', (progress) => {
            if (onProgress && totalDuration > 0 && progress.timemark) {
              // Парсим timemark (формат: HH:MM:SS.MS)
              const timeParts = progress.timemark.split(':');
              const currentSeconds = 
                parseInt(timeParts[0]) * 3600 + 
                parseInt(timeParts[1]) * 60 + 
                parseFloat(timeParts[2]);
              
              const percent = Math.min(100, (currentSeconds / totalDuration) * 100);
              onProgress(Math.round(percent));
            }
          })
          // Успешное завершение
          .on('end', async () => {
            try {
              // Получаем метаданные конвертированного видео
              const metadata = await this.getVideoMetadata(outputPath);
              
              resolve({
                success: true,
                outputPath: outputPath,
                duration: metadata.duration
              });
            } catch (error) {
              resolve({
                success: true,
                outputPath: outputPath
              });
            }
          })
          // Ошибка конвертации
          .on('error', (err) => {
            console.error('Ошибка конвертации видео:', err);
            
            // Удаляем частично конвертированный файл
            if (fs.existsSync(outputPath)) {
              try {
                fs.unlinkSync(outputPath);
              } catch (unlinkError) {
                console.error('Ошибка при удалении файла:', unlinkError);
              }
            }
            
            resolve({
              success: false,
              error: err.message
            });
          })
          // Сохраняем в файл
          .save(outputPath);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка при конвертации'
      };
    }
  }

  /**
   * Удаляет файл
   */
  deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      return false;
    }
  }
}

export default new VideoConversionService();

