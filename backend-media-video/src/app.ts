import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';

// Import routes
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import videosRouter from './routes/videos.js';

// Import and initialize Redis Queue
import { initializeQueue, closeQueue } from './queues/videoConversionQueue.js';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize MongoDB connection via mongoose
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/media-video-test';
mongoose.connect(mongoUri);

const db = mongoose.connection;
db.on('connected', async () => {
  console.log('Mongoose connected to ' + mongoUri);
  
  // Инициализация Redis Queue после успешного подключения к MongoDB
  try {
    await initializeQueue();
    console.log('✅ [App] Redis Queue успешно инициализирована');
  } catch (error) {
    console.error('❌ [App] Ошибка инициализации Redis Queue:', error);
    console.warn('⚠️ [App] Приложение продолжит работу без очереди');
  }
});
db.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
db.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown для MongoDB и Redis Queue
process.on('SIGINT', async () => {
  console.log('📴 [App] Получен сигнал SIGINT, завершаю работу...');
  
  try {
    await closeQueue();
    console.log('✅ [App] Redis Queue закрыта');
  } catch (error) {
    console.error('❌ [App] Ошибка закрытия Redis Queue:', error);
  }
  
  await db.close();
  console.log('✅ [App] Mongoose отключен');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📴 [App] Получен сигнал SIGTERM, завершаю работу...');
  
  try {
    await closeQueue();
    console.log('✅ [App] Redis Queue закрыта');
  } catch (error) {
    console.error('❌ [App] Ошибка закрытия Redis Queue:', error);
  }
  
  await db.close();
  console.log('✅ [App] Mongoose отключен');
  process.exit(0);
});

const app = express();

// Создание директории для загрузки видео, если она не существует
import fs from 'fs';
const uploadDir = process.env.UPLOAD_DIR || './uploads/videos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Создана директория для загрузки: ${uploadDir}`);
}

// CORS configuration
app.use(cors({
  origin: ['http://localhost:9000', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/videos', videosRouter);

// catch 404 and forward to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;

// ============================================================================
// Server startup code (moved from bin/www.ts)
// ============================================================================

import http from 'http';
import debugLib from 'debug';

const debug = debugLib('backend-media-video:server');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): number | string | false {
  const portNum = parseInt(val, 10);

  if (isNaN(portNum)) {
    // named pipe
    return val;
  }

  if (portNum >= 0) {
    // port number
    return portNum;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}

