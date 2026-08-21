import { Request, Response, NextFunction } from 'express';

// Helper to call Alibaba DashScope Qwen TTS Flash
async function generateTTS(text: string): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;
  if (!apiKey) {
    console.warn('No DASHSCOPE_API_KEY found in .env, skipping TTS generation.');
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

    // The API returns a short-lived URL to the generated WAV
    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) {
      console.error('DashScope TTS returned no audio url:', JSON.stringify(data));
      return null;
    }

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error('Failed to download TTS audio:', audioResponse.status);
      return null;
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('Failed to generate TTS:', error);
    return null;
  }
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
    console.error('Gemini parser error, falling back to Groq:', err);
    return null;
  }
}

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    let text = req.body.text; // Support text fallback

    if (req.file) {
      if (!groqKey) {
        res.status(500).json({ error: 'GROQ_API_KEY is not configured for Whisper transcription' });
        return;
      }

      // 1. Transcribe audio using Groq Whisper
      const extension = req.file.originalname.split('.').pop() || 'webm';
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${extension}`);
      formData.append('model', 'whisper-large-v3');
      // Prompt guides Whisper to recognize Urdu & Roman Urdu terms and numericals
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
        throw new Error(`Whisper error: ${await whisperResponse.text()}`);
      }

      const whisperData = (await whisperResponse.json()) as any;
      text = whisperData.text;
    }

    if (!text) {
      res.status(400).json({ error: 'No audio file or text provided' });
      return;
    }

    // 2. Parse text with Gemini 3.6 Flash (or Groq LLaMA / Qwen as fallback)
    const systemPrompt = `You are an expert multilingual ledger and bookkeeping AI for a digital khata app called "BolKhata" used by shopkeepers in Pakistan and India.

Extract transaction details from spoken voice transcripts in Urdu (Urdu script or Roman Urdu), Hindi, or English.

Respond ONLY with a valid JSON object matching this structure:
{
  "intent": "ADD_CREDIT" | "ADD_PAYMENT",
  "customerName": "string",
  "amount": number,
  "description": "string",
  "type": "gave" | "got"
}

### CRITICAL RULES FOR "type" ("gave" vs "got"):
1. "gave" (You gave money or goods on credit / Udhaar / Debit):
   - Shopkeeper gave goods or cash to customer.
   - Keywords: "[Name] ko diya/diye", "[Name] ko udhaar", "Maine [Name] ko diye", "[Name] ke naam likho", "[Name] ko maal/rashan/cement bheja", "[Name] ke zimmey baqi", "علی کو ادھار دیے"
   - Output: "type": "gave", "intent": "ADD_CREDIT"

2. "got" (Customer paid / Jama / Payment received / Credit to account):
   - Shopkeeper received money from customer.
   - Keywords: "[Name] se mile/wasool hue/aaye", "[Name] ne دیے/jama karwaye/payment ki/hisab clear kiya", "Maine [Name] se liye/wasool kiye", "احمد سے وصول ہوئے"
   - Output: "type": "got", "intent": "ADD_PAYMENT"

### AMOUNT PARSING (Urdu & Roman Urdu words):
- Convert spoken numbers into positive numbers:
  * "hazar" / "hazaar" / "ہزار" = 1000 (e.g. "dedh hazar" = 1500, "dhai hazar" = 2500, "do hazar" = 2000, "paanch hazar" = 5000)
  * "sau" / "so" / "سو" = 100 (e.g. "paanch sau" = 500, "saat sau" = 700)
  * "lakh" / "لاکھ" = 100000

### CUSTOMER NAME:
- Cleanly extract the person's name without filler words.

### DESCRIPTION:
- If a product or note is mentioned (e.g., "cheeni", "cement", "rashan", "udhaar", "advance", "hisab"), put it here. Default to "Udhaar" for gave and "Jama / Wasooli" for got if no item is mentioned.

EXAMPLES:
- "Ali ko 500 rupay ka rashan diya" -> {"intent":"ADD_CREDIT","customerName":"Ali","amount":500,"description":"rashan","type":"gave"}
- "Babar se 1200 rupay wasool hue" -> {"intent":"ADD_PAYMENT","customerName":"Babar","amount":1200,"description":"Wasooli","type":"got"}
- "Kashif ne 2000 jama karwaye" -> {"intent":"ADD_PAYMENT","customerName":"Kashif","amount":2000,"description":"Jama","type":"got"}
- "علی کو تین سو روپے ادھار دیے" -> {"intent":"ADD_CREDIT","customerName":"علی","amount":300,"description":"ادھار","type":"gave"}`;

    let parsedData = await parseWithGemini(text, systemPrompt);

    if (!parsedData && groqKey) {
      console.log('Falling back to Groq Qwen model...');
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
    }

    if (!parsedData) {
      throw new Error('Failed to parse voice command with both Gemini and Groq.');
    }

    // 3. Generate natural Urdu voice feedback using Alibaba Qwen TTS
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
