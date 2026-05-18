import { Schema, model } from 'mongoose';

const SectionSchema = new Schema({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  position: { type: Number, required: true, min: 0 },
  name: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true }
}, { timestamps: true });

SectionSchema.index({ lessonId: 1, position: 1 }, { unique: true });
SectionSchema.index({ lessonId: 1, name: 1 }, { unique: true });

export const Section = model('Section', SectionSchema);