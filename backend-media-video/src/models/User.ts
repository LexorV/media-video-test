import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  login: string;
  email?: string;
  password: string;
  name?: string;
  age?: number;
  videos: mongoose.Types.ObjectId[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User Schema
const UserSchema = new mongoose.Schema<IUser>({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware для хеширования пароля перед сохранением
UserSchema.pre('save', async function(next) {
  // Хешируем пароль только если он был изменен
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

