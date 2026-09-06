/**
 * test-voice.mjs — Direct voice-pipeline diagnostics.
 *
 * Tests each AI provider (STT / LLM / TTS) independently, then runs the full
 * voice/process endpoint through the Express server.
 *
 * Usage:
 *   node test-voice.mjs            # run all tests
 *   node test-voice.mjs stt        # STT only
 *   node test-voice.mjs tts        # TTS only
 *   node test-voice.mjs llm        # LLM only
 *   node test-voice.mjs full       # full pipeline (server must be running)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* ── Load .env manually ─────────────────────────────────────────────────── */
function loadEnv() {
    const envPath = resolve(__dirname, '.env')
    if (!existsSync(envPath)) {
        console.error('❌ .env file not found at', envPath)
        process.exit(1)
    }
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    const env = {}
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim()
        env[key] = val
    }
    return env
}

const ENV = loadEnv()
const ELEVENLABS_KEY = ENV.ELEVENLABS_API_KEY
const GROQ_KEY = ENV.GROQ_API_KEY
const GEMINI_KEY = ENV.GEMINI_API_KEY
const DASHSCOPE_KEY = ENV.DASHSCOPE_API_KEY

const SUPABASE_URL = ENV.SUPABASE_URL
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY
const SERVER_PORT = ENV.PORT || '3000'
const SERVER_URL = `http://localhost:${SERVER_PORT}`

/* ── Generate a tiny WAV test file ──────────────────────────────────────── */
function generateTestWav(durationSec = 1.5) {
    const sampleRate = 16000
    const numSamples = Math.floor(sampleRate * durationSec)
    const buf = Buffer.alloc(44 + numSamples * 2)

    // WAV header
    buf.write('RIFF', 0)
    buf.writeUInt32LE(36 + numSamples * 2, 4)
    buf.write('WAVE', 8)
    buf.write('fmt ', 12)
    buf.writeUInt32LE(16, 16) // chunk size
    buf.writeUInt16LE(1, 20) // PCM
    buf.writeUInt16LE(1, 22) // mono
    buf.writeUInt32LE(sampleRate, 24)
    buf.writeUInt32LE(sampleRate * 2, 28) // byte rate
    buf.writeUInt16LE(2, 32) // block align
    buf.writeUInt16LE(16, 34) // bits per sample
    buf.write('data', 36)
    buf.writeUInt32LE(numSamples * 2, 40)

    // Generate a 440 Hz sine wave with amplitude envelope (speech-like)
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const envelope = Math.min(1, t * 4) * Math.max(0, 1 - (t - durationSec + 0.3) * 3)
        const sample = Math.sin(2 * Math.PI * 440 * t) * 0.25 * envelope
        const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)))
        buf.writeInt16LE(intSample, 44 + i * 2)
    }
    return buf
}

/* ── Helper ──────────────────────────────────────────────────────────────── */
function timer() {
    const start = performance.now()
    return () => Math.round(performance.now() - start)
}

function section(title) {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`  ${title}`)
    console.log('═'.repeat(60))
}

/* ── STT Tests ──────────────────────────────────────────────────────────── */
async function testElevenLabsSTT(audioBuffer) {
    section('STT: ElevenLabs Scribe (Primary)')

    if (!ELEVENLABS_KEY) {
        console.log('⏭️  SKIPPED — ELEVENLABS_API_KEY not set in .env')
        return null
    }

    const elapsed = timer()
    console.log(`📦 Audio: ${audioBuffer.length} bytes (WAV)`)

    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' })
    const formData = new FormData()
    formData.append('file', blob, 'test.wav')
    formData.append('model_id', 'scribe_v1')

    try {
        console.log('⚡ Calling ElevenLabs Scribe...')
        const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': ELEVENLABS_KEY },
            body: formData,
            signal: AbortSignal.timeout(20_000),
        })

        console.log(`   Status: ${res.status} ${res.statusText}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 500)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            console.log(`✅ OK — text: "${data.text}"`)
            return data.text
        } else {
            console.log(`❌ FAILED (${res.status})`)
            return null
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        if (e.cause) console.log(`   cause:`, e.cause)
        console.log(`   ⏱️  ${elapsed()}ms`)
        return null
    }
}

async function testGroqWhisperSTT(audioBuffer) {
    section('STT: Groq Whisper Turbo (Fallback)')

    if (!GROQ_KEY) {
        console.log('⏭️  SKIPPED — GROQ_API_KEY not set in .env')
        return null
    }

    const elapsed = timer()
    console.log(`📦 Audio: ${audioBuffer.length} bytes (WAV)`)

    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' })
    const formData = new FormData()
    formData.append('file', blob, 'test.wav')
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('temperature', '0')

    try {
        console.log('⚡ Calling Groq Whisper...')
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${GROQ_KEY}` },
            body: formData,
            signal: AbortSignal.timeout(20_000),
        })

        console.log(`   Status: ${res.status} ${res.statusText}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 500)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            console.log(`✅ OK — text: "${data.text}"`)
            return data.text
        } else {
            console.log(`❌ FAILED (${res.status})`)
            return null
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        if (e.cause) console.log(`   cause:`, e.cause)
        console.log(`   ⏱️  ${elapsed()}ms`)
        return null
    }
}

/* ── LLM Tests ──────────────────────────────────────────────────────────── */
async function testGeminiLLM() {
    section('LLM: Gemini Flash Lite (Primary)')

    if (!GEMINI_KEY) {
        console.log('⏭️  SKIPPED — GEMINI_API_KEY not set in .env')
        return null
    }

    const elapsed = timer()
    const testInput = 'Ali ko 2000 diye petrol ke liye'

    try {
        console.log(`📝 Input: "${testInput}"`)
        console.log('⚡ Calling Gemini...')

        const res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_KEY,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a ledger parser. Extract JSON from: "${testInput}". Date: ${new Date().toISOString().split('T')[0]}. Schema: {intent, person:{name}, transaction:{direction, amount, reason, date}}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0,
                    },
                }),
                signal: AbortSignal.timeout(30_000),
            },
        )

        console.log(`   Status: ${res.status}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 500)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
            console.log(`✅ OK — parsed: ${raw?.slice(0, 200)}`)
            return raw
        } else {
            console.log(`❌ FAILED (${res.status})`)
            return null
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        console.log(`   ⏱️  ${elapsed()}ms`)
        return null
    }
}

async function testGroqLLM() {
    section('LLM: Groq GPT-OSS-120B (Tertiary)')

    if (!GROQ_KEY) {
        console.log('⏭️  SKIPPED — GROQ_API_KEY not set in .env')
        return null
    }

    const elapsed = timer()
    const testInput = 'Ali ko 2000 diye petrol ke liye'

    try {
        console.log(`📝 Input: "${testInput}"`)
        console.log('⚡ Calling Groq GPT-OSS-120B...')

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'system',
                        content:
                            'Extract JSON: {intent, person:{name}, transaction:{direction,amount,reason,date}} from ledger voice input.',
                    },
                    {
                        role: 'user',
                        content: `Date: ${new Date().toISOString().split('T')[0]}. Input: "${testInput}"`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0,
            }),
            signal: AbortSignal.timeout(30_000),
        })

        console.log(`   Status: ${res.status}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 500)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            const raw = data.choices?.[0]?.message?.content
            console.log(`✅ OK — parsed: ${raw?.slice(0, 200)}`)
            return raw
        } else {
            console.log(`❌ FAILED (${res.status})`)
            return null
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        console.log(`   ⏱️  ${elapsed()}ms`)
        return null
    }
}

/* ── TTS Test ───────────────────────────────────────────────────────────── */
async function testElevenLabsTTS() {
    section('TTS: ElevenLabs TTS')

    if (!ELEVENLABS_KEY) {
        console.log('⏭️  SKIPPED — ELEVENLABS_API_KEY not set in .env')
        return null
    }

    const elapsed = timer()
    const testText = 'Hello, this is a test of the text to speech system.'
    const voiceId = 'JBFqnCBsd6RMkjVDRZzb'

    try {
        console.log(`📝 Text: "${testText}" (${testText.length} chars)`)
        console.log(`🎤 Voice: ${voiceId}`)
        console.log('⚡ Calling ElevenLabs TTS...')

        const res = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: testText,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                }),
                signal: AbortSignal.timeout(30_000),
            },
        )

        console.log(`   Status: ${res.status} ${res.statusText}`)

        if (res.ok) {
            const buf = await res.arrayBuffer()
            const sizeKb = Math.round(buf.byteLength / 1024)
            console.log(`✅ OK — ${sizeKb} KB audio generated in ${elapsed()}ms`)

            // Save to disk for manual playback check
            const outPath = resolve(__dirname, 'test-tts-output.mp3')
            writeFileSync(outPath, Buffer.from(buf))
            console.log(`   💾 Saved to: ${outPath}`)
            return true
        } else {
            const body = await res.text()
            console.log(`❌ FAILED (${res.status}): ${body.slice(0, 500)}`)
            console.log(`   ⏱️  ${elapsed()}ms`)
            return null
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        if (e.cause) console.log(`   cause:`, e.cause)
        console.log(`   ⏱️  ${elapsed()}ms`)
        return null
    }
}

/* ── Full Pipeline Test (through Express server) ────────────────────────── */
async function testFullPipeline() {
    section('FULL PIPELINE: POST /voice/process (via Express server)')

    const elapsed = timer()
    const audioBuffer = generateTestWav(1.5)

    // First, get a Supabase anon token for auth (or try unauthenticated to see the error)
    console.log(`🔗 Server: ${SERVER_URL}`)
    console.log(`📦 Audio: ${audioBuffer.length} bytes (WAV)`)

    // Check if server is running
    try {
        console.log('⚡ Checking server health...')
        const healthRes = await fetch(`${SERVER_URL}/health`, {
            signal: AbortSignal.timeout(5_000),
        })
        if (!healthRes.ok) {
            console.log(
                `❌ Server not healthy (${healthRes.status}). Is the backend running?`,
            )
            return
        }
        const healthData = await healthRes.json()
        console.log(`✅ Server OK: ${healthData.status} (uptime: ${healthData.uptime}s)`)
    } catch (e) {
        console.log(`❌ Cannot reach server at ${SERVER_URL}: ${e.message}`)
        console.log(`   Start the server with: cd backend && npm run dev`)
        return
    }

    // Try to get a real Supabase session token for auth
    let authToken = ''
    try {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            console.log('⚡ Trying Supabase anon auth to get token...')
            // We need a real user to test — sign in anonymously or use existing
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: `test-${Date.now()}@test.local`,
                    password: 'test-password-12345',
                }),
            })
            if (authRes.ok) {
                const authData = await authRes.json()
                authToken = authData.access_token
                console.log(`✅ Got auth token (${authToken.slice(0, 20)}...)`)
            } else {
                const errBody = await authRes.text()
                console.log(`⚠️  Supabase signup failed: ${errBody.slice(0, 200)}`)
                console.log(`   Continuing without auth (expect 401)...`)
            }
        }
    } catch (e) {
        console.log(`⚠️  Could not get auth token: ${e.message}`)
        console.log(`   Continuing without auth (expect 401)...`)
    }

    // Build FormData
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' })
    const formData = new FormData()
    formData.append('audio', blob, 'test.wav')
    formData.append(
        'people',
        JSON.stringify([
            { id: '00000000-0000-0000-0000-000000000001', name: 'Ali' },
            { id: '00000000-0000-0000-0000-000000000002', name: 'Abbas Bhai' },
        ]),
    )
    formData.append('current_date', new Date().toISOString().split('T')[0])

    try {
        console.log('⚡ POST /voice/process...')
        const headers = { Accept: 'application/json' }
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`

        const res = await fetch(`${SERVER_URL}/voice/process`, {
            method: 'POST',
            body: formData,
            headers,
            signal: AbortSignal.timeout(60_000),
        })

        console.log(`   Status: ${res.status} ${res.statusText}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 800)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            console.log(`✅ Pipeline OK`)
            console.log(`   Intent: ${data.intent}`)
            console.log(`   Person: ${data.person?.name || data.customerName}`)
            console.log(`   Amount: ${data.amount}`)
            console.log(`   Direction: ${data.direction || data.type}`)
            if (data.timings) {
                console.log(
                    `   Timings: STT=${data.timings.sttMs}ms (${data.timings.sttProvider}) | LLM=${data.timings.llmMs}ms (${data.timings.brainModel}) | Total=${data.timings.totalMs}ms`,
                )
            }
        } else {
            console.log(`❌ Pipeline FAILED (${res.status})`)
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        if (e.cause) console.log(`   cause:`, e.cause)
        console.log(`   ⏱️  ${elapsed()}ms`)
    }
}

/* ── Text-only Pipeline Test ────────────────────────────────────────────── */
async function testTextPipeline() {
    section('TEXT PIPELINE: POST /voice/process with text (no audio)')

    const elapsed = timer()

    // Check server
    try {
        const healthRes = await fetch(`${SERVER_URL}/health`, {
            signal: AbortSignal.timeout(5_000),
        })
        if (!healthRes.ok) {
            console.log(`❌ Server not healthy. Is the backend running?`)
            return
        }
        console.log(`✅ Server reachable`)
    } catch (e) {
        console.log(`❌ Cannot reach server: ${e.message}`)
        return
    }

    // Try auth
    let authToken = ''
    try {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: `test-${Date.now()}@test.local`,
                    password: 'test-password-12345',
                }),
            })
            if (authRes.ok) {
                const authData = await authRes.json()
                authToken = authData.access_token
                console.log(`✅ Auth token obtained`)
            }
        }
    } catch {
        /* continue without auth */
    }

    try {
        console.log('⚡ POST /voice/process (text: "Ali ko 2000 diye petrol ke liye")...')
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`

        const res = await fetch(`${SERVER_URL}/voice/process`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                text: 'Ali ko 2000 diye petrol ke liye',
                people: [
                    { id: '00000000-0000-0000-0000-000000000001', name: 'Ali' },
                    { id: '00000000-0000-0000-0000-000000000002', name: 'Abbas Bhai' },
                ],
                current_date: new Date().toISOString().split('T')[0],
            }),
            signal: AbortSignal.timeout(60_000),
        })

        console.log(`   Status: ${res.status} ${res.statusText}`)
        const body = await res.text()
        console.log(`   Response: ${body.slice(0, 800)}`)
        console.log(`   ⏱️  ${elapsed()}ms`)

        if (res.ok) {
            const data = JSON.parse(body)
            console.log(`✅ Text pipeline OK`)
            console.log(`   Intent: ${data.intent}`)
            console.log(`   Person: ${data.person?.name || data.customerName}`)
            console.log(`   Amount: ${data.amount}`)
            console.log(`   Direction: ${data.direction || data.type}`)
        } else {
            console.log(`❌ Text pipeline FAILED (${res.status})`)
        }
    } catch (e) {
        console.log(`❌ EXCEPTION: ${e.name} — ${e.message}`)
        console.log(`   ⏱️  ${elapsed()}ms`)
    }
}

/* ── Main ────────────────────────────────────────────────────────────────── */
async function main() {
    const mode = (process.argv[2] || 'all').toLowerCase()

    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║   BolKhata Voice Pipeline Test Suite             ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log(`Mode: ${mode}`)
    console.log(`\n🔑 API Keys detected:`)
    console.log(`   ELEVENLABS_API_KEY: ${ELEVENLABS_KEY ? '✅ present' : '❌ missing'}`)
    console.log(`   GROQ_API_KEY:       ${GROQ_KEY ? '✅ present' : '❌ missing'}`)
    console.log(`   GEMINI_API_KEY:     ${GEMINI_KEY ? '✅ present' : '❌ missing'}`)
    console.log(`   DASHSCOPE_API_KEY:  ${DASHSCOPE_KEY ? '✅ present' : '❌ missing'}`)

    const audioBuffer = generateTestWav(1.5)
    console.log(`\n🎵 Test audio: ${audioBuffer.length} bytes WAV (1.5s, 440Hz sine)`)

    // Save test audio for inspection
    const audioPath = resolve(__dirname, 'test-audio.wav')
    writeFileSync(audioPath, audioBuffer)
    console.log(`   💾 Saved: ${audioPath}`)

    if (mode === 'all' || mode === 'stt') {
        await testElevenLabsSTT(audioBuffer)
        await testGroqWhisperSTT(audioBuffer)
    }

    if (mode === 'all' || mode === 'llm') {
        await testGeminiLLM()
        await testGroqLLM()
    }

    if (mode === 'all' || mode === 'tts') {
        await testElevenLabsTTS()
    }

    if (mode === 'all' || mode === 'full') {
        await testTextPipeline()
        await testFullPipeline()
    }

    console.log(`\n\n${'═'.repeat(60)}`)
    console.log('  Test run complete. Check results above.')
    console.log('═'.repeat(60))
}

main().catch((e) => {
    console.error('FATAL:', e)
    process.exit(1)
})
