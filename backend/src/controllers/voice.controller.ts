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
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
      return;
    }

    let text = req.body.text; // Support text fallback

    if (req.file) {
      // 1. Transcribe audio using Groq Whisper
      const extension = req.file.originalname.split('.').pop() || 'm4a';
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${extension}`);
      formData.append('model', 'whisper-large-v3');

      const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`
        },
        body: formData as any
      });

      if (!whisperResponse.ok) {
        throw new Error(`Whisper error: ${await whisperResponse.text()}`);
      }

      const whisperData = await whisperResponse.json();
      text = whisperData.text;
    }

    if (!text) {
      res.status(400).json({ error: 'No audio file or text provided' });
      return;
    }

    // 2. Parse text with Groq LLM
    const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a ledger app called BolKhata. Extract transaction details from the given text. Respond ONLY in valid JSON format exactly matching this structure: {"intent": "ADD_CREDIT" | "ADD_PAYMENT", "customerName": "string", "amount": number, "description": "string", "type": "gave" | "got"}. If someone gave items/money (Udhaar), type is "gave". If they paid money (Jama), type is "got".'
          },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM error: ${await llmResponse.text()}`);
    }

    const llmData = await llmResponse.json();
    const parsedData = JSON.parse(llmData.choices[0].message.content);

    // 3. Generate voice feedback using Alibaba Qwen TTS
    const actionText = parsedData.type === 'gave' ? 'diye hain' : 'mile hain';
    const speechText = `${parsedData.customerName} ki entry samajh aagayi hai. ${parsedData.amount} rupay ${actionText}. Save karne ke liye confirm dabayein.`;
    
    const audioBase64 = await generateTTS(speechText);

    res.json({
      ...parsedData,
      audioBase64,
      originalText: text
    });
  } catch (error) { 
    next(error); 
  }
};
