// index.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

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
app.use('/api/user', userRoutes);

// Base Health Check Route (Great for beating Render's spin-down rate limits!)
app.get('/api/healthcheck', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// anti stack trace leak
// This MUST have 4 parameters so Express recognizes it as an error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // 1. Catch malformed JSON bodies specifically from body-parser
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: "Invalid JSON format payload provided." 
        });
    }

    // 2. Fallback protection for any other unhandled synchronous/asynchronous server crashes
    console.error("Unhandled Global Server Error:", err.message); // Kept safe in server console logs
    
    return res.status(500).json({ 
        error: "An unexpected operational anomaly occurred on the server." 
    });
});


// ==========================================
// Server Boot Initialization
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 History Duolingo Engine running on http://localhost:${PORT}`);
});