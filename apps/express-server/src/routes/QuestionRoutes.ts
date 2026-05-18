import { Router } from 'express';
import { verifyAnswer } from '../controllers/QuestionController';

const router = Router();

router.post('/verify', verifyAnswer);

export default router;