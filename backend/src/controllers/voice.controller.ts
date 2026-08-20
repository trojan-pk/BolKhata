import { Request, Response, NextFunction } from 'express';

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For MVP hackathon, we will mock the Groq Whisper + LLM extraction
    // Wait for 1 second to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real scenario, we would parse req.file (audio), send to Groq API, then send to LLM.
    // For this mock, we return a standard Udhaar structure.
    res.json({
      intent: 'ADD_CREDIT',
      customerName: 'Mocked Customer',
      amount: 500,
      description: 'Items from voice recording',
      type: 'gave'
    });
  } catch (error) { next(error); }
};
