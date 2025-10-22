import { Request, Response, NextFunction } from 'express';
import fileType from 'file-type';
import fs from 'fs';
import path from 'path';

/**
 * Middleware для валидации типа загруженного файла
 * Проверяет реальный MIME-тип файла, а не полагается только на расширение
 */
export const validateVideoFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Проверяем, что файл был загружен
    if (!req.file) {
      res.status(400).json({
        message: 'Файл не был загружен'
      });
      return;
    }

    const filePath = req.file.path;

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      res.status(500).json({
        message: 'Ошибка при сохранении файла'
      });
      return;
    }

    try {
      // Проверяем реальный тип файла
      const detectedType = await fileType.fromFile(filePath);

      // Если тип файла не определен
      if (!detectedType) {
        // Для некоторых видео форматов (например, MKV) file-type может не определить тип
        // Проверяем расширение как fallback
        const ext = path.extname(req.file.originalname).toLowerCase();
        const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
        
        if (!allowedExtensions.includes(ext)) {
          // Удаляем файл
          fs.unlinkSync(filePath);
          res.status(400).json({
            message: 'Невозможно определить тип файла. Пожалуйста, загрузите корректный видеофайл.'
          });
          return;
        }
        
        // Продолжаем, так как расширение допустимое
        next();
        return;
      }

      // Проверяем, что это видео файл
      if (!detectedType.mime.startsWith('video/')) {
        // Удаляем файл
        fs.unlinkSync(filePath);
        res.status(400).json({
          message: 'Загруженный файл не является видео. Пожалуйста, загрузите видеофайл.'
        });
        return;
      }

      // Проверяем, что MIME-тип разрешен (но для видео обычно разрешаем все video/*)
      // Это дополнительная защита
      
      // Обновляем MIME-тип в объекте file на реальный
      req.file.mimetype = detectedType.mime;

      next();
    } catch (error) {
      // Если произошла ошибка при определении типа файла
      console.error('Ошибка при определении типа файла:', error);
      
      // Удаляем файл
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.status(500).json({
        message: 'Ошибка при проверке файла'
      });
      return;
    }
  } catch (error) {
    console.error('Ошибка в middleware валидации файла:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера при валидации файла'
    });
    return;
  }
};

/**
 * Проверяет, находится ли файл внутри разрешенной директории
 * Защита от path traversal атак
 */
export const validateFilePath = (filePath: string, allowedDir: string): boolean => {
  const resolvedPath = path.resolve(filePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  return resolvedPath.startsWith(resolvedAllowedDir);
};

