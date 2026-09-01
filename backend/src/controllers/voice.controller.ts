import { Request, Response, NextFunction } from 'express';
import { matchPerson } from '../utils/matching';

/**
 * Voice pipeline: STT cascade (ElevenLabs → Groq Whisper → raw text) feeding
 * an LLM intent cascade (Gemini → Qwen → Groq). The LLM only extracts intent
 * and parameters — balances are computed deterministically elsewhere.
 */

// Universal AI System Prompt for Ledger Intent Parsing
const SYSTEM_INSTRUCTION = `You are BolKhata's financial ledger parser.
Analyze spoken South Asian business and personal ledger statements (in Urdu, Roman Urdu, Hindi, or English) and extract clean JSON.

SCHEMA:
{
  "intent": "create_transaction" | "update_transaction" | "delete_transaction" | "delete_customer" | "get_balance",
  "person": {
    "name": "Person Name in English TitleCase"
  },
  "transaction": {
    "direction": "gave" | "got",
    "amount": number,
    "reason": "item/purpose or null",
    "date": "YYYY-MM-DD"
  },
  "searchCriteria": {
    "previousAmount": number or null,
    "relativeTime": "last" | "today" | "yesterday" | null
  },
  "changes": {
    "amount": number or null,
    "direction": "gave" | "got" | null,
    "reason": "updated purpose or null"
  }
}

RULES FOR "direction":
• "gave" = Money or goods GIVEN out / Udhaar diya / I paid them / They owe me.
• "got" = Money RECEIVED in / Udhaar liya / I owe them (dene hain) / Payment received.

INTENTS:
• "create_transaction": Standard new entry (e.g. "Ali ko 2000 diye", "Abbas bhai ko 500 dene hain").
• "update_transaction": Modifying previous entry (e.g. "Zain ki pichli entry 2000 kardo").
• "delete_transaction": Removing an entry (e.g. "Ali ka aakhri hisaab delete kardo").
• "delete_customer": Removing whole customer (e.g. "Ali ko delete kardo").
• "get_balance": Checking hisaab (e.g. "Ali ka balance batao").

CONVERSIONS:
• Numbers: 1 lakh = 100000, 5 hazar = 5000, derh hazar = 1500, dhai hazar = 2500.
• Names: Always convert Urdu script names to Roman TitleCase (e.g. "عباس بھائی" -> "Abbas Bhai", "اسامہ" -> "Usama", "علی" -> "Ali").
• Reason: Extract pure item/service (e.g. "cutting", "petrol", "khana", "repair").

Output raw JSON ONLY without markdown blocks.`;

/** Abort signals so a hung provider can't stall the cascade forever. */
const STT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20_000;
const LLM_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30_000;

/**
 * Transcriptions are personal data (names, amounts, debts). Production logs
 * record only lengths and providers; set VOICE_DEBUG=true while developing
 * to see the raw text again.
 */
const VOICE_DEBUG = process.env.VOICE_DEBUG === 'true';

/** Strips markdown fences some models wrap around JSON despite instructions. */
function parseJsonLoose(raw: string): any {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(trimmed);
}

// Call Multilingual LLM Brain (Gemini Flash Lite Primary -> Qwen Fallback -> Groq Failover)
async function callLLMBrain(
  text: string,
  currentDate: string
): Promise<{ data: any; model: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const dashKey = process.env.DASHSCOPE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Google Gemini Flash Lite (Primary AI Brain)
  if (geminiKey) {
    try {
      console.log('⚡ [Voice API] Calling Google Gemini Flash Lite (Primary Brain)...');
      // Key in header, not the query string — URLs end up in logs and proxies.
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCurrent Date: ${currentDate}\nUser Voice Input: "${text}"` }] },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.0,
            },
          }),
          signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
        }
      );

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) return { data: parseJsonLoose(raw), model: 'Gemini Flash Lite' };
      } else {
        const errText = await res.text();
        console.warn(`⚠️ [Voice API] Gemini status (${res.status}): ${errText.slice(0, 300)}`);
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
          Authorization: `Bearer ${dashKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0,
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      });

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.choices?.[0]?.message?.content;
        if (raw) return { data: parseJsonLoose(raw), model: 'Qwen-Turbo' };
      } else {
        console.warn(`⚠️ [Voice API] Qwen status (${res.status})`);
      }
    } catch (e) {
      console.warn('⚠️ [Voice API] DashScope Brain error:', e);
    }
  }

  // 3. Groq LLM (Tertiary Failover)
  if (groqKey) {
    try {
      console.log('⚡ [Voice API] Falling back to Groq Llama-3.3 (Tertiary Brain)...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0,
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      });

      if (res.ok) {
        const d = (await res.json()) as any;
        const raw = d.choices?.[0]?.message?.content;
        if (raw) return { data: parseJsonLoose(raw), model: 'Llama-3.3-70B' };
      } else {
        console.warn(`⚠️ [Voice API] Groq status (${res.status})`);
      }
    } catch (e) {
      console.warn('⚠️ [Voice API] Groq Brain error:', e);
    }
  }

  return null;
}

export const processVoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
        existingPeople =
          typeof req.body.people === 'string' ? JSON.parse(req.body.people) : req.body.people;
      }
    } catch {
      // Malformed people payloads degrade to no fuzzy matching, not a 500.
    }

    const currentDate = req.body?.current_date || new Date().toISOString().split('T')[0];

    console.log('\n🎙️ [Voice API] Incoming Voice Request');

    if (req.file) {
      const sttStart = performance.now();
      const extension = req.file.originalname.split('.').pop() || 'm4a';
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], {
        type: req.file.mimetype || 'audio/m4a',
      });

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
            signal: AbortSignal.timeout(STT_TIMEOUT_MS),
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
          // No `language` hint: Whisper auto-detects, which matters for
          // Urdu/Roman Urdu/Hindi input — pinning 'en' mangles it.
          formData.append('temperature', '0');

          const whisperResponse = await fetch(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${groqKey}` },
              body: formData as any,
              signal: AbortSignal.timeout(STT_TIMEOUT_MS),
            }
          );

          if (whisperResponse.ok) {
            const whisperData = (await whisperResponse.json()) as any;
            text = (whisperData.text || '').trim();
            transcribedSuccessfully = true;
            sttProvider = 'Groq Whisper Turbo';
          } else {
            console.warn(`⚠️ [Voice API] Groq STT status: ${whisperResponse.status}`);
          }
        } catch (e) {
          console.error('❌ [Voice API] Groq STT fallback failed:', e);
        }
      }

      sttDurationMs = Math.round(performance.now() - sttStart);

      if (!text) {
        res
          .status(500)
          .json({ error: 'Speech transcription failed. Please check your microphone & API keys.' });
        return;
      }

      console.log(
        `✨ [Voice API] ${sttProvider} transcribed in ${sttDurationMs}ms (${text.length} chars)`
      );
      if (VOICE_DEBUG) console.log(`   ↳ transcript: "${text}"`);
    } else if (text) {
      console.log(`📝 [Voice API] Text command received (${text.length} chars)`);
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

    // Fuzzy Match with existing store customer list (honoric-stripped,
    // phonetically normalized Levenshtein — see utils/matching.ts)
    if (existingPeople.length > 0) {
      const exact = existingPeople.find(
        (p) => p.name.toLowerCase() === rawPersonName.toLowerCase()
      );
      if (exact) {
        rawPersonName = exact.name;
        matchedPersonId = exact.id;
      } else {
        const best = matchPerson(rawPersonName, existingPeople, 2);
        if (best) {
          rawPersonName = best.name;
          matchedPersonId = best.id;
        }
      }
    }

    const intent = parsedData?.intent || 'create_transaction';
    const amount = Number(parsedData?.transaction?.amount) || 0;
    const direction: 'gave' | 'got' = parsedData?.transaction?.direction === 'got' ? 'got' : 'gave';
    const reason = parsedData?.transaction?.reason || '';
    const txnDate = parsedData?.transaction?.date || currentDate;
    const searchCriteria = parsedData?.searchCriteria || null;
    const changes = parsedData?.changes || null;

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
      searchCriteria,
      changes,
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

    console.log(
      `⚡ [Voice API] ⏱️ STT: ${sttDurationMs}ms (${sttProvider}) | Brain: ${llmDurationMs}ms (${brainModel}) | Total: ${totalDurationMs}ms`
    );
    console.log(
      `✅ [Voice API] [${brainModel}] Parsed: Intent="${intent}", Person="${rawPersonName}", Amount=${amount}, Direction="${direction}"`
    );

    res.json(normalizedResult);
  } catch (error) {
    console.error('Error in processVoice:', error);
    next(error);
  }
};

// ElevenLabs Natural Voice Generation Controller
export const generateSpeech = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = req.body;

    if (!elevenKey) {
      res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured', fallback: true });
      return;
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
      {
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
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.warn('ElevenLabs TTS warning:', elevenRes.status);
      // Real error status so the client can fall back to on-device speech.
      res.status(502).json({ error: 'TTS provider failed', fallback: true, details: errText.slice(0, 300) });
      return;
    }

    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const base64Audio = Buffer.from(audioArrayBuffer).toString('base64');
    res.json({ audioBase64: `data:audio/mp3;base64,${base64Audio}` });
  } catch (e: any) {
    console.error('TTS error:', e);
    res.status(502).json({ error: e?.message || 'TTS failed', fallback: true });
  }
};
