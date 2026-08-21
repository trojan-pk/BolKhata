"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoice = void 0;
// Helper to call Alibaba DashScope Qwen TTS Flash
async function generateTTS(text) {
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;
    if (!apiKey)
        return null;
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
        if (!response.ok)
            return null;
        const data = (await response.json());
        if (data.code)
            return null;
        const audioUrl = data.output?.audio?.url;
        if (!audioUrl)
            return null;
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok)
            return null;
        const arrayBuffer = await audioResponse.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
    }
    catch (error) {
        return null;
    }
}
// Urdu & Roman Urdu word-number dictionary
function extractAmountFromUrduText(str) {
    const numMatch = str.match(/\d+/);
    if (numMatch) {
        let amt = parseInt(numMatch[0], 10);
        if ((str.includes('ہزار') || str.toLowerCase().includes('hazar') || str.toLowerCase().includes('thousand')) && amt < 1000) {
            amt = amt * 1000;
        }
        return amt;
    }
    // Word mappings
    const wordMap = {
        'ایک': 1, 'do': 2, 'دو': 2, 'teen': 3, 'تین': 3, 'char': 4, 'چار': 4,
        'paanch': 5, 'panch': 5, 'پانچ': 5, 'chhe': 6, 'چھ': 6, 'saat': 7, 'سات': 7,
        'aath': 8, 'آٹھ': 8, 'nau': 9, 'نو': 9, 'das': 10, 'دس': 10,
        'bees': 20, 'بیس': 20, 'tees': 30, 'تیس': 30, 'chalees': 40, 'چالیس': 40,
        'pachas': 50, 'پچاس': 50, 'sau': 100, 'سو': 100,
        'hazar': 1000, 'hazaar': 1000, 'ہزار': 1000,
        'laakh': 100000, 'lakh': 100000, 'لاکھ': 100000
    };
    const lower = str.toLowerCase();
    let total = 0;
    let currentMultiplier = 1;
    if (str.includes('پانچ ہزار') || lower.includes('paanch hazar') || lower.includes('panch hazar'))
        return 5000;
    if (str.includes('دس ہزار') || lower.includes('das hazar'))
        return 10000;
    if (str.includes('دو ہزار') || lower.includes('do hazar'))
        return 2000;
    if (str.includes('تین ہزار') || lower.includes('teen hazar'))
        return 3000;
    if (str.includes('چار ہزار') || lower.includes('char hazar'))
        return 4000;
    if (str.includes('ایک ہزار') || lower.includes('ek hazar') || str.includes('ہزار') || lower.includes('hazar'))
        return 1000;
    if (str.includes('پانچ سو') || lower.includes('paanch sau') || lower.includes('5 sau'))
        return 500;
    if (str.includes('دو سو') || lower.includes('do sau'))
        return 200;
    if (str.includes('تین سو') || lower.includes('teen sau'))
        return 300;
    if (str.includes('سو') || lower.includes('sau'))
        return 100;
    return 0;
}
// Fallback rule parser
function parseFallbackLocally(inputStr) {
    const lower = inputStr.toLowerCase();
    const isGot = lower.includes('received') ||
        lower.includes('receive') ||
        lower.includes('collected') ||
        lower.includes('payment') ||
        lower.includes('paid me') ||
        lower.includes('got') ||
        lower.includes('mile') ||
        lower.includes('wasool') ||
        lower.includes('jama') ||
        lower.includes('aaye') ||
        lower.includes('liye') ||
        inputStr.includes('لیے') ||
        inputStr.includes('وصول') ||
        inputStr.includes('ملے') ||
        inputStr.includes('جمع');
    const type = isGot ? 'got' : 'gave';
    const amount = extractAmountFromUrduText(inputStr);
    const FILLERS = new Set([
        'gave', 'give', 'got', 'received', 'from', 'to', 'for', 'the', 'a', 'and', 'rupees', 'rs', 'credit', 'cash',
        'ko', 'se', 'ne', 'ka', 'ke', 'ki', 'maine', 'isne', 'udhaar', 'rupay', 'rupaye', 'diye', 'diya', 'hue', 'mile', 'wasool', 'jama', 'liye', 'paanch', 'hazar'
    ]);
    const words = inputStr.trim().split(/\s+/);
    let partyName = 'Customer';
    for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
        if (cleaned && !FILLERS.has(cleaned.toLowerCase()) && !['پانچ', 'ہزار', 'روپے', 'لیے', 'دیے', 'سے', 'کو'].includes(cleaned)) {
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
// Helper to parse bookkeeping intent using Google Gemini 2.5 Flash / 2.0 Flash / 1.5 Flash
async function parseWithGemini(text, systemPrompt) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey)
        return null;
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of models) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nSpoken Text: "${text}"\n\nReturn JSON ONLY:` }] }
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.1
                    }
                })
            });
            if (res.ok) {
                const data = (await res.json());
                const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawContent) {
                    return JSON.parse(rawContent);
                }
            }
        }
        catch (err) {
            // try next model
        }
    }
    return null;
}
const processVoice = async (req, res, next) => {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let text = req.body?.text;
        console.log('\n🎙️ [Voice API] Received incoming request');
        if (req.file) {
            console.log(`📦 [Voice API] Audio file received: ${req.file.originalname} (${req.file.size} bytes)`);
            if (!groqKey) {
                res.status(500).json({ error: 'GROQ_API_KEY is not configured in backend/.env' });
                return;
            }
            // 1. Transcribe audio using Groq Whisper API
            console.log('🚀 [Voice API] Calling Groq Whisper STT (whisper-large-v3)...');
            const extension = req.file.originalname.split('.').pop() || 'm4a';
            const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });
            const formData = new FormData();
            formData.append('file', audioBlob, `recording.${extension}`);
            formData.append('model', 'whisper-large-v3');
            formData.append('prompt', 'BolKhata dukandari hisaab: Ali ko 500 diye, Papa se 5000 liye, Ahmad se 1000 wasool hue, udhaar, jama, wasool. علی کو پانچ سو روپے دیے، پاپا سے پانچ ہزار روپے وصول کیے۔');
            const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`
                },
                body: formData
            });
            if (!whisperResponse.ok) {
                const errBody = await whisperResponse.text();
                console.error('❌ Groq Whisper STT error:', errBody);
                res.status(500).json({ error: 'Whisper STT failed: ' + errBody });
                return;
            }
            const whisperData = (await whisperResponse.json());
            text = whisperData.text;
            console.log(`✨ [Voice API] Whisper Transcribed: "${text}"`);
        }
        else if (text) {
            console.log(`📝 [Voice API] Text command received: "${text}"`);
        }
        else {
            res.status(400).json({ error: 'No audio file or text received.' });
            return;
        }
        if (!text || !text.trim()) {
            res.status(400).json({ error: 'Audio was silent or no speech detected.' });
            return;
        }
        // 2. Parse text with Gemini / Groq LLM
        const systemPrompt = `You are an expert multilingual ledger AI for "BolKhata" store ledger app.
Extract transaction details from spoken voice transcripts in Urdu (Urdu script or Roman Urdu), Hindi, or English.

IMPORTANT NUMBER WORDS RULES:
- "پانچ ہزار" / "paanch hazar" = 5000
- "ہزار" / "hazar" = 1000
- "دس ہزار" / "das hazar" = 10000
- "پانچ سو" / "500" = 500
- "لیے" / "wasool" / "mile" / "jama" / "received" = type: "got", intent: "ADD_PAYMENT"
- "دیے" / "udhaar" / "gave" = type: "gave", intent: "ADD_CREDIT"

Respond ONLY with valid JSON:
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
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: text }
                        ],
                        response_format: { type: 'json_object' }
                    })
                });
                if (llmResponse.ok) {
                    const llmData = (await llmResponse.json());
                    parsedData = JSON.parse(llmData.choices[0].message.content);
                }
            }
            catch (llmErr) {
                console.warn('Groq LLM parser error:', llmErr);
            }
        }
        // Fallback if LLM parsing not reached
        if (!parsedData || !parsedData.amount) {
            const fallback = parseFallbackLocally(text);
            if (!parsedData) {
                parsedData = fallback;
            }
            else if (!parsedData.amount && fallback.amount) {
                parsedData.amount = fallback.amount;
            }
        }
        console.log(`🧠 [Voice API] Parsed Result: Customer="${parsedData.customerName}", Amount=${parsedData.amount}, Type=${parsedData.type}`);
        // 3. Generate natural voice feedback using Alibaba Qwen TTS
        const actionText = parsedData.type === 'gave' ? 'udhaar diye gaye hain' : 'jama wasool hue hain';
        const speechText = `${parsedData.customerName} ke ${parsedData.amount} rupaye ${actionText}. Khata save karne ke liye confirm dabayein.`;
        const audioBase64 = await generateTTS(speechText);
        if (audioBase64) {
            console.log('🔊 [Voice API] Audio feedback voice note generated successfully.');
        }
        res.json({
            ...parsedData,
            audioBase64,
            originalText: text
        });
    }
    catch (error) {
        console.error('Error in processVoice:', error);
        next(error);
    }
};
exports.processVoice = processVoice;
