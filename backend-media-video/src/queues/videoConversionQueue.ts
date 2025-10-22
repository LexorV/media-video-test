import Queue from 'bull';
import videoConversionService from '../services/VideoConversionService.js';
import videoService from '../services/VideoService.js';
import path from 'path';

/**
 * Интерфейс данных задачи конвертации
 */
interface VideoConversionJob {
  videoId: string;
  inputPath: string;
  userId: string;
}

/**
 * Конфигурация Redis из переменных окружения
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Для Bull это важно
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 10000);
    console.log(`🔄 [Redis] Попытка переподключения ${times}, задержка ${delay}ms`);
    return delay;
  },
};

console.log(`🔌 [Redis] Подключение к Redis на ${redisConfig.host}:${redisConfig.port}`);

/**
 * Создание очереди конвертации видео с подключением к Redis
 * Bull Queue обеспечивает:
 * - Персистентность задач (не теряются при перезагрузке)
 * - Автоматические повторы при ошибках
 * - Контроль количества одновременных задач
 * - Приоритизацию
 */
export const videoQueue = new Queue<VideoConversionJob>('video-conversion', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,           // Повторить 3 раза при ошибке
    backoff: {
      type: 'exponential',
      delay: 60000,        // Начальная задержка 1 минута между попытками
    },
    removeOnComplete: 100, // Хранить последние 100 выполненных задач
    removeOnFail: 200,     // Хранить последние 200 проваленных задач
    timeout: 7200000,      // Максимальное время выполнения 2 часа
  },
});

/**
 * Проверка соединения с Redis при старте
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = await videoQueue.client;
    await client.ping();
    console.log('✅ [Redis] Соединение успешно установлено');
    return true;
  } catch (error) {
    console.error('❌ [Redis] Ошибка подключения:', error);
    return false;
  }
}

/**
 * Инициализация очереди с проверкой подключения
 */
export async function initializeQueue(): Promise<void> {
  try {
    const isConnected = await checkRedisConnection();
    if (!isConnected) {
      console.warn('⚠️ [Redis] Работа без Redis - очередь не будет персистентной');
    }
    
    // Получаем статистику при старте
    const stats = await getQueueStats();
    console.log('📊 [Queue] Статистика очереди при запуске:', stats);
    
    // Если есть зависшие задачи, пробуем их перезапустить
    if (stats.active > 0) {
      console.log('🔄 [Queue] Обнаружены активные задачи, проверяю их статус...');
    }
  } catch (error) {
    console.error('❌ [Queue] Ошибка инициализации очереди:', error);
    throw error;
  }
}

/**
 * Обработчик очереди
 * Параметр 2 = максимум 2 конвертации одновременно
 * Для больших серверов можно увеличить до 4-8
 */
videoQueue.process(2, async (job) => {
  const { videoId, inputPath } = job.data;
  
  console.log(`🎬 [Queue] Начало конвертации видео ${videoId} (попытка ${job.attemptsMade + 1}/${job.opts.attempts})`);
  console.log(`📊 [Queue] Позиция в очереди: ${await videoQueue.getWaitingCount()} ожидающих`);
  
  try {
    // Обновляем статус на "в процессе"
    await videoService.updateVideo(videoId, {
      conversionStatus: 'processing'
    });
    
    // Конвертация с отслеживанием прогресса
    const result = await videoConversionService.convertToMP4(
      inputPath,
      (progress) => {
        // Обновляем прогресс в Bull (можно отслеживать через Bull Board)
        job.progress(progress);
        console.log(`📊 [Queue] Конвертация ${videoId}: ${progress}%`);
      }
    );
    
    if (result.success && result.outputPath) {
      // Удаляем оригинальный файл
      videoConversionService.deleteFile(inputPath);
      
      // Обновляем запись в БД
      const convertedFilename = path.basename(result.outputPath);
      await videoService.updateVideo(videoId, {
        filename: convertedFilename,
        mimeType: 'video/mp4',
        isConverted: true,
        conversionStatus: 'completed',
        duration: result.duration
      });
      
      console.log(`✅ [Queue] Видео ${videoId} успешно конвертировано`);
      
      return { 
        success: true, 
        videoId,
        convertedFilename,
        duration: result.duration
      };
    } else {
      throw new Error(result.error || 'Неизвестная ошибка конвертации');
    }
  } catch (error: any) {
    console.error(`❌ [Queue] Ошибка конвертации ${videoId}:`, error.message);
    
    // Обновляем статус только после всех попыток
    if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
      console.error(`💀 [Queue] Все попытки исчерпаны для ${videoId}`);
      await videoService.updateVideo(videoId, {
        conversionStatus: 'failed'
      });
    } else {
      console.warn(`⚠️ [Queue] Попытка ${job.attemptsMade + 1} провалилась, повтор через ${60000 * Math.pow(2, job.attemptsMade)}ms`);
    }
    
    throw error; // Bull обработает повтор автоматически
  }
});

// ============================================================================
// События для мониторинга и логирования
// ============================================================================

videoQueue.on('completed', (job, result) => {
  console.log(`✅ [Queue] Задача ${job.id} завершена успешно:`, result);
});

videoQueue.on('failed', (job, err) => {
  console.error(`❌ [Queue] Задача ${job?.id} провалилась после всех попыток:`, err.message);
});

videoQueue.on('stalled', (job) => {
  console.warn(`⚠️ [Queue] Задача ${job.id} зависла (stalled), Bull автоматически перезапустит...`);
});

videoQueue.on('active', (job) => {
  console.log(`▶️ [Queue] Задача ${job.id} начала выполнение (видео: ${job.data.videoId})`);
});

videoQueue.on('waiting', (jobId) => {
  console.log(`⏳ [Queue] Задача ${jobId} добавлена в очередь ожидания`);
});

videoQueue.on('progress', (_job, _progress) => {
  // Можно отправлять прогресс через WebSocket пользователю
  // io.to(_job.data.userId).emit('conversion-progress', { videoId: _job.data.videoId, progress: _progress });
});

videoQueue.on('error', (error) => {
  console.error('🚨 [Queue] Ошибка Bull Queue:', error);
});

// Обработка событий Redis
videoQueue.on('global:resumed', () => {
  console.log('▶️ [Queue] Очередь глобально возобновлена');
});

videoQueue.on('global:paused', () => {
  console.log('⏸️ [Queue] Очередь глобально приостановлена');
});

// Обработка ошибок подключения к Redis
const redisClient = videoQueue.client;
redisClient.on('connect', () => {
  console.log('🔌 [Redis] Подключено к серверу Redis');
});

redisClient.on('ready', () => {
  console.log('✅ [Redis] Клиент готов к работе');
});

redisClient.on('error', (error) => {
  console.error('❌ [Redis] Ошибка клиента:', error.message);
});

redisClient.on('close', () => {
  console.warn('⚠️ [Redis] Соединение закрыто');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 [Redis] Переподключение...');
});

redisClient.on('end', () => {
  console.warn('🔌 [Redis] Соединение завершено');
});

// ============================================================================
// Утилиты для работы с очередью
// ============================================================================

/**
 * Получить статистику очереди
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
    videoQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed
  };
}

/**
 * Получить информацию о задаче
 */
export async function getJobInfo(jobId: string) {
  const job = await videoQueue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id,
    data: job.data,
    progress: job.progress(),
    state: await job.getState(),
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

/**
 * Очистить завершенные задачи
 */
export async function cleanQueue() {
  await videoQueue.clean(24 * 60 * 60 * 1000); // Старше 24 часов
  console.log('🧹 [Queue] Очередь очищена от старых задач');
}

/**
 * Пауза очереди
 */
export async function pauseQueue() {
  await videoQueue.pause();
  console.log('⏸️ [Queue] Очередь поставлена на паузу');
}

/**
 * Возобновить очередь
 */
export async function resumeQueue() {
  await videoQueue.resume();
  console.log('▶️ [Queue] Очередь возобновлена');
}

/**
 * Graceful shutdown
 */
export async function closeQueue() {
  await videoQueue.close();
  console.log('🔌 [Queue] Очередь закрыта');
}

export default videoQueue;

