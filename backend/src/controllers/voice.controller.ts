import { Request, Response, NextFunction } from 'express';

// Helper to call Alibaba DashScope Qwen Audio TTS Flash
async function generateTTS(text: string): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;
  if (!apiKey) {
    console.warn('No DASHSCOPE_API_KEY found in .env, skipping TTS generation.');
    return null;
  }

  try {
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3-tts-flash',
        input: {
          text: text
        },
        parameters: {
          format: 'wav',
          sample_rate: 16000
        }
      })
    });

    if (!response.ok) {
      console.error('DashScope TTS error:', await response.text());
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Failed to generate TTS:', error);
    return null;
  }
}

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For MVP hackathon, we will mock the Groq Whisper + LLM extraction
    // Wait for 1 second to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real scenario, we would parse req.file (audio), send to Groq API, then send to LLM.
    // For this mock, we return a standard Udhaar structure.
    const parsedData = {
      intent: 'ADD_CREDIT',
      customerName: 'Mocked Customer',
      amount: 500,
      description: 'Items from voice recording',
      type: 'gave' as const
    };

    // Generate voice feedback using Alibaba Qwen TTS
    const actionText = parsedData.type === 'gave' ? 'diye hain' : 'mile hain';
    const speechText = `${parsedData.customerName} ki entry samajh aagayi hai. ${parsedData.amount} rupay ${actionText}. Save karne ke liye confirm dabayein.`;
    
    const audioBase64 = await generateTTS(speechText);

    res.json({
      ...parsedData,
      audioBase64
    });
  } catch (error) { 
    next(error); 
  }
};
