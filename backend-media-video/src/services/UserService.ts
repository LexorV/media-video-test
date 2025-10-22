import User, { IUser } from '../models/User.js';
import { Types } from 'mongoose';

export class UserService {
  /**
   * Получить всех пользователей
   */
  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find().select('-password'); // Исключаем пароль из выдачи
      return users;
    } catch (error) {
      throw new Error(`Ошибка при получении пользователей: ${error}`);
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(id: string): Promise<IUser | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('Некорректный ID пользователя');
      }
      const user = await User.findById(id).select('-password');
      return user;
    } catch (error) {
      throw new Error(`Ошибка при получении пользователя: ${error}`);
    }
  }

  /**
   * Получить пользователя по логину
   */
  async getUserByLogin(login: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ login });
      return user;
    } catch (error) {
      throw new Error(`Ошибка при поиске пользователя: ${error}`);
    }
  }

  /**
   * Получить пользователя по email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      throw new Error(`Ошибка при поиске пользователя: ${error}`);
    }
  }

  /**
   * Создать нового пользователя
   */
  async createUser(userData: {
    login: string;
    email?: string;
    password: string;
    name?: string;
    age?: number;
  }): Promise<IUser> {
    try {
      // Проверяем, существует ли пользователь с таким логином
      const existingUserByLogin = await this.getUserByLogin(userData.login);
      if (existingUserByLogin) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      // Проверяем, существует ли пользователь с таким email (если email указан)
      if (userData.email) {
        const existingUserByEmail = await this.getUserByEmail(userData.email);
        if (existingUserByEmail) {
          throw new Error('Пользователь с таким email уже существует');
        }
      }

      const user = new User(userData);
      await user.save(); // Пароль будет автоматически захеширован благодаря pre-save middleware

      // Возвращаем пользователя без пароля
      const userObject: any = user.toObject();
      delete userObject.password;
      return userObject as IUser;
    } catch (error) {
      throw new Error(`Ошибка при создании пользователя: ${error}`);
    }
  }

  /**
   * Обновить данные пользователя
   */
  async updateUser(
    id: string,
    updateData: {
      name?: string;
      email?: string;
      age?: number;
    }
  ): Promise<IUser | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('Некорректный ID пользователя');
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      return user;
    } catch (error) {
      throw new Error(`Ошибка при обновлении пользователя: ${error}`);
    }
  }

  /**
   * Удалить пользователя
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('Некорректный ID пользователя');
      }

      const result = await User.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new Error(`Ошибка при удалении пользователя: ${error}`);
    }
  }

  /**
   * Проверить пароль пользователя
   */
  async verifyPassword(login: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserByLogin(login);
      if (!user) {
        return false;
      }

      return await user.comparePassword(password);
    } catch (error) {
      throw new Error(`Ошибка при проверке пароля: ${error}`);
    }
  }

  /**
   * Изменить пароль пользователя
   */
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('Некорректный ID пользователя');
      }

      const user = await User.findById(id);
      if (!user) {
        return false;
      }

      user.password = newPassword;
      await user.save(); // Пароль будет автоматически захеширован

      return true;
    } catch (error) {
      throw new Error(`Ошибка при смене пароля: ${error}`);
    }
  }

  /**
   * Добавить видео в массив пользователя
   */
  async addVideoToUser(userId: string, videoId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(videoId)) {
        throw new Error('Некорректный ID');
      }

      const result = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { videos: new Types.ObjectId(videoId) } },
        { new: true }
      );

      return result !== null;
    } catch (error) {
      throw new Error(`Ошибка при добавлении видео пользователю: ${error}`);
    }
  }

  /**
   * Удалить видео из массива пользователя
   */
  async removeVideoFromUser(userId: string, videoId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(videoId)) {
        throw new Error('Некорректный ID');
      }

      const result = await User.findByIdAndUpdate(
        userId,
        { $pull: { videos: new Types.ObjectId(videoId) } },
        { new: true }
      );

      return result !== null;
    } catch (error) {
      throw new Error(`Ошибка при удалении видео у пользователя: ${error}`);
    }
  }

  /**
   * Получить пользователя с популяцией видео
   */
  async getUserWithVideos(userId: string): Promise<IUser | null> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Некорректный ID пользователя');
      }

      const user = await User.findById(userId)
        .populate('videos')
        .select('-password');
      
      return user;
    } catch (error) {
      throw new Error(`Ошибка при получении пользователя с видео: ${error}`);
    }
  }
}

export default new UserService();

