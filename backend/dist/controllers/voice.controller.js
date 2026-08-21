"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoice = void 0;
// Urdu & Roman Urdu word-number extractor
function extractAmountFromUrduText(str) {
    const numMatch = str.match(/\d+/);
    if (numMatch) {
        let amt = parseInt(numMatch[0], 10);
        if ((str.includes('ہزار') || str.toLowerCase().includes('hazar') || str.toLowerCase().includes('thousand')) && amt < 1000) {
            amt = amt * 1000;
        }
        return amt;
    }
    const lower = str.toLowerCase();
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
    if (str.includes('چار سو') || lower.includes('char sau') || lower.includes('4 sau'))
        return 400;
    if (str.includes('تین سو') || lower.includes('teen sau') || lower.includes('3 sau'))
        return 300;
    if (str.includes('دو سو') || lower.includes('do sau'))
        return 200;
    if (str.includes('ایک سو') || lower.includes('ek sau') || str.includes('سو') || lower.includes('sau'))
        return 100;
    return 0;
}
// Helper to calculate relative date (e.g. kal -> yesterday)
function resolveRelativeDate(text, baseDateStr) {
    const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
    const lower = text.toLowerCase();
    if (lower.includes('parson') || text.includes('پرسوں')) {
        baseDate.setDate(baseDate.getDate() - 2);
    }
    else if (lower.includes('kal') || text.includes('کل') || lower.includes('yesterday')) {
        baseDate.setDate(baseDate.getDate() - 1);
    }
    else if (lower.includes('pichlay haftay') || lower.includes('last week')) {
        baseDate.setDate(baseDate.getDate() - 7);
    }
    return baseDate.toISOString().split('T')[0];
}
// Helper to TitleCase English names
function toTitleCase(str) {
    if (!str)
        return 'Customer';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
// Fallback Rule Parser
function parseFallbackLocally(inputStr, existingPeople = [], currentDate) {
    const lower = inputStr.toLowerCase();
    const isBalanceQuery = lower.includes('hisaab batao') ||
        lower.includes('hisab batao') ||
        lower.includes('balance batao') ||
        lower.includes('kitne lene') ||
        lower.includes('kitne dene') ||
        inputStr.includes('حساب') ||
        inputStr.includes('بیلنس');
    if (isBalanceQuery) {
        let queryPerson = 'Customer';
        for (const p of existingPeople) {
            if (lower.includes(p.name.toLowerCase()) || inputStr.includes(p.name)) {
                queryPerson = p.name;
                break;
            }
        }
        return {
            intent: 'get_balance',
            person: { name: queryPerson },
            confidence: 0.9,
        };
    }
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
        lower.includes('wapis kiye') ||
        inputStr.includes('لیے') ||
        inputStr.includes('وصول') ||
        inputStr.includes('ملے') ||
        inputStr.includes('جمع');
    const direction = isGot ? 'got' : 'gave';
    const amount = extractAmountFromUrduText(inputStr);
    const FILLERS = new Set([
        'gave', 'give', 'got', 'received', 'from', 'to', 'for', 'the', 'a', 'and', 'rupees', 'rs', 'credit', 'cash',
        'ko', 'se', 'ne', 'ka', 'ke', 'ki', 'maine', 'isne', 'udhaar', 'rupay', 'rupaye', 'diye', 'diya', 'hue', 'mile', 'wasool', 'jama', 'liye', 'paanch', 'hazar', 'char', 'sau', 'wapis', 'kiye', 'thay', 'tha'
    ]);
    const words = inputStr.trim().split(/\s+/);
    let partyName = 'Customer';
    for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
        if (cleaned && !FILLERS.has(cleaned.toLowerCase()) && !['پانچ', 'چار', 'ہزار', 'سو', 'روپے', 'لیے', 'دیے', 'سے', 'کو', 'نے'].includes(cleaned)) {
            partyName = cleaned;
            break;
        }
    }
    let reason = null;
    if (lower.includes('tube') || inputStr.includes('ٹیوب')) {
        reason = 'bike tube replacement';
    }
    else if (lower.includes('mobile balance') || lower.includes('balance dalwana')) {
        reason = 'mobile balance';
    }
    else if (lower.includes('bike repair') || lower.includes('petrol') || inputStr.includes('بائیک')) {
        reason = 'bike repair';
    }
    else if (lower.includes('rashan') || lower.includes('grocery') || lower.includes('ration')) {
        reason = 'groceries';
    }
    const missingFields = [];
    if (amount <= 0)
        missingFields.push('amount');
    // Match existing people for name consistency
    const matchingCandidates = existingPeople.filter((p) => p.name.toLowerCase().includes(partyName.toLowerCase()) ||
        partyName.toLowerCase().includes(p.name.toLowerCase()));
    const isAmbiguous = matchingCandidates.length > 1;
    const resolvedName = isAmbiguous ? partyName : (matchingCandidates[0]?.name || toTitleCase(partyName));
    return {
        intent: 'create_transaction',
        person: {
            name: resolvedName,
            matched_person_id: matchingCandidates.length === 1 ? matchingCandidates[0].id : null,
        },
        transaction: {
            direction,
            amount,
            currency: 'PKR',
            reason,
            date: resolveRelativeDate(inputStr, currentDate),
            payment_method: null,
        },
        ambiguous: isAmbiguous,
        candidates: isAmbiguous ? matchingCandidates : [],
        missing_fields: missingFields,
        confidence: amount > 0 ? 0.95 : 0.7,
    };
}
// Google Gemini 3.6 Flash / 2.5 Flash Intent & Entity Parser
async function parseWithGemini(text, systemPrompt) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey)
        return null;
    const models = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    for (const model of models) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nSpoken Text to parse: "${text}"\n\nJSON Output:` }] }
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
        let existingPeople = [];
        try {
            if (req.body?.people) {
                existingPeople = typeof req.body.people === 'string' ? JSON.parse(req.body.people) : req.body.people;
            }
        }
        catch (e) { }
        const currentDate = req.body?.current_date || new Date().toISOString().split('T')[0];
        const timezone = req.body?.timezone || 'Asia/Karachi';
        console.log('\n🎙️ [Voice API] Received incoming request');
        if (req.file) {
            console.log(`📦 [Voice API] Audio buffer received: ${req.file.originalname} (${req.file.size} bytes)`);
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
            formData.append('prompt', 'BolKhata hisaab: Zain ko 2000 diye bike tube ke liye, Ali ko 400 diye mobile balance, Papa se 5000 liye, Hamza ne 2000 wapis kiye, Qasim ko 1200 diye, bike repair, rashan, udhaar, jama. زین کو دو ہزار روپے دیے، بائیک کی ٹیوب ڈلوانے کے لیے۔');
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
        // Silence detection
        const cleanedText = (text || '').replace(/[.\s,?!۔]/g, '').trim();
        if (!cleanedText || cleanedText.length < 2) {
            console.log('⚠️ [Voice API] Silence / No speech detected.');
            res.status(400).json({ error: 'No speech detected. Please speak clearly into your mic.' });
            return;
        }
        // 2. Clear System Prompt with Strict Transliteration & Extraction Rules
        const systemPrompt = `You are BolKhata's expert financial command parser.
Convert natural-language spoken text (Urdu script, Roman Urdu, Hindi, English) into structured bookkeeping JSON.

CONTEXT:
- Today's Date: "${currentDate}" (Timezone: ${timezone})
- Existing Store Customers: ${JSON.stringify(existingPeople)}

CRITICAL EXTRACTION & TRANSLITERATION RULES:
1. PERSON NAME:
   - ALWAYS output "person.name" in English / Roman Latin script (e.g. "زین" -> "Zain", "علی" -> "Ali", "قاسم" -> "Qasim", "پاپا" -> "Papa", "حمزہ" -> "Hamza", "احمد" -> "Ahmad").
   - NEVER output Arabic/Urdu script for "person.name".
   - If the name matches someone in Existing Store Customers, use their exact English name and set "matched_person_id".
   - If multiple people in the store match (e.g. "Ali Khan" and "Ali Electronics"), set "ambiguous": true and list candidates in "candidates".

2. TRANSACTION DETAILS:
   - "direction": "gave" (if gave/udhaar/diye/paid) or "got" (if received/wasool/liye/mile/wapis kiye).
   - "amount": numeric value in PKR (e.g., 2000).
   - "reason": Extract the reason or item description in English or Roman Urdu (e.g. "bike tube replacement", "mobile balance", "bike repair", "chai", "groceries").
   - "date": YYYY-MM-DD.

3. NUMBER WORDS:
   - "دو ہزار" / "do hazar" / "2000" = 2000
   - "پانچ ہزار" / "paanch hazar" = 5000
   - "چار سو" / "char sau" = 400
   - "پانچ سو" / "paanch sau" = 500

RETURN JSON ONLY MATCHING THIS SCHEMA:
{
  "intent": "create_transaction" | "get_balance" | "get_history",
  "person": {
    "name": "string (English / Roman Latin TitleCase)",
    "matched_person_id": "string or null"
  },
  "transaction": {
    "direction": "gave" | "got",
    "amount": number,
    "currency": "PKR",
    "reason": "string or null",
    "date": "YYYY-MM-DD",
    "payment_method": "string or null"
  },
  "ambiguous": boolean,
  "candidates": [ { "id": "string", "name": "string" } ],
  "missing_fields": [ "amount" | "person" ],
  "confidence": number
}`;
        let parsedData = await parseWithGemini(text, systemPrompt);
        if (!parsedData) {
            parsedData = parseFallbackLocally(text, existingPeople, currentDate);
        }
        // Name Normalization: always guarantee clean English / Latin string
        let rawPersonName = parsedData.person?.name ||
            parsedData.customerName ||
            parsedData.partyName ||
            'Customer';
        if (/[\u0600-\u06FF]/.test(rawPersonName)) {
            const match = existingPeople.find((p) => p.name.toLowerCase().includes(rawPersonName.toLowerCase()) ||
                rawPersonName.includes(p.name));
            rawPersonName = match ? match.name : toTitleCase(rawPersonName);
        }
        const personName = toTitleCase(rawPersonName);
        let amount = parsedData.transaction?.amount ?? parsedData.amount ?? 0;
        if (amount <= 0) {
            amount = extractAmountFromUrduText(text);
        }
        const direction = parsedData.transaction?.direction ||
            parsedData.type ||
            (parsedData.intent === 'ADD_PAYMENT' ? 'got' : 'gave');
        const reason = parsedData.transaction?.reason ||
            parsedData.description ||
            parsedData.note ||
            '';
        const txnDate = parsedData.transaction?.date ||
            parsedData.date ||
            resolveRelativeDate(text, currentDate);
        const intent = parsedData.intent === 'get_balance' ? 'get_balance' : 'create_transaction';
        const normalizedResult = {
            intent,
            customerName: personName,
            partyName: personName,
            person: {
                name: personName,
                matched_person_id: parsedData.person?.matched_person_id || null,
            },
            amount,
            type: direction,
            direction,
            description: reason,
            note: reason,
            transaction: {
                direction,
                amount,
                currency: 'PKR',
                reason,
                date: txnDate,
                payment_method: null,
            },
            ambiguous: parsedData.ambiguous || false,
            candidates: parsedData.candidates || [],
            missing_fields: amount <= 0 ? ['amount'] : (parsedData.missing_fields || []),
            confidence: parsedData.confidence || 0.98,
            originalText: text,
        };
        console.log(`🧠 [Voice API] Intent="${intent}", Person="${personName}", Amount=${amount}, Direction="${direction}", Reason="${reason}"`);
        res.json(normalizedResult);
    }
    catch (error) {
        console.error('Error in processVoice:', error);
        next(error);
    }
};
exports.processVoice = processVoice;
