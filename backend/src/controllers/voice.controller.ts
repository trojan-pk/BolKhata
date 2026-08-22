import { Request, Response, NextFunction } from 'express';

// Universal AI System Prompt for Ledger Intent Parsing
const SYSTEM_INSTRUCTION = `You are BolKhata's intelligent ledger parser.
Analyze spoken South Asian business ledger text (which may be in Urdu script, Roman Urdu, Hindi, or English) and extract structured transaction JSON.

Return JSON in this EXACT schema:
{
  "intent": "create_transaction" | "get_balance",
  "person": {
    "name": "Person Name in Roman English TitleCase"
  },
  "transaction": {
    "direction": "gave" | "got",
    "amount": number,
    "reason": "purpose of payment or null",
    "date": "YYYY-MM-DD"
  }
}

Guidelines:
1. Always convert any Urdu/Arabic/Hindi names to standard Pakistani Roman English TitleCase (e.g. "اسامہ" -> "Usama", "احسان" -> "Ehsan", "علی" -> "Ali", "زین" -> "Zain", "عثمان" -> "Usman", "پاپا" -> "Papa", "بلال" -> "Bilal", "حمزہ" -> "Hamza", "وقاص" -> "Waqas", "عمر" -> "Umar").
2. Calculate South Asian numerical terms accurately (1 lakh = 100000, 5 lakh = 500000, 5 hazar / پانچ ہزار = 5000, 2 hazar = 2000, dhai hazar = 2500, derh hazar = 1500, 400 = 400).
3. "direction": "gave" for giving money / udhaar / i gave / ko diye / paid to; "got" for receiving money / wasool / jama / se liye / liye / paid me / gave me / wapis kiye.
4. Extract only the genuine purpose / item into "reason" (e.g. "electronic ka samaan buy karne", "cycle repair", "khana"). Do not include the person's name, currency or amounts in the reason.
5. If user is asking for hisaab / balance / account status, set "intent": "get_balance".

Return strict JSON ONLY with no markdown wrappers.`;

// Levenshtein distance for customer matching against existing store ledger
function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

// Call Multilingual LLM Brain (Gemini Flash Lite Primary -> Qwen Fallback -> Groq Failover)
async function callLLMBrain(text: string, currentDate: string): Promise<{ data: any; model: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const dashKey = process.env.DASHSCOPE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Google Gemini Flash Lite (Primary AI Brain)
  if (geminiKey) {
    try {
      console.log('⚡ [Voice API] Calling Google Gemini Flash Lite (Primary Brain)...');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCurrent Date: ${currentDate}\nUser Voice Input: "${text}"` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        }),
      });

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) return { data: JSON.parse(raw), model: 'Gemini Flash Lite' };
      } else {
        const errText = await res.text();
        console.warn(`⚠️ [Voice API] Gemini status (${res.status}):`, errText);
      }
    } catch (e) {
      console.warn('⚠️ [Voice API] Gemini Brain exception, falling back to Qwen:', e);
    }
  }

  // 2. DashScope Qwen Turbo (Secondary Fallback AI Brain)
  if (dashKey) {
    try {
      console.log('⚡ [Voice API] Falling back to DashScope Qwen-Turbo (Secondary Brain)...');
      const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dashKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0,
        }),
      });

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.choices?.[0]?.message?.content;
        if (raw) return { data: JSON.parse(raw), model: 'Qwen-Turbo' };
      }
    } catch (e) {
      console.warn('DashScope Brain error:', e);
    }
  }

  // 3. Groq LLM (Tertiary Failover)
  if (groqKey) {
    try {
      console.log('⚡ [Voice API] Falling back to Groq Llama-3.3 (Tertiary Brain)...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0,
        }),
      });

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.choices?.[0]?.message?.content;
        if (raw) return { data: JSON.parse(raw), model: 'Llama-3.3-70B' };
      }
    } catch (e) {
      console.warn('Groq Brain error:', e);
    }
  }

  return null;
}

export const processVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const totalStartTime = performance.now();
  let sttDurationMs = 0;
  let llmDurationMs = 0;
  let sttProvider = 'None';

  try {
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    let text = req.body?.text;

    let existingPeople: { id: string; name: string }[] = [];
    try {
      if (req.body?.people) {
        existingPeople = typeof req.body.people === 'string' ? JSON.parse(req.body.people) : req.body.people;
      }
    } catch (e) {}

    const currentDate = req.body?.current_date || new Date().toISOString().split('T')[0];

    console.log('\n🎙️ [Voice API] Incoming Voice Request');

    if (req.file) {
      const sttStart = performance.now();
      const extension = req.file.originalname.split('.').pop() || 'm4a';
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/m4a' });

      let transcribedSuccessfully = false;

      // 1. Primary STT: ElevenLabs Scribe STT
      if (elevenKey) {
        try {
          console.log('⚡ [Voice API] Calling ElevenLabs Scribe STT (Primary)...');
          const scribeFormData = new FormData();
          scribeFormData.append('file', audioBlob, `recording.${extension}`);
          scribeFormData.append('model_id', 'scribe_v1');

          const scribeRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': elevenKey },
            body: scribeFormData as any,
          });

          if (scribeRes.ok) {
            const scribeData = (await scribeRes.json()) as any;
            text = (scribeData.text || '').trim();
            transcribedSuccessfully = true;
            sttProvider = 'ElevenLabs Scribe';
          } else {
            console.warn(`⚠️ [Voice API] ElevenLabs Scribe status: ${scribeRes.status}`);
          }
        } catch (err) {
          console.warn('⚠️ [Voice API] ElevenLabs Scribe exception:', err);
        }
      }

      // 2. Fallback STT: Groq Whisper Turbo
      if (!transcribedSuccessfully && groqKey) {
        try {
          console.log('⚡ [Voice API] Falling back to Groq Whisper Turbo STT...');
          const formData = new FormData();
          formData.append('file', audioBlob, `recording.${extension}`);
          formData.append('model', 'whisper-large-v3-turbo');
          formData.append('language', 'en');
          formData.append('temperature', '0');

          const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}` },
            body: formData as any,
          });

          if (whisperResponse.ok) {
            const whisperData = (await whisperResponse.json()) as any;
            text = (whisperData.text || '').trim();
            transcribedSuccessfully = true;
            sttProvider = 'Groq Whisper Turbo';
          }
        } catch (e) {
          console.error('❌ [Voice API] Groq STT fallback failed:', e);
        }
      }

      sttDurationMs = Math.round(performance.now() - sttStart);

      if (!text) {
        res.status(500).json({ error: 'Speech transcription failed. Please check your microphone & API keys.' });
        return;
      }

      console.log(`✨ [Voice API] ${sttProvider} Transcribed (${sttDurationMs}ms): "${text}"`);
    } else if (text) {
      console.log(`📝 [Voice API] Text command received: "${text}"`);
    } else {
      res.status(400).json({ error: 'No audio file or text received.' });
      return;
    }

    if (!text || text.length < 2) {
      console.log('⚠️ [Voice API] Silence / No speech detected.');
      res.status(400).json({ error: 'No speech detected. Please speak clearly into your mic.' });
      return;
    }

    // --- AI Comprehension Brain ---
    const llmStart = performance.now();
    const brainResult = await callLLMBrain(text, currentDate);
    llmDurationMs = Math.round(performance.now() - llmStart);

    const parsedData = brainResult?.data;
    const brainModel = brainResult?.model || 'Deterministic Local';

    let rawPersonName = parsedData?.person?.name || 'Customer';
    let matchedPersonId: string | null = null;

    // Normalize common phonetic spellings
    if (rawPersonName.toLowerCase() === 'asama') rawPersonName = 'Usama';

    // Fuzzy Match with existing store customer list
    if (existingPeople.length > 0) {
      const lowerCandidate = rawPersonName.toLowerCase();
      const exactMatch = existingPeople.find((p) => p.name.toLowerCase() === lowerCandidate);
      if (exactMatch) {
        rawPersonName = exactMatch.name;
        matchedPersonId = exactMatch.id;
      } else {
        let bestMatch: { id: string; name: string; dist: number } | null = null;
        for (const p of existingPeople) {
          const dist = levenshteinDistance(lowerCandidate, p.name.toLowerCase());
          if (dist <= 2) {
            if (!bestMatch || dist < bestMatch.dist) {
              bestMatch = { id: p.id, name: p.name, dist };
            }
          }
        }
        if (bestMatch) {
          rawPersonName = bestMatch.name;
          matchedPersonId = bestMatch.id;
        }
      }
    }

    const intent = parsedData?.intent || 'create_transaction';
    const amount = Number(parsedData?.transaction?.amount) || 0;
    const direction: 'gave' | 'got' = parsedData?.transaction?.direction === 'got' ? 'got' : 'gave';
    const reason = parsedData?.transaction?.reason || '';
    const txnDate = parsedData?.transaction?.date || currentDate;

    const totalDurationMs = Math.round(performance.now() - totalStartTime);

    const normalizedResult = {
      intent,
      customerName: rawPersonName,
      partyName: rawPersonName,
      person: {
        name: rawPersonName,
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
      confidence: 0.99,
      originalText: text,
      timings: {
        sttMs: sttDurationMs,
        sttProvider,
        llmMs: llmDurationMs,
        brainModel,
        totalMs: totalDurationMs,
      },
    };

    console.log(`⚡ [Voice API] ⏱️ STT: ${sttDurationMs}ms (${sttProvider}) | Brain: ${llmDurationMs}ms (${brainModel}) | Total: ${totalDurationMs}ms`);
    console.log(`✅ [Voice API] [${brainModel}] Parsed: Intent="${intent}", Person="${rawPersonName}", Amount=${amount}, Direction="${direction}", Reason="${reason}"`);

    res.json(normalizedResult);
  } catch (error) {
    console.error('Error in processVoice:', error);
    next(error);
  }
};

// ElevenLabs Natural Voice Generation Controller
export const generateSpeech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = req.body;

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
        model_id: 'eleven_multilingual_v2',
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
  } catch (e: any) {
    console.error('TTS error:', e);
    res.json({ error: e?.message || 'TTS failed', fallback: true });
  }
};
