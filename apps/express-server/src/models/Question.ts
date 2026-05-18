import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
  prompt: { type: String, required: true },
  questionType: { type: String, enum: ['choose', 'fill', 'match'], required: true },
  gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', default: null },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', default: null }
}, { timestamps: true });

export const Question = model('Question', QuestionSchema);