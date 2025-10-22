import mongoose, { Document, Types } from 'mongoose';

export interface IVideo extends Document {
  userId: Types.ObjectId;
  name: string;
  filename: string;
  originalName: string;
  originalFormat: string;
  mimeType: string;
  size: number;
  duration?: number;
  isConverted: boolean;
  conversionStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'none';
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new mongoose.Schema<IVideo>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 255
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  originalFormat: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  conversionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'none'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Обновление даты изменения перед сохранением
VideoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Video = mongoose.model<IVideo>('Video', VideoSchema);

export default Video;

