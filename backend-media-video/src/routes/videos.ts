import express, { Request, Response, NextFunction } from 'express';
import { uploadMiddleware, handleMulterError } from '../middleware/uploadMiddleware.js';
import { validateVideoFile } from '../middleware/fileValidationMiddleware.js';
import videoService from '../services/VideoService.js';
import userService from '../services/UserService.js';
import videoConversionService from '../services/VideoConversionService.js';
import videoQueue, { getQueueStats, getJobInfo } from '../queues/videoConversionQueue.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * POST /videos/upload
 * Загрузка видеофайла
 */
router.post(
  '/upload',
  uploadMiddleware.single('video'),
  handleMulterError,
  validateVideoFile,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверяем, что файл загружен
      if (!req.file) {
        return res.status(400).json({
          message: 'Видео файл не был загружен'
        });
      }

      // Получаем userId из body (в реальном приложении из JWT токена)
      const { userId, name } = req.body;

      if (!userId) {
        // Удаляем загруженный файл
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: 'userId обязателен'
        });
      }

      const videoName = name || req.file.originalname;
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

      // Проверяем, нужна ли конвертация
      const needsConversion = videoConversionService.requiresConversion(
        req.file.mimetype,
        ext
      );

      let finalFilename = req.file.filename;
      let finalMimeType = req.file.mimetype;
      let duration: number | undefined;
      let conversionStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'none' = 'none';

      if (needsConversion) {
        // Создаем запись с статусом pending
        conversionStatus = 'pending';
      }

      // Создаем запись о видео в БД
      const video = await videoService.createVideo({
        userId,
        name: videoName,
        filename: finalFilename,
        originalName: req.file.originalname,
        originalFormat: ext,
        mimeType: finalMimeType,
        size: req.file.size,
        duration,
        isConverted: false,
        conversionStatus
      });

      // Добавляем ID видео в массив пользователя
      await userService.addVideoToUser(userId, String(video._id));

      // Если нужна конвертация, добавляем задачу в Bull Queue
      if (needsConversion) {
        try {
          // Получаем статистику очереди для информирования пользователя
          const queueStats = await getQueueStats();
          
          // Добавляем задачу в очередь
          const job = await videoQueue.add(
            {
              videoId: String(video._id),
              inputPath: req.file.path,
              userId: userId
            },
            {
              priority: 1, // Можно настроить приоритет (меньше = выше)
              timeout: 7200000 // 2 часа максимум на конвертацию
            }
          );
          
          console.log(`📋 [Upload] Видео ${video._id} добавлено в очередь конвертации (Job ID: ${job.id})`);
          console.log(`📊 [Upload] Текущая очередь: ${queueStats.active} активных, ${queueStats.waiting} ожидающих`);
        } catch (error) {
          console.error(`❌ [Upload] Ошибка добавления в очередь:`, error);
          // Если не удалось добавить в очередь, помечаем как failed
          await videoService.updateVideo(String(video._id), {
            conversionStatus: 'failed'
          });
        }
      }

      return res.status(201).json({
        message: needsConversion 
          ? 'Видео загружено и отправлено на конвертацию' 
          : 'Видео успешно загружено',
        video: {
          id: video._id,
          name: video.name,
          originalName: video.originalName,
          size: video.size,
          mimeType: video.mimeType,
          conversionStatus: video.conversionStatus,
          createdAt: video.createdAt
        }
      });
    } catch (error: any) {
      console.error('Ошибка при загрузке видео:', error);
      
      // Удаляем файл при ошибке
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Ошибка при удалении файла:', unlinkError);
        }
      }
      
      return next(error);
    }
  }
);

/**
 * GET /videos
 * Получение списка всех видео пользователя
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, limit, offset } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId обязателен'
      });
    }

    const videos = await videoService.getVideosByUserId(
      userId as string,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    const count = await videoService.getVideoCount(userId as string);

    return res.json({
      videos: videos.map(v => ({
        id: v._id,
        name: v.name,
        originalName: v.originalName,
        size: v.size,
        mimeType: v.mimeType,
        duration: v.duration,
        isConverted: v.isConverted,
        conversionStatus: v.conversionStatus,
        createdAt: v.createdAt
      })),
      total: count
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /videos/:id
 * Получение метаданных конкретного видео
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId обязателен'
      });
    }

    const video = await videoService.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        message: 'Видео не найдено'
      });
    }

    // Проверяем права доступа
    const isOwner = await videoService.validateOwnership(id, userId as string);
    if (!isOwner) {
      return res.status(403).json({
        message: 'Нет доступа к этому видео'
      });
    }

    return res.json({
      id: video._id,
      name: video.name,
      originalName: video.originalName,
      originalFormat: video.originalFormat,
      size: video.size,
      mimeType: video.mimeType,
      duration: video.duration,
      isConverted: video.isConverted,
      conversionStatus: video.conversionStatus,
      createdAt: video.createdAt
    });
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/**
 * GET /videos/:id/stream
 * Стриминг видео с поддержкой Range requests
 */
router.get('/:id/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId обязателен'
      });
    }

    // Получаем информацию о видео
    const video = await videoService.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        message: 'Видео не найдено'
      });
    }

    // Проверяем права доступа
    const isOwner = await videoService.validateOwnership(id, userId as string);
    if (!isOwner) {
      return res.status(403).json({
        message: 'Нет доступа к этому видео'
      });
    }

    // Проверяем статус конвертации
    if (video.conversionStatus === 'processing' || video.conversionStatus === 'pending') {
      return res.status(202).json({
        message: 'Видео обрабатывается. Попробуйте позже.',
        conversionStatus: video.conversionStatus
      });
    }

    if (video.conversionStatus === 'failed') {
      return res.status(500).json({
        message: 'Ошибка при обработке видео'
      });
    }

    // Получаем путь к файлу
    const filePath = videoService.getVideoFilePath(video.filename);

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'Видео файл не найден на сервере'
      });
    }

    // Получаем размер файла
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Обработка Range requests для стриминга
    const range = req.headers.range;

    if (range) {
      // Парсим range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      const chunkSize = (end - start) + 1;
      
      // Создаем поток для чтения части файла
      const fileStream = fs.createReadStream(filePath, { start, end });
      
      // Отправляем заголовки для частичного контента
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType
      });
      
      // Отправляем поток
      fileStream.pipe(res);
    } else {
      // Отправляем весь файл
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
        'Accept-Ranges': 'bytes'
      });
      
      // Создаем поток для чтения файла
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error: any) {
    console.error('Ошибка при стриминге видео:', error);
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/**
 * DELETE /videos/:id
 * Удаление видео
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId обязателен'
      });
    }

    // Удаляем видео (проверка владельца внутри)
    const deleted = await videoService.deleteVideo(id, userId);

    if (!deleted) {
      return res.status(404).json({
        message: 'Видео не найдено или у вас нет прав на его удаление'
      });
    }

    // Удаляем ID видео из массива пользователя
    await userService.removeVideoFromUser(userId, id);

    return res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/**
 * GET /videos/queue/stats
 * Получение статистики очереди конвертации
 */
router.get('/queue/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getQueueStats();
    
    return res.json({
      queue: stats,
      info: {
        maxConcurrent: 2,
        description: 'Максимум 2 конвертации одновременно'
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /videos/queue/job/:jobId
 * Получение информации о конкретной задаче конвертации
 */
router.get('/queue/job/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    
    const jobInfo = await getJobInfo(jobId);
    
    if (!jobInfo) {
      return res.status(404).json({
        message: 'Задача не найдена'
      });
    }
    
    return res.json(jobInfo);
  } catch (error) {
    return next(error);
  }
});

export default router;

