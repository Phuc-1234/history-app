// index.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

// Load environment variables (.env)
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware Pipeline
// ==========================================
app.use(cors()); // Allows your mobile client to connect cross-origin
app.use(express.json()); // CRITICAL: Parses incoming raw JSON request bodies onto req.body

// ==========================================
// API Route Bindings
// ==========================================
// Mounts your authentication routes under the /api/auth prefix
app.use('/api/auth', authRoutes);

// Base Health Check Route (Great for beating Render's spin-down rate limits!)
app.get('/api/healthcheck', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// ==========================================
// Server Boot Initialization
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 History Duolingo Engine running on http://localhost:${PORT}`);
});