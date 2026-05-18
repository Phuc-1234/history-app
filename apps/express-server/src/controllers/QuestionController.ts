import { Request, Response } from 'express';
import { validateChooseAnswer } from '@history-app/shared';

export const verifyAnswer = async (req: Request, res: Response) => {
  try {
    const { userAnswerId, correctAnswerId } = req.body;
    
    // Using the shared module right here!
    const isCorrect = validateChooseAnswer(userAnswerId, correctAnswerId);
    
    res.status(200).json({ success: true, isCorrect });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};