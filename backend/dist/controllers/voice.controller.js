"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoice = void 0;
// Urdu & Roman Urdu word-number extractor with Lakh & Thousand support
function extractAmountFromUrduText(str) {
    const numMatch = str.match(/\d[\d,]*/);
    if (numMatch) {
        let amt = parseInt(numMatch[0].replace(/,/g, ''), 10);
        if ((str.includes('لاکھ') || str.toLowerCase().includes('lakh') || str.toLowerCase().includes('lac')) && amt < 1000) {
            amt = amt * 100000;
        }
        else if ((str.includes('ہزار') || str.toLowerCase().includes('hazar') || str.toLowerCase().includes('thousand')) && amt < 1000) {
            amt = amt * 1000;
        }
        return amt;
    }
    const lower = str.toLowerCase();
    let total = 0;
    // Lakhs calculation
    if (str.includes('پانچ لاکھ') || lower.includes('paanch lakh') || lower.includes('5 lakh'))
        total += 500000;
    else if (str.includes('چار لاکھ') || lower.includes('char lakh') || lower.includes('4 lakh'))
        total += 400000;
    else if (str.includes('تین لاکھ') || lower.includes('teen lakh') || lower.includes('3 lakh'))
        total += 300000;
    else if (str.includes('دو لاکھ') || lower.includes('do lakh') || lower.includes('2 lakh'))
        total += 200000;
    else if (str.includes('ایک لاکھ') || lower.includes('ek lakh') || lower.includes('1 lakh') || str.includes('لاکھ') || lower.includes('lakh'))
        total += 100000;
    // Thousands calculation
    if (str.includes('نوے ہزار') || lower.includes('navway hazar'))
        total += 90000;
    else if (str.includes('اسی ہزار') || lower.includes('assi hazar'))
        total += 80000;
    else if (str.includes('ستر ہزار') || lower.includes('sattar hazar'))
        total += 70000;
    else if (str.includes('ساٹھ ہزار') || lower.includes('saath hazar'))
        total += 60000;
    else if (str.includes('پچاس ہزار') || lower.includes('pachaas hazar') || lower.includes('50 hazar'))
        total += 50000;
    else if (str.includes('چالیس ہزار') || lower.includes('chalees hazar') || lower.includes('40 hazar'))
        total += 40000;
    else if (str.includes('تیس ہزار') || lower.includes('tees hazar') || lower.includes('30 hazar'))
        total += 30000;
    else if (str.includes('بیس ہزار') || lower.includes('bees hazar') || lower.includes('20 hazar'))
        total += 20000;
    else if (str.includes('پندرہ ہزار') || lower.includes('pandrah hazar') || lower.includes('15 hazar'))
        total += 15000;
    else if (str.includes('دس ہزار') || lower.includes('das hazar') || lower.includes('10 hazar'))
        total += 10000;
    else if (str.includes('پانچ ہزار') || lower.includes('paanch hazar') || lower.includes('5 hazar'))
        total += 5000;
    else if (str.includes('چار ہزار') || lower.includes('char hazar') || lower.includes('4 hazar'))
        total += 4000;
    else if (str.includes('تین ہزار') || lower.includes('teen hazar') || lower.includes('3 hazar'))
        total += 3000;
    else if (str.includes('دو ہزار') || lower.includes('do hazar') || lower.includes('2 hazar'))
        total += 2000;
    else if (str.includes('ایک ہزار') || lower.includes('ek hazar') || (total === 0 && (str.includes('ہزار') || lower.includes('hazar'))))
        total += 1000;
    // Hundreds calculation
    if (str.includes('پانچ سو') || lower.includes('paanch sau'))
        total += 500;
    else if (str.includes('چار سو') || lower.includes('char sau'))
        total += 400;
    else if (str.includes('تین سو') || lower.includes('teen sau'))
        total += 300;
    else if (str.includes('دو سو') || lower.includes('do sau'))
        total += 200;
    else if (str.includes('ایک سو') || lower.includes('ek sau') || (total === 0 && (str.includes('سو') || lower.includes('sau'))))
        total += 100;
    return total;
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
// Fast Local Fallback Rule Parser
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
        'ko', 'se', 'ne', 'ka', 'ke', 'ki', 'maine', 'isne', 'udhaar', 'rupay', 'rupaye', 'diye', 'diya', 'hue', 'mile', 'wasool', 'jama', 'liye', 'paanch', 'hazar', 'char', 'sau', 'wapis', 'kiye', 'thay', 'tha', 'lakh', 'bees', 'tees', 'ek'
    ]);
    const words = inputStr.trim().split(/\s+/);
    let partyName = 'Customer';
    for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
        if (cleaned && !FILLERS.has(cleaned.toLowerCase()) && !['پانچ', 'چار', 'ہزار', 'سو', 'روپے', 'لیے', 'دیے', 'سے', 'کو', 'نے', 'ایک', 'لاکھ', 'بیس', 'تیس', 'پچاس'].includes(cleaned)) {
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
// Multi-tier Fast LLM Intent Parser (Groq GPT-OSS 20B / Gemini 3.6 Flash / Qwen 27B)
async function parseWithLLM(text, systemPrompt, groqKey, geminiKey) {
    // 1. Try Groq openai/gpt-oss-20b (Ultra-fast ~800ms)
    if (groqKey) {
        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Text: "${text}"` }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (groqRes.ok) {
                const d = (await groqRes.json());
                const raw = d.choices?.[0]?.message?.content;
                if (raw) {
                    return JSON.parse(raw);
                }
            }
        }
        catch (e) {
            console.warn('Groq LLM error, falling back to Gemini:', e);
        }
    }
    // 2. Try Gemini 3.6 Flash / 2.5 Flash
    if (geminiKey) {
        const models = ['gemini-3.6-flash', 'gemini-2.5-flash'];
        for (const model of models) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${systemPrompt}\n\nSpoken Text: "${text}"\n\nJSON Output:` }] }
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
                // try next
            }
        }
    }
    // 3. Try Groq qwen/qwen3.6-27b
    if (groqKey) {
        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen/qwen3.6-27b',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Text: "${text}"` }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (groqRes.ok) {
                const d = (await groqRes.json());
                const raw = d.choices?.[0]?.message?.content;
                if (raw) {
                    return JSON.parse(raw);
                }
            }
        }
        catch (e) { }
    }
    return null;
}
const processVoice = async (req, res, next) => {
    const totalStartTime = performance.now();
    let sttDurationMs = 0;
    let llmDurationMs = 0;
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
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
        console.log('\n🎙️ [Voice API] Incoming Voice Request');
        if (req.file) {
            if (!groqKey) {
                res.status(500).json({ error: 'GROQ_API_KEY is not configured in backend/.env' });
                return;
            }
            // 1. High-Speed STT: Groq whisper-large-v3-turbo
            const sttStart = performance.now();
            console.log('⚡ [Voice API] Calling Groq Whisper Turbo (whisper-large-v3-turbo)...');
            const extension = req.file.originalname.split('.').pop() || 'm4a';
            const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });
            const formData = new FormData();
            formData.append('file', audioBlob, `recording.${extension}`);
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('prompt', 'BolKhata: Zain ko 2000 diye, Hasnain se 120000 liye, Ali ko 400 diye, Papa se 50000 liye, bike repair, rashan, udhaar, jama. حسنین سے ایک لاکھ بیس ہزار روپے لیے، زین کو دو ہزار دیے');
            const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`
                },
                body: formData
            });
            sttDurationMs = Math.round(performance.now() - sttStart);
            if (!whisperResponse.ok) {
                const errBody = await whisperResponse.text();
                console.error('❌ Groq Whisper STT error:', errBody);
                res.status(500).json({ error: 'Whisper STT failed: ' + errBody });
                return;
            }
            const whisperData = (await whisperResponse.json());
            text = whisperData.text;
            console.log(`✨ [Voice API] Whisper Transcribed (${sttDurationMs}ms): "${text}"`);
        }
        else if (text) {
            console.log(`📝 [Voice API] Text command received: "${text}"`);
        }
        else {
            res.status(400).json({ error: 'No audio file or text received.' });
            return;
        }
        // Silence / Noise Filter
        const cleanedText = (text || '').replace(/[.\s,?!۔]/g, '').trim();
        if (!cleanedText || cleanedText.length < 2) {
            console.log('⚠️ [Voice API] Silence / No speech detected.');
            res.status(400).json({ error: 'No speech detected. Please speak clearly into your mic.' });
            return;
        }
        // 2. High-Performance Token-Optimized System Prompt
        const systemPrompt = `You are BolKhata's rapid financial parser.
Convert spoken text (Urdu script, Roman Urdu, Hindi, English) into JSON.

CONTEXT:
- Date: "${currentDate}" (${timezone})
- Store Customers: ${JSON.stringify(existingPeople)}

CRITICAL RULES:
1. "person.name": English / Latin script TitleCase ONLY (e.g. "حسنین"->"Hasnain", "زین"->"Zain", "علی"->"Ali", "پاپا"->"Papa", "حمزہ"->"Hamza", "بلال"->"Bilal"). NEVER Arabic/Urdu script. Match Store Customers if name matches.
2. "direction": "gave" (diye/udhaar/paid) | "got" (liye/wasool/mile/wapis kiye/jama).
3. "amount": Full numeric PKR value:
   - "ایک لاکھ بیس ہزار" / "1 lakh 20 hazar" = 120000
   - "ایک لاکھ" / "1 lakh" = 100000
   - "پچاس ہزار" / "50 hazar" = 50000
   - "تیس ہزار" / "30 hazar" = 30000
   - "دس ہزار" / "10 hazar" = 10000
   - "دو ہزار" = 2000
4. "reason": reason in English/Roman text or null.
5. "date": YYYY-MM-DD (kal = yesterday).

JSON SCHEMA ONLY:
{
  "intent": "create_transaction" | "get_balance" | "get_history",
  "person": { "name": "Hasnain", "matched_person_id": null },
  "transaction": { "direction": "got", "amount": 120000, "currency": "PKR", "reason": null, "date": "${currentDate}", "payment_method": null },
  "ambiguous": false,
  "candidates": [],
  "missing_fields": [],
  "confidence": 0.98
}`;
        const llmStart = performance.now();
        let parsedData = await parseWithLLM(text, systemPrompt, groqKey, geminiKey);
        if (!parsedData) {
            parsedData = parseFallbackLocally(text, existingPeople, currentDate);
        }
        llmDurationMs = Math.round(performance.now() - llmStart);
        // Name Normalization
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
        const totalDurationMs = Math.round(performance.now() - totalStartTime);
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
            timings: {
                sttMs: sttDurationMs,
                llmMs: llmDurationMs,
                totalMs: totalDurationMs,
            },
        };
        console.log(`⚡ [Voice API] ⏱️ STT: ${sttDurationMs}ms | LLM: ${llmDurationMs}ms | Total: ${totalDurationMs}ms`);
        console.log(`✅ [Voice API] Parsed: Intent="${intent}", Person="${personName}", Amount=${amount}, Direction="${direction}", Reason="${reason}"`);
        res.json(normalizedResult);
    }
    catch (error) {
        console.error('Error in processVoice:', error);
        next(error);
    }
};
exports.processVoice = processVoice;
