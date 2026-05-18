import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  refreshTokenHash: { type: String, default: null, select: false },
  totalXP: { type: Number, default: 0, min: 0 },
  totalGold: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export const User = model('User', UserSchema);