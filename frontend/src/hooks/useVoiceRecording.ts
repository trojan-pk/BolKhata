import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { COPY } from '../i18n/copy';
import { ApiService } from '../services/api';
import { Party } from '../types';
import { todayISO } from '../utils/format';

export type VoiceState = 'idle' | 'recording' | 'processing';

const MAX_SESSION_MS = 30000;

interface UseVoiceRecordingProps {
  parties: Party[];
  onVoiceResult: (result: unknown) => void;
  onError: (message?: string) => void;
}

export function useVoiceRecording({
  parties,
  onVoiceResult,
  onError,
}: UseVoiceRecordingProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);

  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  // expo-audio: the recorder is owned by the hook (released on unmount);
  // the ref tracks whether a native capture is currently in progress.
  const nativeRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const nativeRecordingRef = useRef(false);
  const capturingRef = useRef(false);
  // Pending start (permission prompt / prepare). Stop must wait on it, or a
  // release during start leaves an orphaned recorder running.
  const startingRef = useRef<Promise<void> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});

  // Rotating voice example prompts
  useEffect(() => {
    if (voiceState !== 'recording') return;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % COPY.home.examples.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [voiceState]);

  const releaseWebStream = () => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }
  };

  const cleanupTimers = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const abortRecording = useCallback(
    (message?: string) => {
      capturingRef.current = false;
      isTapRecordingRef.current = false;
      setVoiceState('idle');
      setDurationSeconds(0);
      cleanupTimers();
      releaseWebStream();

      if (nativeRecordingRef.current) {
        nativeRecorder.stop().catch(() => {});
        nativeRecordingRef.current = false;
        setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }
      if (webRecorderRef.current && webRecorderRef.current.state !== 'inactive') {
        try {
          webRecorderRef.current.stop();
        } catch {}
      }

      if (typeof message === 'string' && message.length > 0) {
        onError(message);
      }
    },
    [onError, nativeRecorder]
  );

  const sendForParsing = useCallback(
    async (body: FormData) => {
      body.append(
        'people',
        JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name })))
      );
      body.append('current_date', todayISO());

      try {
        const result = await ApiService.processVoice(body);
        if (result) {
          onVoiceResult(result);
        } else {
          onError(COPY.voice.failed);
        }
      } catch (err) {
        console.warn('[Voice] processing failed:', err);
        // Server errors carry a readable message (401, 429, "No speech detected");
        // network failures surface as TypeError and get the generic copy.
        const serverMessage =
          err instanceof Error && !(err instanceof TypeError) ? err.message : '';
        onError(serverMessage || COPY.voice.failed);
      } finally {
        setVoiceState('idle');
        setDurationSeconds(0);
      }
    },
    [parties, onVoiceResult, onError]
  );

  const stopRecording = useCallback(async () => {
    if (!capturingRef.current) return;
    capturingRef.current = false;
    isTapRecordingRef.current = false;
    cleanupTimers();
    setVoiceState('processing');

    // Released while the mic was still starting up: let start finish so the
    // recorder is in a known state before we stop it.
    if (startingRef.current) {
      await startingRef.current;
    }

    try {
      if (Platform.OS === 'web') {
        const recorder = webRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          // Start failed or never got going — onstop would never fire.
          releaseWebStream();
          setVoiceState('idle');
          return;
        }

        recorder.onstop = async () => {
          releaseWebStream();
          webRecorderRef.current = null;
          if (webChunksRef.current.length === 0) {
            setVoiceState('idle');
            onError(COPY.voice.tooShort);
            return;
          }

          // Use the browser's actual container (Safari records audio/mp4).
          const mimeType = (recorder.mimeType || 'audio/webm').split(';')[0];
          const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          const blob = new Blob(webChunksRef.current, { type: mimeType });
          webChunksRef.current = [];
          if (blob.size < 500) {
            setVoiceState('idle');
            onError(COPY.voice.tooShort);
            return;
          }

          const body = new FormData();
          body.append('audio', blob, `entry.${ext}`);
          await sendForParsing(body);
        };

        recorder.stop();
        return;
      }

      if (!nativeRecordingRef.current) {
        setVoiceState('idle');
        return;
      }

      await nativeRecorder.stop();
      const uri = nativeRecorder.uri;
      nativeRecordingRef.current = false;
      // Leave record mode so TTS playback isn't routed to the earpiece on iOS.
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});

      if (!uri) {
        setVoiceState('idle');
        onError(COPY.voice.tooShort);
        return;
      }

      const body = new FormData();
      body.append('audio', {
        uri,
        name: 'entry.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
      await sendForParsing(body);
    } catch (err) {
      console.warn('[Voice] stop failed:', err);
      setVoiceState('idle');
      onError(COPY.voice.failed);
    }
  }, [sendForParsing, onError, nativeRecorder]);

  useEffect(() => {
    stopRef.current = stopRecording;
  }, [stopRecording]);

  const beginCapture = useCallback(async () => {
    if (Platform.OS === 'web') {
      const media =
        typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
      if (!media?.getUserMedia) {
        abortRecording(COPY.voice.micUnavailable);
        return;
      }
      const stream = await media.getUserMedia({ audio: true });
      webStreamRef.current = stream;
      webChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      webRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) webChunksRef.current.push(event.data);
      };
      recorder.start();
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      abortRecording(COPY.voice.micDenied);
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    // A recorder orphaned by an earlier interrupted session would make
    // prepareToRecordAsync throw; stop it first.
    if (nativeRecorder.isRecording) {
      await nativeRecorder.stop().catch(() => {});
    }

    await nativeRecorder.prepareToRecordAsync();
    nativeRecorder.record();
    nativeRecordingRef.current = true;
  }, [abortRecording, nativeRecorder]);

  const startRecording = useCallback(async () => {
    if (capturingRef.current || startingRef.current) return;

    capturingRef.current = true;
    setDurationSeconds(0);
    setVoiceState('recording');

    sessionTimerRef.current = setTimeout(() => {
      if (capturingRef.current) stopRef.current();
    }, MAX_SESSION_MS);

    durationTimerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    const starting = beginCapture().catch((err) => {
      console.warn('[Voice] start failed:', err);
      abortRecording(COPY.voice.micDenied);
    });
    startingRef.current = starting;
    try {
      await starting;
    } finally {
      startingRef.current = null;
    }
  }, [abortRecording, beginCapture]);

  const pressStartRef = useRef<number>(0);
  const isTapRecordingRef = useRef<boolean>(false);

  const handleVoicePressIn = useCallback(() => {
    pressStartRef.current = Date.now();
    if (voiceState === 'idle') {
      isTapRecordingRef.current = false;
      void startRecording();
    } else if (voiceState === 'recording' && isTapRecordingRef.current) {
      // Second tap while actively recording in tap mode -> stop immediately!
      void stopRecording();
    }
  }, [voiceState, startRecording, stopRecording]);

  const handleVoicePressOut = useCallback(() => {
    const elapsed = Date.now() - pressStartRef.current;
    if (capturingRef.current && !isTapRecordingRef.current) {
      if (elapsed >= 350) {
        // User held to speak -> stop immediately on release!
        void stopRecording();
      } else {
        // Quick tap release -> stay recording in hands-free tap mode
        isTapRecordingRef.current = true;
      }
    }
  }, [stopRecording]);

  const handleVoicePress = useCallback(() => {
    if (capturingRef.current && isTapRecordingRef.current) {
      const elapsed = Date.now() - pressStartRef.current;
      if (elapsed > 300) {
        void stopRecording();
      }
    }
  }, [stopRecording]);

  const toggleRecording = useCallback(() => {
    if (voiceState === 'idle') {
      void startRecording();
    } else if (voiceState === 'recording') {
      void stopRecording();
    }
  }, [voiceState, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      cleanupTimers();
      releaseWebStream();
    };
  }, []);

  return {
    voiceState,
    durationSeconds,
    promptIndex,
    startRecording,
    stopRecording,
    abortRecording,
    toggleRecording,
    handleVoicePressIn,
    handleVoicePressOut,
    handleVoicePress,
  };
}
