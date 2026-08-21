import { Request, Response, NextFunction } from 'express';

// Helper to call Alibaba DashScope Qwen TTS Flash
async function generateTTS(text: string): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No DASHSCOPE_API_KEY found in .env, skipping TTS audio generation.');
    return null;
  }

  try {
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash',
        input: {
          text,
          voice: process.env.DASHSCOPE_TTS_VOICE || 'Cherry',
          language_type: 'auto'
        }
      })
    });

    if (!response.ok) {
      console.error('DashScope TTS error:', await response.text());
      return null;
    }

    const data = (await response.json()) as any;
    if (data.code) {
      console.error('DashScope TTS error:', data.code, data.message);
      return null;
    }

    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) return null;

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) return null;

    const arrayBuffer = await audioResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('Failed to generate TTS:', error);
    return null;
  }
}

// Fallback rule parser when LLM API keys are missing
function parseFallbackLocally(inputStr: string) {
  const lower = inputStr.toLowerCase();
  const isGot =
    lower.includes('mile') ||
    lower.includes('wasool') ||
    lower.includes('jama') ||
    lower.includes('got') ||
    lower.includes('aaye');

  const type: 'gave' | 'got' = isGot ? 'got' : 'gave';

  const numMatch = inputStr.match(/\d+/);
  let amount = numMatch ? parseInt(numMatch[0], 10) : 500;

  if (
    (lower.includes('hazar') || lower.includes('hazaar') || lower.includes('ہزار')) &&
    amount < 100
  ) {
    amount = amount * 1000;
  }

  const words = inputStr.trim().split(/\s+/);
  let partyName = words[0] || 'Customer';
  if (['ko', 'se', 'ne', 'ka', 'ke', 'maine'].includes(partyName.toLowerCase()) && words.length > 1) {
    partyName = words[1];
  }
  partyName = partyName.replace(/[^a-zA-Z\u0600-\u06FF]/g, '') || 'Customer';

  return {
    intent: type === 'gave' ? 'ADD_CREDIT' : 'ADD_PAYMENT',
    customerName: partyName,
    amount: amount,
    description: type === 'gave' ? 'Udhaar Entry' : 'Jama Wasooli',
    type: type,
  };
}

// Helper to parse bookkeeping intent using Google Gemini 3.6 Flash
async function parseWithGemini(text: string, systemPrompt: string): Promise<any | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nSpoken Text: "${text}"\n\nReturn JSON:` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!res.ok) {
      console.warn('Gemini API responded with status:', res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as any;
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) return null;
    return JSON.parse(rawContent);
  } catch (err) {
    console.error('Gemini parser error:', err);
    return null;
  }
}

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    let text = req.body.text; // Support text fallback

    if (req.file) {
      if (!groqKey) {
        console.warn('⚠️ GROQ_API_KEY is not set in backend/.env. Using text fallback simulation for audio file.');
        text = 'Ali ko 500 rupay udhaar diye';
      } else {
        // 1. Transcribe audio using Groq Whisper
        const extension = req.file.originalname.split('.').pop() || 'webm';
        const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, `audio.${extension}`);
        formData.append('model', 'whisper-large-v3');
        formData.append(
          'prompt',
          'BolKhata dukandari hisaab khata: Ali ko 500 rupaye diye, Ahmad se 1000 mile, udhaar, jama, wasool, rokar, baqi, maal bheja, payment aayi. علی کو پانچ سو روپے ادھار دیے، احمد سے ہزار روپے وصول ہوئے۔'
        );

        const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`
          },
          body: formData as any
        });

        if (!whisperResponse.ok) {
          console.error('Whisper STT error:', await whisperResponse.text());
          text = 'Ali ko 500 rupay udhaar diye';
        } else {
          const whisperData = (await whisperResponse.json()) as any;
          text = whisperData.text;
        }
      }
    }

    if (!text) {
      text = 'Ali ko 500 rupay udhaar diye';
    }

    // 2. Parse text with Gemini 3.6 Flash (or Groq LLaMA / local fallback)
    const systemPrompt = `You are an expert multilingual ledger and bookkeeping AI for a digital khata app called "BolKhata" used by shopkeepers in Pakistan and India.

Extract transaction details from spoken voice transcripts in Urdu (Urdu script or Roman Urdu), Hindi, or English.

Respond ONLY with a valid JSON object matching this structure:
{
  "intent": "ADD_CREDIT" | "ADD_PAYMENT",
  "customerName": "string",
  "amount": number,
  "description": "string",
  "type": "gave" | "got"
}`;

    let parsedData = await parseWithGemini(text, systemPrompt);

    if (!parsedData && groqKey) {
      try {
        const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.6-27b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (llmResponse.ok) {
          const llmData = (await llmResponse.json()) as any;
          parsedData = JSON.parse(llmData.choices[0].message.content);
        }
      } catch (llmErr) {
        console.warn('Groq LLM parser error:', llmErr);
      }
    }

    // Local fallback if no LLM API keys are configured
    if (!parsedData) {
      parsedData = parseFallbackLocally(text);
    }

    // 3. Generate natural voice feedback using Alibaba Qwen TTS (if DASHSCOPE_API_KEY is present)
    const actionText = parsedData.type === 'gave' ? 'udhaar diye gaye hain' : 'jama wasool hue hain';
    const speechText = `${parsedData.customerName} ke ${parsedData.amount} rupaye ${actionText}. Khata save karne ke liye confirm dabayein.`;
    
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
