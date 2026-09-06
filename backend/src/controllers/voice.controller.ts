import { Request, Response, NextFunction } from 'express'
import { matchPerson } from '../utils/matching'

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

Output raw JSON ONLY without markdown blocks.`

/** Abort signals so a hung provider can't stall the cascade forever. */
const STT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20_000
const LLM_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30_000

/**
 * Transcriptions are personal data (names, amounts, debts). Production logs
 * record only lengths and providers; set VOICE_DEBUG=true while developing
 * to see the raw text again.
 */
const VOICE_DEBUG = process.env.VOICE_DEBUG === 'true'

/** Strips markdown fences some models wrap around JSON despite instructions. */
function parseJsonLoose(raw: string): any {
    const trimmed = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
    return JSON.parse(trimmed)
}

// Call Multilingual LLM Brain (Gemini Flash Lite Primary -> Qwen Fallback -> Groq Failover)
async function callLLMBrain(
    text: string,
    currentDate: string,
): Promise<{ data: any; model: string } | null> {
    const geminiKey = process.env.GEMINI_API_KEY
    const dashKey = process.env.DASHSCOPE_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    // 1. Google Gemini Flash Lite (Primary AI Brain)
    if (geminiKey) {
        try {
            console.log('⚡ [LLM] Calling Google Gemini Flash Lite (Primary Brain)...')
            // Key in header, not the query string — URLs end up in logs and proxies.
            const res = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': geminiKey,
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `${SYSTEM_INSTRUCTION}\n\nCurrent Date: ${currentDate}\nUser Voice Input: "${text}"`,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            temperature: 0.0,
                        },
                    }),
                    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
                },
            )

            console.log(`⚡ [LLM] Gemini response status: ${res.status}`)

            if (res.ok) {
                const d = (await res.json()) as any
                const raw = d.candidates?.[0]?.content?.parts?.[0]?.text
                if (raw) {
                    console.log(`✅ [LLM] Gemini Flash Lite OK (${raw.length} chars)`)
                    return { data: parseJsonLoose(raw), model: 'Gemini Flash Lite' }
                }
                console.warn(`⚠️ [LLM] Gemini returned empty candidates`)
            } else {
                const errText = await res.text()
                console.warn(`⚠️ [LLM] Gemini FAILED (${res.status}):`)
                console.warn(`   ↳ body: ${errText.slice(0, 300)}`)
            }
        } catch (e: any) {
            console.warn(
                `⚠️ [LLM] Gemini EXCEPTION: ${e?.name || 'Error'} — ${e?.message || e}`,
            )
        }
    }

    // 2. DashScope Qwen Turbo (Secondary Fallback AI Brain)
    if (dashKey) {
        try {
            console.log(
                '⚡ [LLM] Falling back to DashScope Qwen-Turbo (Secondary Brain)...',
            )
            const res = await fetch(
                'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${dashKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'qwen-turbo',
                        messages: [
                            { role: 'system', content: SYSTEM_INSTRUCTION },
                            {
                                role: 'user',
                                content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"`,
                            },
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.0,
                    }),
                    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
                },
            )

            console.log(`⚡ [LLM] Qwen response status: ${res.status}`)

            if (res.ok) {
                const d = (await res.json()) as any
                const raw = d.choices?.[0]?.message?.content
                if (raw) {
                    console.log(`✅ [LLM] Qwen-Turbo OK (${raw.length} chars)`)
                    return { data: parseJsonLoose(raw), model: 'Qwen-Turbo' }
                }
                console.warn(`⚠️ [LLM] Qwen returned empty content`)
            } else {
                const errText = await res.text()
                console.warn(`⚠️ [LLM] Qwen FAILED (${res.status}):`)
                console.warn(`   ↳ body: ${errText.slice(0, 300)}`)
            }
        } catch (e: any) {
            console.warn(
                `⚠️ [LLM] Qwen EXCEPTION: ${e?.name || 'Error'} — ${e?.message || e}`,
            )
        }
    }

    // 3. Groq LLM (Tertiary Failover)
    // Note: llama-3.3-70b-versatile was deprecated by Groq; replaced with openai/gpt-oss-120b
    if (groqKey) {
        try {
            console.log('⚡ [LLM] Falling back to Groq GPT-OSS-120B (Tertiary Brain)...')
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                        { role: 'system', content: SYSTEM_INSTRUCTION },
                        {
                            role: 'user',
                            content: `Current Date: ${currentDate}\nUser Voice Input: "${text}"`,
                        },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.0,
                }),
                signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
            })

            console.log(`⚡ [LLM] Groq GPT-OSS response status: ${res.status}`)

            if (res.ok) {
                const d = (await res.json()) as any
                const raw = d.choices?.[0]?.message?.content
                if (raw) {
                    console.log(`✅ [LLM] GPT-OSS-120B OK (${raw.length} chars)`)
                    return { data: parseJsonLoose(raw), model: 'GPT-OSS-120B' }
                }
                console.warn(`⚠️ [LLM] Groq GPT-OSS returned empty content`)
            } else {
                const errText = await res.text()
                console.warn(`⚠️ [LLM] Groq GPT-OSS FAILED (${res.status}):`)
                console.warn(`   ↳ body: ${errText.slice(0, 300)}`)
            }
        } catch (e: any) {
            console.warn(
                `⚠️ [LLM] Groq GPT-OSS EXCEPTION: ${e?.name || 'Error'} — ${e?.message || e}`,
            )
        }
    }

    return null
}

export const processVoice = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const totalStartTime = performance.now()
    let sttDurationMs = 0
    let llmDurationMs = 0
    let sttProvider = 'None'

    try {
        const elevenKey = process.env.ELEVENLABS_API_KEY
        const groqKey = process.env.GROQ_API_KEY
        let text = req.body?.text

        let existingPeople: { id: string; name: string }[] = []
        try {
            if (req.body?.people) {
                existingPeople =
                    typeof req.body.people === 'string'
                        ? JSON.parse(req.body.people)
                        : req.body.people
            }
        } catch {
            // Malformed people payloads degrade to no fuzzy matching, not a 500.
        }

        const currentDate =
            req.body?.current_date || new Date().toISOString().split('T')[0]

        // ── Extract audio from file upload (FormData) or base64 (JSON body) ──
        let audioBuffer: Buffer | null = null
        let audioMimetype = 'audio/m4a'
        let audioOriginalName = 'entry.m4a'

        if (req.file) {
            audioBuffer = req.file.buffer
            audioMimetype = req.file.mimetype || 'audio/m4a'
            audioOriginalName = req.file.originalname || 'entry.m4a'
        } else if (req.body?.audioBase64) {
            try {
                const b64 = req.body.audioBase64.replace(/^data:.*?;base64,/, '')
                audioBuffer = Buffer.from(b64, 'base64')
                audioMimetype = req.body.audioType || 'audio/m4a'
                audioOriginalName = 'entry.m4a'
                console.log(
                    `🎙️ [Voice API] Decoded base64 audio: ${audioBuffer.length} bytes, type=${audioMimetype}`,
                )
            } catch (e: any) {
                console.error(
                    `❌ [Voice API] Failed to decode base64 audio: ${e?.message || e}`,
                )
            }
        }

        // ── Incoming request summary ──
        console.log(
            '\n🎙️ [Voice API] ═══════════════ Incoming Voice Request ═══════════════',
        )
        console.log(`🎙️ [Voice API] hasAudioFile:  ${!!audioBuffer}`)
        console.log(`🎙️ [Voice API] hasText:      ${!!text}`)
        console.log(`🎙️ [Voice API] peopleCount:  ${existingPeople.length}`)
        console.log(`🎙️ [Voice API] currentDate:  ${currentDate}`)
        console.log(
            `🎙️ [Voice API] source:       ${req.file ? 'multipart/form-data' : req.body?.audioBase64 ? 'JSON base64' : 'text-only'}`,
        )

        if (audioBuffer) {
            console.log(`🎙️ [Voice API] ── Audio File Details ──`)
            console.log(`🎙️ [Voice API] originalname: ${audioOriginalName}`)
            console.log(`🎙️ [Voice API] mimetype:     ${audioMimetype}`)
            console.log(`🎙️ [Voice API] size:         ${audioBuffer.length} bytes`)

            const sttStart = performance.now()
            const extension = audioOriginalName.split('.').pop() || 'm4a'
            const audioBlob = new Blob([new Uint8Array(audioBuffer)], {
                type: audioMimetype,
            })
            console.log(`🎙️ [Voice API] blobSize:     ${audioBlob.size} bytes`)
            console.log(`🎙️ [Voice API] extension:    ${extension}`)

            let transcribedSuccessfully = false

            // ── API key availability ──
            console.log(`🎙️ [Voice API] ── STT Key Check ──`)
            console.log(
                `🎙️ [Voice API] ELEVENLABS_API_KEY: ${elevenKey ? '✅ present' : '❌ missing'}`,
            )
            console.log(
                `🎙️ [Voice API] GROQ_API_KEY:       ${groqKey ? '✅ present' : '❌ missing'}`,
            )

            // 1. Primary STT: ElevenLabs Scribe STT
            if (elevenKey) {
                try {
                    console.log('⚡ [STT] Calling ElevenLabs Scribe STT (Primary)...')
                    const scribeFormData = new FormData()
                    scribeFormData.append('file', audioBlob, `recording.${extension}`)
                    scribeFormData.append('model_id', 'scribe_v1')

                    const scribeRes = await fetch(
                        'https://api.elevenlabs.io/v1/speech-to-text',
                        {
                            method: 'POST',
                            headers: { 'xi-api-key': elevenKey },
                            body: scribeFormData as any,
                            signal: AbortSignal.timeout(STT_TIMEOUT_MS),
                        },
                    )

                    console.log(
                        `⚡ [STT] ElevenLabs Scribe response status: ${scribeRes.status} ${scribeRes.statusText}`,
                    )

                    if (scribeRes.ok) {
                        const scribeData = (await scribeRes.json()) as any
                        text = (scribeData.text || '').trim()
                        transcribedSuccessfully = true
                        sttProvider = 'ElevenLabs Scribe'
                        console.log(
                            `✅ [STT] ElevenLabs Scribe OK → "${text}" (${text.length} chars)`,
                        )
                        if (scribeData.language_probability != null) {
                            console.log(
                                `   ↳ language: ${scribeData.language_code || '?'} (${Math.round((scribeData.language_probability || 0) * 100)}%)`,
                            )
                        }
                    } else {
                        const errBody = await scribeRes.text()
                        console.warn(
                            `⚠️ [STT] ElevenLabs Scribe FAILED (${scribeRes.status}):`,
                        )
                        console.warn(`   ↳ body: ${errBody.slice(0, 500)}`)
                    }
                } catch (err: any) {
                    console.warn(
                        `⚠️ [STT] ElevenLabs Scribe EXCEPTION: ${err?.name || 'Error'} — ${err?.message || err}`,
                    )
                    if (err?.cause) console.warn(`   ↳ cause:`, err.cause)
                }
            }

            // 2. Fallback STT: Groq Whisper Turbo
            if (!transcribedSuccessfully && groqKey) {
                try {
                    console.log('⚡ [STT] Falling back to Groq Whisper Turbo STT...')
                    const formData = new FormData()
                    formData.append('file', audioBlob, `recording.${extension}`)
                    formData.append('model', 'whisper-large-v3-turbo')
                    // No `language` hint: Whisper auto-detects, which matters for
                    // Urdu/Roman Urdu/Hindi input — pinning 'en' mangles it.
                    formData.append('temperature', '0')

                    const whisperResponse = await fetch(
                        'https://api.groq.com/openai/v1/audio/transcriptions',
                        {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${groqKey}` },
                            body: formData as any,
                            signal: AbortSignal.timeout(STT_TIMEOUT_MS),
                        },
                    )

                    console.log(
                        `⚡ [STT] Groq Whisper response status: ${whisperResponse.status} ${whisperResponse.statusText}`,
                    )

                    if (whisperResponse.ok) {
                        const whisperData = (await whisperResponse.json()) as any
                        text = (whisperData.text || '').trim()
                        transcribedSuccessfully = true
                        sttProvider = 'Groq Whisper Turbo'
                        console.log(
                            `✅ [STT] Groq Whisper OK → "${text}" (${text.length} chars)`,
                        )
                    } else {
                        const errBody = await whisperResponse.text()
                        console.warn(
                            `⚠️ [STT] Groq Whisper FAILED (${whisperResponse.status}):`,
                        )
                        console.warn(`   ↳ body: ${errBody.slice(0, 500)}`)
                    }
                } catch (e: any) {
                    console.error(
                        `❌ [STT] Groq Whisper EXCEPTION: ${e?.name || 'Error'} — ${e?.message || e}`,
                    )
                    if (e?.cause) console.error(`   ↳ cause:`, e.cause)
                }
            }

            sttDurationMs = Math.round(performance.now() - sttStart)

            if (!text) {
                console.error(
                    `❌ [STT] ALL PROVIDERS FAILED — no transcription produced.`,
                )
                console.error(
                    `   ↳ ElevenLabs key: ${elevenKey ? 'configured' : 'NOT SET'}`,
                )
                console.error(
                    `   ↳ Groq key:       ${groqKey ? 'configured' : 'NOT SET'}`,
                )
                console.error(
                    `   ↳ Audio size:     ${audioBlob.size} bytes, ext: ${extension}`,
                )
                res.status(500).json({
                    error: 'Speech transcription failed. Please check your microphone & API keys.',
                })
                return
            }

            // Filter out non-speech markers returned by STT providers
            // (e.g. "[tone]", "[silence]", "[music]", ".", "Thanks for watching!")
            const NON_SPEECH_PATTERN =
                /^[\s\[\]().,!?]*$|^\[(?:tone|silence|music|noise|applause|laughter|blank_audio|inaudible)\]$/i
            const trimmedForCheck = text
                .replace(/Thank(?:s| you)?.*(?:watching|listening).*/gi, '')
                .trim()
            if (NON_SPEECH_PATTERN.test(trimmedForCheck) || trimmedForCheck.length < 2) {
                console.warn(
                    `⚠️ [STT] Non-speech transcription detected: "${text}" — treating as no speech.`,
                )
                res.status(400).json({
                    error: 'No speech detected. Please speak clearly into your mic.',
                })
                return
            }

            console.log(
                `✨ [STT] ${sttProvider} transcribed in ${sttDurationMs}ms (${text.length} chars)`,
            )
            if (VOICE_DEBUG) console.log(`   ↳ transcript: "${text}"`)
        } else if (text) {
            console.log(
                `📝 [Voice API] Text command received (${text.length} chars): "${text.slice(0, 80)}..."`,
            )
        } else {
            console.warn(
                `⚠️ [Voice API] No audio file or text in request body. Keys: ${Object.keys(req.body || {}).join(', ') || '(empty)'}`,
            )
            res.status(400).json({ error: 'No audio file or text received.' })
            return
        }

        if (!text || text.length < 2) {
            console.log('⚠️ [Voice API] Silence / No speech detected.')
            res.status(400).json({
                error: 'No speech detected. Please speak clearly into your mic.',
            })
            return
        }

        // --- AI Comprehension Brain ---
        console.log(`🧠 [LLM] ── LLM Key Check ──`)
        console.log(
            `🧠 [LLM] GEMINI_API_KEY:    ${process.env.GEMINI_API_KEY ? '✅ present' : '❌ missing'}`,
        )
        console.log(
            `🧠 [LLM] DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? '✅ present' : '❌ missing'}`,
        )
        console.log(
            `🧠 [LLM] GROQ_API_KEY:      ${process.env.GROQ_API_KEY ? '✅ present' : '❌ missing'}`,
        )
        const llmStart = performance.now()
        const brainResult = await callLLMBrain(text, currentDate)
        llmDurationMs = Math.round(performance.now() - llmStart)

        const parsedData = brainResult?.data
        const brainModel = brainResult?.model || 'Deterministic Local'

        let rawPersonName = parsedData?.person?.name || 'Customer'
        let matchedPersonId: string | null = null

        // Fuzzy Match with existing store customer list (honoric-stripped,
        // phonetically normalized Levenshtein — see utils/matching.ts)
        if (existingPeople.length > 0) {
            const exact = existingPeople.find(
                (p) => p.name.toLowerCase() === rawPersonName.toLowerCase(),
            )
            if (exact) {
                rawPersonName = exact.name
                matchedPersonId = exact.id
            } else {
                const best = matchPerson(rawPersonName, existingPeople, 2)
                if (best) {
                    rawPersonName = best.name
                    matchedPersonId = best.id
                }
            }
        }

        const intent = parsedData?.intent || 'create_transaction'
        const amount = Number(parsedData?.transaction?.amount) || 0
        const direction: 'gave' | 'got' =
            parsedData?.transaction?.direction === 'got' ? 'got' : 'gave'
        const reason = parsedData?.transaction?.reason || ''
        const txnDate = parsedData?.transaction?.date || currentDate
        const searchCriteria = parsedData?.searchCriteria || null
        const changes = parsedData?.changes || null

        const totalDurationMs = Math.round(performance.now() - totalStartTime)

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
        }

        console.log(
            `⚡ [Voice API] ⏱️ STT: ${sttDurationMs}ms (${sttProvider}) | LLM: ${llmDurationMs}ms (${brainModel}) | Total: ${totalDurationMs}ms`,
        )
        console.log(
            `✅ [Voice API] [${brainModel}] Parsed: Intent="${intent}", Person="${rawPersonName}", Amount=${amount}, Direction="${direction}"`,
        )
        console.log(`🏁 [Voice API] ═══════════════ Response Sent ═══════════════\n`)

        res.json(normalizedResult)
    } catch (error: any) {
        const totalDurationMs = Math.round(performance.now() - totalStartTime)
        console.error(`\n❌ [Voice API] FATAL EXCEPTION after ${totalDurationMs}ms:`)
        console.error(`   ↳ type:    ${error?.name || 'Error'}`)
        console.error(`   ↳ message: ${error?.message || error}`)
        if (error?.cause) console.error(`   ↳ cause:`, error.cause)
        if (error?.stack) console.error(`   ↳ stack:\n${error.stack}`)
        next(error)
    }
}

// ElevenLabs Natural Voice Generation Controller
export const generateSpeech = async (req: Request, res: Response): Promise<void> => {
    const ttsStart = performance.now()
    try {
        const elevenKey = process.env.ELEVENLABS_API_KEY
        const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = req.body

        console.log('\n🔊 [TTS] ═══════════════ TTS Request ═══════════════')
        console.log(
            `🔊 [TTS] text: "${text?.slice(0, 100)}${(text?.length || 0) > 100 ? '...' : ''}" (${text?.length || 0} chars)`,
        )
        console.log(`🔊 [TTS] voiceId: ${voiceId}`)
        console.log(
            `🔊 [TTS] ELEVENLABS_API_KEY: ${elevenKey ? '✅ present' : '❌ missing'}`,
        )

        if (!elevenKey) {
            console.warn('⚠️ [TTS] ELEVENLABS_API_KEY not configured — returning 503')
            res.status(503).json({
                error: 'ELEVENLABS_API_KEY not configured',
                fallback: true,
            })
            return
        }

        console.log(`⚡ [TTS] Calling ElevenLabs TTS API...`)
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
            },
        )

        console.log(
            `⚡ [TTS] ElevenLabs response status: ${elevenRes.status} ${elevenRes.statusText}`,
        )

        if (!elevenRes.ok) {
            const errText = await elevenRes.text()
            console.warn(`⚠️ [TTS] ElevenLabs FAILED (${elevenRes.status}):`)
            console.warn(`   ↳ body: ${errText.slice(0, 500)}`)
            // Real error status so the client can fall back to on-device speech.
            res.status(502).json({
                error: 'TTS provider failed',
                fallback: true,
                details: errText.slice(0, 300),
            })
            return
        }

        const audioArrayBuffer = await elevenRes.arrayBuffer()
        const base64Audio = Buffer.from(audioArrayBuffer).toString('base64')
        const durationMs = Math.round(performance.now() - ttsStart)
        const audioSizeKb = Math.round(audioArrayBuffer.byteLength / 1024)

        console.log(
            `✅ [TTS] Audio generated in ${durationMs}ms (${audioSizeKb} KB, ${base64Audio.length} base64 chars)`,
        )
        res.json({ audioBase64: `data:audio/mp3;base64,${base64Audio}` })
    } catch (e: any) {
        const durationMs = Math.round(performance.now() - ttsStart)
        console.error(
            `❌ [TTS] EXCEPTION after ${durationMs}ms: ${e?.name || 'Error'} — ${e?.message || e}`,
        )
        if (e?.cause) console.error(`   ↳ cause:`, e.cause)
        res.status(502).json({ error: e?.message || 'TTS failed', fallback: true })
    }
}
