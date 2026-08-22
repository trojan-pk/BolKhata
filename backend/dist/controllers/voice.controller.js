"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = exports.processVoice = void 0;
// Comprehensive Urdu & Hindi/Devanagari to Pure Roman English Dictionary
const SCRIPT_TO_ROMAN_MAP = {
    // Devanagari / Hindi mappings
    'हमजा': 'Hamza',
    'हमज़ा': 'Hamza',
    'ज़ैन': 'Zain',
    'जैन': 'Zain',
    'मोहसिन': 'Mohsin',
    'हसनैन': 'Hasnain',
    'अली': 'Ali',
    'उस्मान': 'Usman',
    'बिलाल': 'Bilal',
    'कासिम': 'Qasim',
    'पापा': 'Papa',
    'सलमान': 'Salman',
    'कुद्दुस': 'Quddus',
    'एक लाक': '100000',
    'एक लाख': '100000',
    'दो लाख': '200000',
    'तीन लाख': '300000',
    'चार लाख': '400000',
    'पांच लाख': '500000',
    'दस हजार': '10000',
    'बीस हजार': '20000',
    'तीस हजार': '30000',
    'पचास हजार': '50000',
    'दो हजार': '2000',
    'एक हजार': '1000',
    'रुपये': 'rupay',
    'रुपए': 'rupay',
    'रुpay': 'rupay',
    'रु': 'rupay',
    'पे': 'pay',
    'दिये': 'diye',
    'दिए': 'diye',
    'दिया': 'diya',
    'लिये': 'liye',
    'लिए': 'liye',
    'लिया': 'liya',
    'खाना': 'khana',
    'खाने': 'khane',
    'को': 'ko',
    'से': 'se',
    'ने': 'ne',
    'का': 'ka',
    'की': 'ki',
    'के': 'ke',
    'के लिये': 'ke liye',
    'के लिए': 'ke liye',
    'वापस': 'wapis',
    'उधार': 'udhaar',
    'हिसाब': 'hisaab',
    'दस लाख': '1000000',
    'ایک لاکھ': '100000',
    'دو لاکھ': '200000',
    'تین لاکھ': '300000',
    'چار لاکھ': '400000',
    'پانچ لاکھ': '500000',
    'نوے ہزار': '90000',
    'اسی ہزار': '80000',
    'ستر ہزار': '70000',
    'ساٹھ ہزار': '60000',
    'پچاس ہزار': '50000',
    'چالیس ہزار': '40000',
    'تیس ہزار': '30000',
    'بیس ہزار': '20000',
    'پندرہ ہزار': '15000',
    'دس ہزار': '10000',
    'پانچ ہزار': '5000',
    'چار ہزار': '4000',
    'تین ہزار': '3000',
    'دو ہزار': '2000',
    'ایک ہزار': '1000',
    'پانچ سو': '500',
    'چار سو': '400',
    'تین سو': '300',
    'دو سو': '200',
    'ایک سو': '100',
    'لاکھ': 'lakh',
    'ہزار': 'hazar',
    'سو': 'sau',
    // Urdu Verbs & Nouns
    'روپے': 'rupay',
    'روپیہ': 'rupay',
    'روپئے': 'rupay',
    'رuqay': 'rupay',
    'ruqay': 'rupay',
    'دیے': 'diye',
    'دیئے': 'diye',
    'دیا': 'diya',
    'لیے': 'liye',
    'لئے': 'liye',
    'لیئے': 'liye',
    'لیا': 'liya',
    'کو': 'ko',
    'سے': 'se',
    'نے': 'ne',
    'کا': 'ka',
    'کی': 'ki',
    'کے': 'ke',
    'کے لیے': 'ke liye',
    'کےلئے': 'ke liye',
    'کےلئیے': 'ke liye',
    'واپس کیے': 'wapis kiye',
    'واپس': 'wapis',
    'وصول': 'wasool',
    'جمع': 'jama',
    'ادھار': 'udhaar',
    'حساب': 'hisaab',
    'بیلنس': 'balance',
    'زین': 'Zain',
    'محسن': 'Mohsin',
    'حسنین': 'Hasnain',
    'حسین': 'Hussain',
    'علی': 'Ali',
    'حمزہ': 'Hamza',
    'بلال': 'Bilal',
    'عثمان': 'Usman',
    'قاسم': 'Qasim',
    'طارق': 'Tariq',
    'پاپا': 'Papa',
    'سلوان': 'Salman',
    'سلمان': 'Salman',
    'قدوس': 'Quddus',
    'عیاشیوں': 'ayyashiyon',
    'عیاشی': 'ayyashi',
    'بائیک': 'bike',
    'ٹیوب': 'tube',
    'موبائل': 'mobile',
    'ایپ': 'app',
    'بناne': 'banane',
    'بنانے': 'banane',
    'کھانا': 'khana',
    'کھانے': 'khanay',
    'چائے': 'chai',
    'پٹرول': 'petrol',
    'راشن': 'rashan',
};
// Fast script transliterator
function transliterateToRoman(text) {
    let res = text;
    for (const [scriptWord, roman] of Object.entries(SCRIPT_TO_ROMAN_MAP)) {
        res = res.split(scriptWord).join(roman);
    }
    return res.replace(/\s+/g, ' ').trim();
}
// Standard Pakistani Name dictionary for phonetic mapping
const COMMON_PAKISTANI_NAMES_MAP = {
    mohsen: 'Mohsin',
    mohsin: 'Mohsin',
    hasnain: 'Hasnain',
    husnain: 'Hasnain',
    hasnan: 'Hasnain',
    usmaan: 'Usman',
    osman: 'Usman',
    usman: 'Usman',
    hussain: 'Hussain',
    husain: 'Hussain',
    rehman: 'Rehman',
    rahman: 'Rehman',
    rehmaan: 'Rehman',
    rizwan: 'Rizwan',
    rizwaan: 'Rizwan',
    faizan: 'Faizan',
    faizaan: 'Faizan',
    kamran: 'Kamran',
    kamraan: 'Kamran',
    farhan: 'Farhan',
    farhaan: 'Farhan',
    tariq: 'Tariq',
    tarique: 'Tariq',
    tarik: 'Tariq',
    shoaib: 'Shoaib',
    shuayb: 'Shoaib',
    noman: 'Noman',
    nouman: 'Noman',
    sufyan: 'Sufyan',
    sufiaan: 'Sufyan',
    adnan: 'Adnan',
    adnaan: 'Adnan',
    bilal: 'Bilal',
    bilaal: 'Bilal',
    hamza: 'Hamza',
    zain: 'Zain',
    zayn: 'Zain',
    qasim: 'Qasim',
    qaasim: 'Qasim',
    qudus: 'Quddus',
    quddus: 'Quddus',
    salman: 'Salman',
};
// Fast Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
    const an = a.length;
    const bn = b.length;
    if (an === 0)
        return bn;
    if (bn === 0)
        return an;
    const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
    for (let j = 0; j <= an; j++)
        matrix[0][j] = j;
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[bn][an];
}
// Extract exact numeric amount
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
    if (lower.includes('dhai hazar') || lower.includes('dhaye hazar'))
        total += 2500;
    else if (lower.includes('derh hazar') || lower.includes('dedh hazar'))
        total += 1500;
    else if (lower.includes('sawa lakh'))
        total += 125000;
    else if (lower.includes('dhai lakh'))
        total += 250000;
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
// Precise Direction Semantics Resolver
function extractDirection(text) {
    const lower = text.toLowerCase();
    if (lower.includes('gave me') || lower.includes('paid me') || lower.includes('sent me') || lower.includes('wapis kiye')) {
        return 'got';
    }
    if (lower.includes('i gave') || lower.includes('paid to') || lower.includes('sent to')) {
        return 'gave';
    }
    if (/\bne\s+diye\b/i.test(lower) || /\bne\s+diya\b/i.test(lower)) {
        return 'got';
    }
    if (/\bko\s+diye\b/i.test(lower) || /\bko\s+diya\b/i.test(lower) || /\bko\s+udhaar\b/i.test(lower) || /\bko\s+\d+/i.test(lower)) {
        return 'gave';
    }
    if (/\bse\s+(liye|liya|liyay|pay\s+liye)\b/i.test(lower) || /\bse\s+\d+/i.test(lower)) {
        return 'got';
    }
    if (lower.includes('liye') ||
        lower.includes('liyay') ||
        lower.includes('liya') ||
        lower.includes('wasool') ||
        lower.includes('jama') ||
        lower.includes('mile') ||
        lower.includes('mila') ||
        lower.includes('received') ||
        lower.includes('aaye')) {
        return 'got';
    }
    return 'gave';
}
// Name Extractor from Spoken Text
function extractPersonFromText(text, existingPeople = []) {
    const lower = text.toLowerCase();
    for (const p of existingPeople) {
        if (new RegExp(`\\b${p.name.toLowerCase()}\\b`, 'i').test(lower)) {
            return { name: p.name, matchedId: p.id };
        }
    }
    const markerMatch = text.match(/([a-zA-Z\u0600-\u06FF]+)\s+(ko|se|ne)\b/i);
    if (markerMatch && markerMatch[1]) {
        const rawCandidate = markerMatch[1].trim();
        if (!['pakistan', 'zindabad', 'rupay', 'hazar', 'lakh', 'sau', '5000', '10000', '2000', '100000', '400'].includes(rawCandidate.toLowerCase())) {
            return normalizePersonName(rawCandidate, existingPeople);
        }
    }
    const FILLERS = new Set([
        'gave', 'give', 'got', 'received', 'from', 'to', 'for', 'the', 'a', 'and', 'rupees', 'rs', 'credit', 'cash',
        'ko', 'se', 'ne', 'ka', 'ke', 'ki', 'maine', 'isne', 'unhone', 'udhaar', 'rupay', 'rupaye', 'diye', 'diya', 'hue', 'mile', 'wasool', 'jama', 'liye', 'liyay', 'paanch', 'hazar', 'char', 'sau', 'wapis', 'kiye', 'thay', 'tha', 'lakh', 'bees', 'tees', 'ek', 'jahan', 'pakistan', 'zindabad', 'lekin', 'phir', 'bhi'
    ]);
    const words = text.trim().split(/\s+/);
    for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z]/g, '');
        if (cleaned && !FILLERS.has(cleaned.toLowerCase()) && isNaN(Number(cleaned)) && cleaned.length >= 3) {
            return normalizePersonName(cleaned, existingPeople);
        }
    }
    return { name: 'Customer', matchedId: null };
}
// Reason Extractor from Spoken Text
function extractReasonFromText(text, personName) {
    let cleaned = text;
    cleaned = cleaned
        .replace(new RegExp(`\\b${personName}\\b`, 'gi'), '')
        .replace(/\b(ko|se|ne|ka|ki|ke|maine|isne|unhone)\b/gi, '')
        .replace(/\b\d+[\d,]*(-pay|-rupay)?\b/gi, '')
        .replace(/\b(lakh|hazar|sau|thousand|rupay|rupaye|rs|pkr|pay)\b/gi, '')
        .replace(/\b(diye|diya|diye thay|diya tha|liye|liyay|liya|liye thay|liya tha|wasool|jama|mile|mila|wapis kiye)\b/gi, '')
        .replace(/[-_,.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    cleaned = cleaned
        .replace(/^(ke\s*liye|keliye|for)\s*/i, '')
        .replace(/\s*(ke\s*liye|keliye|for)$/i, '')
        .trim();
    return cleaned.length >= 3 ? cleaned : '';
}
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
function toTitleCase(str) {
    if (!str)
        return 'Customer';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function normalizePersonName(rawName, existingPeople = []) {
    const cleanRaw = rawName.trim().replace(/^(jahan|maine|isne|unhone|ne|se|ko)\s+/i, '').replace(/[^a-zA-Z0-9\s]/g, '');
    const nameParts = cleanRaw.split(/\s+/);
    const singleName = nameParts[0] || 'Customer';
    const lower = singleName.toLowerCase();
    const exactMatch = existingPeople.find((p) => p.name.toLowerCase() === lower);
    if (exactMatch) {
        return { name: exactMatch.name, matchedId: exactMatch.id };
    }
    let bestFuzzyMatch = null;
    for (const p of existingPeople) {
        const dist = levenshteinDistance(lower, p.name.toLowerCase());
        if (dist <= 2) {
            if (!bestFuzzyMatch || dist < bestFuzzyMatch.dist) {
                bestFuzzyMatch = { id: p.id, name: p.name, dist };
            }
        }
    }
    if (bestFuzzyMatch) {
        return { name: bestFuzzyMatch.name, matchedId: bestFuzzyMatch.id };
    }
    if (COMMON_PAKISTANI_NAMES_MAP[lower]) {
        const stdName = COMMON_PAKISTANI_NAMES_MAP[lower];
        const stdMatch = existingPeople.find((p) => p.name.toLowerCase() === stdName.toLowerCase());
        return { name: stdName, matchedId: stdMatch ? stdMatch.id : null };
    }
    return { name: toTitleCase(singleName), matchedId: null };
}
// Fast Local Ground-Truth Deterministic Parser
function parseLocally(inputStr, existingPeople = [], currentDate) {
    const romanized = transliterateToRoman(inputStr);
    const lower = romanized.toLowerCase();
    const isBalanceQuery = lower.includes('hisaab batao') ||
        lower.includes('hisab batao') ||
        lower.includes('balance batao') ||
        lower.includes('kitne lene') ||
        lower.includes('kitne dene');
    if (isBalanceQuery) {
        let queryPerson = 'Customer';
        for (const p of existingPeople) {
            if (lower.includes(p.name.toLowerCase())) {
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
    const direction = extractDirection(romanized);
    const amount = extractAmountFromUrduText(romanized);
    const normalizedPerson = extractPersonFromText(romanized, existingPeople);
    const reason = extractReasonFromText(romanized, normalizedPerson.name);
    return {
        intent: 'create_transaction',
        person: {
            name: normalizedPerson.name,
            matched_person_id: normalizedPerson.matchedId,
        },
        transaction: {
            direction,
            amount,
            currency: 'PKR',
            reason: reason || null,
            date: resolveRelativeDate(romanized, currentDate),
            payment_method: null,
        },
        ambiguous: false,
        candidates: [],
        missing_fields: amount <= 0 ? ['amount'] : [],
        confidence: amount > 0 ? 0.98 : 0.7,
    };
}
// Multi-tier Ultra-Fast LLM Intent Parser with Anti-Hallucination Guard
async function parseWithLLM(text, systemPrompt, groqKey) {
    if (groqKey) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'allam-2-7b',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Text: "${text}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.0,
                    max_tokens: 120
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
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
            const sttStart = performance.now();
            console.log('⚡ [Voice API] Calling Groq Whisper Turbo (Roman Urdu & Store Context Conditioning)...');
            const extension = req.file.originalname.split('.').pop() || 'm4a';
            const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });
            const storeNamesHint = existingPeople.map((p) => p.name).slice(0, 10).join(', ');
            const promptText = `Hamza, Mohsin, Zain, Ali, Usman, Bilal, Qasim, Papa, Salman, Quddus, Tariq. ${storeNamesHint ? 'Customers: ' + storeNamesHint + '.' : ''} Roman Urdu English: Hamza ko 1 lakh rupay diye, Mohsin se 2000 liye, Papa se 5000 liye, Ali ko 400 diye, diye, liye, udhaar, wasool, jama, rupay.`;
            const formData = new FormData();
            formData.append('file', audioBlob, `recording.${extension}`);
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('prompt', promptText);
            formData.append('language', 'en'); // Enforce Latin / English / Roman alphabet output
            formData.append('temperature', '0');
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
            const rawWhisperText = whisperData.text || '';
            // Instant Transliteration from any mixed Script to 100% Roman Urdu
            text = transliterateToRoman(rawWhisperText);
            console.log(`✨ [Voice API] Whisper Transcribed (${sttDurationMs}ms): "${text}"`);
        }
        else if (text) {
            text = transliterateToRoman(text);
            console.log(`📝 [Voice API] Text command received: "${text}"`);
        }
        else {
            res.status(400).json({ error: 'No audio file or text received.' });
            return;
        }
        const cleanedText = (text || '').replace(/[.\s,?!۔]/g, '').trim();
        if (!cleanedText || cleanedText.length < 2) {
            console.log('⚠️ [Voice API] Silence / No speech detected.');
            res.status(400).json({ error: 'No speech detected. Please speak clearly into your mic.' });
            return;
        }
        // Refined System Prompt (Exception-Ready & Zero Mockup Schema)
        const systemPrompt = `You are BolKhata's rapid ledger entity extractor.
Convert Roman Urdu / English text into strict JSON.

SCHEMA:
{"intent": "create_transaction"|"get_balance", "person": {"name": string}, "transaction": {"direction": "gave"|"got", "amount": number, "reason": string|null, "date": string}}

RULES:
1. "person.name": English Latin TitleCase name found in input text. If no person found, use "Customer".
2. "direction": "gave" (diye/udhaar/i gave) | "got" (liye/wasool/mile/wapis kiye/jama/gave me/paid me).
3. "amount": total integer PKR (1 lakh = 100000, dhai hazar = 2500, 400 = 400).
4. "reason": purpose string or null.
5. "intent": "get_balance" if asking for balance/hisaab, else "create_transaction".

JSON ONLY:`;
        const llmStart = performance.now();
        let parsedData = await parseWithLLM(text, systemPrompt, groqKey);
        const localResult = parseLocally(text, existingPeople, currentDate);
        llmDurationMs = Math.round(performance.now() - llmStart);
        let personName = parsedData?.person?.name || localResult.person.name;
        let matchedPersonId = parsedData?.person?.matched_person_id || localResult.person.matched_person_id;
        if (personName && !text.toLowerCase().includes(personName.toLowerCase()) && !existingPeople.some(p => p.name.toLowerCase() === personName.toLowerCase())) {
            personName = localResult.person.name;
            matchedPersonId = localResult.person.matched_person_id;
        }
        const normalizedPerson = normalizePersonName(personName, existingPeople);
        personName = normalizedPerson.name;
        matchedPersonId = normalizedPerson.matchedId || matchedPersonId;
        let amount = parsedData?.transaction?.amount ?? localResult.transaction?.amount ?? 0;
        if (amount <= 0) {
            amount = extractAmountFromUrduText(text);
        }
        const direction = extractDirection(text);
        let reason = parsedData?.transaction?.reason ||
            localResult.transaction?.reason ||
            '';
        if (reason && (reason.toLowerCase().includes('rupay') || reason.toLowerCase().includes('diye') || reason.toLowerCase().includes('liye'))) {
            reason = extractReasonFromText(text, personName);
        }
        const txnDate = parsedData?.transaction?.date ||
            localResult.transaction?.date ||
            resolveRelativeDate(text, currentDate);
        const intent = parsedData?.intent === 'get_balance' || text.toLowerCase().includes('hisaab') ? 'get_balance' : 'create_transaction';
        const totalDurationMs = Math.round(performance.now() - totalStartTime);
        const normalizedResult = {
            intent,
            customerName: personName,
            partyName: personName,
            person: {
                name: personName,
                matched_person_id: matchedPersonId,
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
            ambiguous: false,
            candidates: [],
            missing_fields: amount <= 0 ? ['amount'] : [],
            confidence: 0.98,
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
// ElevenLabs Natural Voice Generation Controller
const generateSpeech = async (req, res, next) => {
    try {
        const elevenKey = process.env.ELEVENLABS_API_KEY;
        const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
        if (!elevenKey) {
            res.status(400).json({ error: 'ELEVENLABS_API_KEY not configured', fallback: true });
            return;
        }
        if (!text) {
            res.status(400).json({ error: 'Text is required for TTS', fallback: true });
            return;
        }
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`, {
            method: 'POST',
            headers: {
                'xi-api-key': elevenKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });
        if (!elevenRes.ok) {
            const errText = await elevenRes.text();
            console.warn('ElevenLabs API warning:', errText);
            res.json({ error: errText, fallback: true });
            return;
        }
        const audioArrayBuffer = await elevenRes.arrayBuffer();
        const base64Audio = Buffer.from(audioArrayBuffer).toString('base64');
        res.json({ audioBase64: `data:audio/mp3;base64,${base64Audio}` });
    }
    catch (e) {
        console.error('TTS error:', e);
        res.json({ error: e?.message || 'TTS failed', fallback: true });
    }
};
exports.generateSpeech = generateSpeech;
