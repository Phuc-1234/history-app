import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import questionRoutes from './routes/QuestionRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connectDB(); 

app.use(cors());
app.use(express.json());

// Main Routes Link
app.use('/api/questions', questionRoutes);

app.listen(PORT, () => {
  console.log(`Express server running on port http://localhost:${PORT}`);
});


