import { Schema, model } from 'mongoose';

const GradeSchema = new Schema({
  gradeNumber: { type: Number, required: true, unique: true, min: 10, max: 12 }
}, { timestamps: true });

export const Grade = model('Grade', GradeSchema);