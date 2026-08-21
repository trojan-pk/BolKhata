import { Request, Response, NextFunction } from 'express';

// Helper to call Alibaba DashScope Qwen TTS Flash
async function generateTTS(text: string): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;
  if (!apiKey) return null;

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

    if (!response.ok) return null;

    const data = (await response.json()) as any;
    if (data.code) return null;

    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) return null;

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) return null;

    const arrayBuffer = await audioResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    return null;
  }
}

// Fallback rule parser when LLM API keys are missing.
// Understands both English and Urdu / Roman-Urdu phrasing, but always emits
// English descriptions so the ledger stays English.
function parseFallbackLocally(inputStr: string) {
  const lower = inputStr.toLowerCase();

  // "Money came in" signals — English first, then Roman Urdu, then Urdu script.
  const isGot =
    lower.includes('received') ||
    lower.includes('receive') ||
    lower.includes('collected') ||
    lower.includes('payment') ||
    lower.includes('paid me') ||
    lower.includes('got') ||
    lower.includes('mile') ||
    lower.includes('wasool') ||
    lower.includes('jama') ||
    lower.includes('aaye') ||
    inputStr.includes('وصول') ||
    inputStr.includes('جمع');

  const type: 'gave' | 'got' = isGot ? 'got' : 'gave';

  const numMatch = inputStr.match(/\d+/);
  let amount = numMatch ? parseInt(numMatch[0], 10) : 0;

  if (
    (lower.includes('thousand') || lower.includes('hazar') || lower.includes('hazaar') || lower.includes('ہزار')) &&
    amount > 0 && amount < 100
  ) {
    amount = amount * 1000;
  }

  // Pick the first token that looks like a name: alphabetic (Latin or Urdu)
  // and not a grammatical filler in either language. This handles English word
  // order ("Gave Ali 500") and Urdu word order ("Ali ko 500 diye") alike.
  const FILLERS = new Set([
    // English
    'gave', 'give', 'given', 'got', 'get', 'received', 'receive', 'collected',
    'paid', 'pay', 'payment', 'from', 'to', 'for', 'the', 'a', 'an', 'and',
    'rupees', 'rupee', 'rs', 'credit', 'cash', 'took', 'take', 'worth', 'of',
    'on', 'against', 'his', 'her', 'their', 'balance', 'i', 'me', 'my',
    // Roman Urdu
    'ko', 'se', 'ne', 'ka', 'ke', 'ki', 'maine', 'isne', 'udhaar', 'udhar',
    'rupay', 'rupaye', 'diye', 'diya', 'hue', 'hua', 'mile', 'wasool', 'jama',
  ]);

  const words = inputStr.trim().split(/\s+/);
  let partyName = 'Customer';
  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
    if (cleaned && !FILLERS.has(cleaned.toLowerCase())) {
      partyName = cleaned;
      break;
    }
  }

  return {
    intent: type === 'gave' ? 'ADD_CREDIT' : 'ADD_PAYMENT',
    customerName: partyName,
    amount: amount,
    description: type === 'gave' ? 'Credit given (voice entry)' : 'Payment received (voice entry)',
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
    console.warn('Gemini parser warning:', err);
    return null;
  }
}

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    let text = req.body?.text;

    console.log('\n🎙️ [Voice API] Received incoming request');

    if (req.file) {
      console.log(`📦 [Voice API] Audio buffer received: ${req.file.originalname} (${req.file.size} bytes, type: ${req.file.mimetype})`);
      
      if (!groqKey) {
        res.status(500).json({ error: 'GROQ_API_KEY is not configured for Whisper transcription' });
        return;
      }

      // 1. Transcribe audio using Groq Whisper API
      console.log('🚀 [Voice API] Calling Groq Whisper STT (whisper-large-v3)...');
      
      const extension = req.file.originalname.split('.').pop() || 'm4a';
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });
      
      const formData = new FormData();
      formData.append('file', audioBlob, `recording.${extension}`);
      formData.append('model', 'whisper-large-v3');
      // Bilingual hint: biases Whisper toward shop-ledger vocabulary in BOTH
      // English and Urdu/Roman Urdu, so the shopkeeper can speak either one.
      formData.append(
        'prompt',
        'BolKhata shop ledger bookkeeping. English: Gave Ali 500 rupees on credit, received 1000 from Ahmad, payment collected, outstanding balance, stock purchased, cash sale, expense. Roman Urdu: Ali ko 500 rupaye diye, Ahmad se 1000 mile, udhaar, jama, wasool, rokar, baqi, maal bheja, payment aayi. اردو: علی کو پانچ سو روپے ادھار دیے، احمد سے ہزار روپے وصول ہوئے۔'
      );

      const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`
        },
        body: formData as any
      });

      if (!whisperResponse.ok) {
        const errBody = await whisperResponse.text();
        console.error('❌ Groq Whisper STT error:', errBody);
        res.status(500).json({ error: 'Whisper STT failed: ' + errBody });
        return;
      }

      const whisperData = (await whisperResponse.json()) as any;
      text = whisperData.text;
      console.log(`✨ [Voice API] Whisper transcribed live speech: "${text}"`);
    } else if (text) {
      console.log(`📝 [Voice API] Text command received: "${text}"`);
    } else {
      res.status(400).json({ error: 'No audio file or text received.' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Audio was silent or no speech detected.' });
      return;
    }

    // 2. Parse text with Gemini 3.6 Flash / Groq LLM
    const systemPrompt = `You are an expert multilingual ledger and bookkeeping AI for a digital khata app called "BolKhata" used by shopkeepers in Pakistan and India.

INPUT: The spoken transcript may be in English, Urdu (Urdu script or Roman Urdu), or Hindi. Understand all of them equally well and detect the language automatically.

OUTPUT: Always respond in ENGLISH, regardless of the input language. The app's interface is English-only.
- "customerName": transliterate names into Latin script (e.g. "علی" -> "Ali", "احمد" -> "Ahmad"). Never return Urdu or Devanagari script.
- "description": a short English summary of the item or reason (e.g. "5 bags of rice", "part payment", "monthly ration credit"). Never return Urdu or Devanagari script.
- "amount": a plain number. Resolve spoken numbers in any language ("paanch sau" / "پانچ سو" / "five hundred" -> 500, "hazaar" / "ہزار" / "thousand" -> 1000).

Use "gave" / ADD_CREDIT when the shopkeeper handed over money or goods on credit (udhaar diya).
Use "got" / ADD_PAYMENT when the shopkeeper received money (jama / wasool hua).

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

    // Fallback if LLM parsing not reached
    if (!parsedData) {
      parsedData = parseFallbackLocally(text);
    }

    console.log(`🧠 [Voice API] Parsed result: Customer="${parsedData.customerName}", Amount=${parsedData.amount}, Type=${parsedData.type}`);

    // 3. Generate natural voice feedback using Alibaba Qwen TTS (English —
    // the app UI is English, so the spoken confirmation matches it).
    const actionText = parsedData.type === 'gave'
      ? `was given ${parsedData.amount} rupees on credit`
      : `paid ${parsedData.amount} rupees`;
    const speechText = `${parsedData.customerName} ${actionText}. Press confirm to save this entry to the ledger.`;
    
    const audioBase64 = await generateTTS(speechText);

    res.json({
      ...parsedData,
      audioBase64,
      originalText: text
    });
  } catch (error) { 
    console.error('Error in processVoice:', error);
    next(error); 
  }
};
