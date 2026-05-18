import { Schema, model } from 'mongoose';

const TopicSchema = new Schema({
  gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true, index: true },
  position: { type: Number, required: true, min: 0 },
  name: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true }
}, { timestamps: true });

TopicSchema.index({ gradeId: 1, position: 1 }, { unique: true });
TopicSchema.index({ gradeId: 1, name: 1 }, { unique: true });

export const Topic = model('Topic', TopicSchema);