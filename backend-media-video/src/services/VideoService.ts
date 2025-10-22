import Video, { IVideo } from '../models/Video.js';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';
import type { CreateVideoData, GetVideosOptions } from '../types/index.js';

/**
 * Сервис для работы с видео
 * Следует принципу Single Responsibility - только бизнес-логика видео
 */
export class VideoService {
  private readonly uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.UPLOAD_DIR || './uploads/videos';
  }

  /**
   * Создать запись о видео в БД
   */
  async createVideo(videoData: CreateVideoData): Promise<IVideo> {
    try {
      // Валидация userId
      if (!Types.ObjectId.isValid(videoData.userId)) {
        throw new Error('Некорректный ID пользователя');
      }

      const video = new Video({
        userId: new Types.ObjectId(videoData.userId),
        name: videoData.name,
        filename: videoData.filename,
        originalName: videoData.originalName,
        originalFormat: videoData.originalFormat,
        mimeType: videoData.mimeType,
        size: videoData.size,
        duration: videoData.duration,
        isConverted: videoData.isConverted || false,
        conversionStatus: videoData.conversionStatus || 'none'
      });

      await video.save();
      return video;
    } catch (error: any) {
      throw new Error(`Ошибка при создании видео: ${error.message}`);
    }
  }

  /**
   * Получить все видео пользователя
   */
  async getVideosByUserId(
    userId: string,
    options?: GetVideosOptions
  ): Promise<IVideo[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Некорректный ID пользователя');
      }

      const query = Video.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .select('-__v');

      if (options?.limit) {
        query.limit(options.limit);
      }

      if (options?.offset) {
        query.skip(options.offset);
      }

      const videos = await query.exec();
      return videos;
    } catch (error: any) {
      throw new Error(`Ошибка при получении видео: ${error.message}`);
    }
  }

  /**
   * Получить видео по ID
   */
  async getVideoById(videoId: string): Promise<IVideo | null> {
    try {
      if (!Types.ObjectId.isValid(videoId)) {
        throw new Error('Некорректный ID видео');
      }

      const video = await Video.findById(videoId).select('-__v');
      return video;
    } catch (error: any) {
      throw new Error(`Ошибка при получении видео: ${error.message}`);
    }
  }

  /**
   * Обновить информацию о видео
   */
  async updateVideo(
    videoId: string,
    updateData: Partial<CreateVideoData>
  ): Promise<IVideo | null> {
    try {
      if (!Types.ObjectId.isValid(videoId)) {
        throw new Error('Некорректный ID видео');
      }

      const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-__v');

      return video;
    } catch (error: any) {
      throw new Error(`Ошибка при обновлении видео: ${error.message}`);
    }
  }

  /**
   * Удалить видео
   */
  async deleteVideo(videoId: string, userId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(videoId)) {
        throw new Error('Некорректный ID видео');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Некорректный ID пользователя');
      }

      // Проверяем владельца
      const video = await Video.findOne({
        _id: new Types.ObjectId(videoId),
        userId: new Types.ObjectId(userId)
      });

      if (!video) {
        return false;
      }

      // Удаляем файл с диска
      const filePath = this.getVideoFilePath(video.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Ошибка при удалении файла:', error);
        }
      }

      // Удаляем запись из БД
      await Video.findByIdAndDelete(videoId);
      return true;
    } catch (error: any) {
      throw new Error(`Ошибка при удалении видео: ${error.message}`);
    }
  }

  /**
   * Получить путь к файлу видео
   */
  getVideoFilePath(filename: string): string {
    // Защита от path traversal
    const sanitizedFilename = path.basename(filename);
    return path.join(this.uploadDir, sanitizedFilename);
  }

  /**
   * Проверить права владения видео
   */
  async validateOwnership(videoId: string, userId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(videoId) || !Types.ObjectId.isValid(userId)) {
        return false;
      }

      const video = await Video.findOne({
        _id: new Types.ObjectId(videoId),
        userId: new Types.ObjectId(userId)
      });

      return video !== null;
    } catch (error) {
      console.error('Ошибка при проверке владельца:', error);
      return false;
    }
  }

  /**
   * Получить количество видео пользователя
   */
  async getVideoCount(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Некорректный ID пользователя');
      }

      const count = await Video.countDocuments({ userId: new Types.ObjectId(userId) });
      return count;
    } catch (error: any) {
      throw new Error(`Ошибка при подсчете видео: ${error.message}`);
    }
  }

  /**
   * Проверить существование файла на диске
   */
  fileExists(filename: string): boolean {
    const filePath = this.getVideoFilePath(filename);
    return fs.existsSync(filePath);
  }
}

export default new VideoService();

