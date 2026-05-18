import { Schema, model } from 'mongoose';

const LessonSchema = new Schema({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  position: { type: Number, required: true, min: 0 },
  name: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true }
}, { timestamps: true });

LessonSchema.index({ topicId: 1, position: 1 }, { unique: true });
LessonSchema.index({ topicId: 1, name: 1 }, { unique: true });

export const Lesson = model('Lesson', LessonSchema);