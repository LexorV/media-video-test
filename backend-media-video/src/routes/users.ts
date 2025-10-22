import express, { Request, Response, NextFunction } from 'express';
import userService from '../services/UserService.js';

const router = express.Router();

/* GET users listing. */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

/* POST create user. */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { login, email, password, name, age } = req.body;

    // Базовая валидация
    if (!login || !password) {
      return res.status(400).json({ 
        message: 'Поля login и password обязательны' 
      });
    }

    const user = await userService.createUser({
      login,
      email,
      password,
      name,
      age
    });

    return res.status(201).json(user);
  } catch (error: any) {
    if (error.message.includes('уже существует')) {
      return res.status(409).json({ message: error.message });
    }
    return next(error);
  }
});

/* GET user by ID. */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    return res.json(user);
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/* PUT update user by ID. */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, age } = req.body;
    const user = await userService.updateUser(req.params.id, {
      name,
      email,
      age
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json(user);
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/* DELETE user by ID. */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    return res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

/* POST verify password. */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ 
        message: 'Поля login и password обязательны' 
      });
    }

    const isValid = await userService.verifyPassword(login, password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    return res.json({ message: 'Пароль верный', valid: true });
  } catch (error) {
    return next(error);
  }
});

/* PATCH change password. */
router.patch('/:id/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        message: 'Поле newPassword обязательно' 
      });
    }

    const changed = await userService.changePassword(req.params.id, newPassword);
    
    if (!changed) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({ message: 'Пароль успешно изменен' });
  } catch (error: any) {
    if (error.message.includes('Некорректный ID')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

export default router;

