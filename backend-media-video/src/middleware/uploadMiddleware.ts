import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';

// Директория для загрузки
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/videos';

// Максимальный размер файла (10GB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || '10737418240', 10); // 10GB

// Создание директории, если она не существует
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Разрешенные расширения и MIME-типы
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',      // AVI
  'video/x-matroska',     // MKV
  'video/avi',            // Alternative AVI
  'video/msvideo'         // Alternative AVI
];

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Генерация уникального имени файла с использованием UUID
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// Фильтр файлов
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Проверка расширения
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Недопустимое расширение файла. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }

  // Проверка MIME-типа
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return cb(new Error(`Недопустимый тип файла. Разрешены видео форматы.`));
  }

  // Защита от исполняемых файлов
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  if (dangerousExtensions.some(dangerous => file.originalname.toLowerCase().includes(dangerous))) {
    return cb(new Error('Обнаружен потенциально опасный файл'));
  }

  cb(null, true);
};

// Конфигурация multer
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Только один файл за раз
  },
  fileFilter: fileFilter
});

// Middleware для обработки ошибок multer
export const handleMulterError = (err: any, _req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: `Размер файла превышает максимально допустимый (${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB)`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Можно загружать только один файл за раз'
      });
    }
    return res.status(400).json({
      message: `Ошибка загрузки файла: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      message: err.message || 'Ошибка загрузки файла'
    });
  }
  
  next();
};

