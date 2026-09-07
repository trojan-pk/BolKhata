import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, Mic, Sparkles } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { MOTION, RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Party } from '../types';
import { ApiService } from '../services/api';
import { OrbState, VoiceOrb } from './VoiceOrb';
import { Badge, Button, Sheet, useFeedback } from '../ui';
import { todayISO } from '../utils/format';

const MAX_SESSION_MS = 30000;

export interface VoiceRecordingModalProps {
  visible: boolean;
  parties: Party[];
  currency?: string;
  onClose: () => void;
  onParsed: (result: unknown) => void;
  onManualFallback: () => void;
}

export const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  visible,
  parties,
  currency = 'Rs',
  onClose,
  onParsed,
  onManualFallback,
}) => {
  const { toast } = useFeedback();

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const promptFade = useRef(new Animated.Value(1)).current;

  /* ------------------------------------------------------- capture refs -- */
  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const capturingRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});

  /* --------------------------------------------------- rotating prompts -- */
  useEffect(() => {
    if (orbState !== 'recording') return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(promptFade, {
          toValue: 0,
          duration: MOTION.fast,
          useNativeDriver: true,
        }),
        Animated.timing(promptFade, {
          toValue: 1,
          duration: MOTION.base,
          delay: 60,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(
        () => setPromptIndex((prev) => (prev + 1) % COPY.home.examples.length),
        MOTION.fast
      );
    }, 3800);
    return () => clearInterval(interval);
  }, [orbState, promptFade]);

  const releaseWebStream = () => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }
  };

  const abortCapture = useCallback(
    (message?: string) => {
      capturingRef.current = false;
      setOrbState('idle');
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      if (secondIntervalRef.current) {
        clearInterval(secondIntervalRef.current);
        secondIntervalRef.current = null;
      }
      releaseWebStream();
      if (message) toast(message, 'error');
    },
    [toast]
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
          onParsed(result);
        } else {
          toast(COPY.voice.failed, 'error');
          onManualFallback();
        }
      } catch (error) {
        toast(COPY.voice.failed, 'error');
        onManualFallback();
      } finally {
        setOrbState('idle');
      }
    },
    [parties, onParsed, onManualFallback, toast]
  );

  const stopCaptureAndParse = useCallback(async () => {
    if (!capturingRef.current) return;
    capturingRef.current = false;

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (secondIntervalRef.current) {
      clearInterval(secondIntervalRef.current);
      secondIntervalRef.current = null;
    }

    setOrbState('processing');

    try {
      if (Platform.OS === 'web') {
        const recorder = webRecorderRef.current;
        if (!recorder) {
          setOrbState('idle');
          return;
        }
        recorder.onstop = async () => {
          releaseWebStream();
          const chunks = webChunksRef.current;
          if (!chunks.length) {
            setOrbState('idle');
            return;
          }
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size < 500) {
            setOrbState('idle');
            toast(COPY.voice.tooShort, 'error');
            return;
          }
          const file = new File([blob], 'recording.webm', { type: mimeType });
          const formData = new FormData();
          formData.append('audio', file);
          await sendForParsing(formData);
        };
        recorder.stop();
        return;
      }

      const recording = nativeRecordingRef.current;
      if (!recording) {
        setOrbState('idle');
        return;
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      nativeRecordingRef.current = null;
      if (!uri) {
        setOrbState('idle');
        toast(COPY.voice.failed, 'error');
        return;
      }
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      await sendForParsing(formData);
    } catch {
      setOrbState('idle');
      toast(COPY.voice.failed, 'error');
    }
  }, [sendForParsing, toast]);

  useEffect(() => {
    stopRef.current = stopCaptureAndParse;
  }, [stopCaptureAndParse]);

  const startCapture = useCallback(async () => {
    if (capturingRef.current) return;

    try {
      capturingRef.current = true;
      setSecondsElapsed(0);
      setOrbState('recording');

      sessionTimerRef.current = setTimeout(() => {
        if (capturingRef.current) stopRef.current();
      }, MAX_SESSION_MS);

      secondIntervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);

      if (Platform.OS === 'web') {
        const media =
          typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
        if (!media?.getUserMedia) {
          abortCapture(COPY.voice.micUnavailable);
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

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        abortCapture(COPY.voice.micDenied);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      nativeRecordingRef.current = recording;
    } catch (error) {
      abortCapture(COPY.voice.micDenied);
    }
  }, [abortCapture]);

  // Start recording when modal opens
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        startCapture();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      abortCapture();
    }
  }, [visible, startCapture, abortCapture]);

  const handleOrbPress = () => {
    if (orbState === 'recording') {
      stopCaptureAndParse();
    } else if (orbState === 'idle') {
      startCapture();
    }
  };

  const formattedTime = `0:${secondsElapsed < 10 ? '0' : ''}${secondsElapsed}`;

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        abortCapture();
        onClose();
      }}
      title={
        orbState === 'recording'
          ? COPY.home.voiceRecording
          : orbState === 'processing'
          ? COPY.home.voiceThinking
          : 'Voice Assistant'
      }
      subtitle="Bolen jaise: “Ali ko 500 diye” ya “Hamza se 1200 mile”"
      footer={
        <View style={styles.footerContainer}>
          {orbState === 'recording' ? (
            <View style={styles.actionRow}>
              <Button
                label={COPY.common.cancel}
                variant="secondary"
                size="lg"
                onPress={() => {
                  abortCapture();
                  onClose();
                }}
                style={styles.actionBtn}
              />
              <Button
                label="Finish & Process"
                icon={Check}
                variant="primary"
                size="lg"
                onPress={stopCaptureAndParse}
                style={styles.actionBtn}
              />
            </View>
          ) : orbState === 'processing' ? (
            <Button
              label="Understanding audio..."
              variant="primary"
              size="lg"
              loading
              disabled
              fullWidth
            />
          ) : (
            <View style={styles.actionRow}>
              <Button
                label={COPY.common.cancel}
                variant="secondary"
                size="lg"
                onPress={onClose}
                style={styles.actionBtn}
              />
              <Button
                label="Start Speaking"
                icon={Mic}
                variant="primary"
                size="lg"
                onPress={startCapture}
                style={styles.actionBtn}
              />
            </View>
          )}

          <Button
            label="Enter manually instead"
            variant="ghost"
            size="sm"
            onPress={() => {
              abortCapture();
              onManualFallback();
            }}
            style={styles.manualBtn}
          />
        </View>
      }
    >
      <View style={styles.stage}>
        <VoiceOrb
          size={140}
          state={orbState}
          maxDurationMs={MAX_SESSION_MS}
          onPress={handleOrbPress}
          onLongPress={() => {}}
          onPressOut={() => {}}
        />

        {orbState === 'recording' && (
          <Text style={[TYPE.title3, styles.timerText]}>
            {formattedTime} <Text style={styles.timerMax}>/ 0:30</Text>
          </Text>
        )}

        <Animated.Text
          style={[TYPE.bodySm, styles.promptText, { opacity: promptFade }]}
          numberOfLines={2}
        >
          {orbState === 'recording'
            ? `“${COPY.home.examples[promptIndex]}”`
            : orbState === 'processing'
            ? 'Analyzing speech & matching customer...'
            : 'Tap the orb to start recording'}
        </Animated.Text>

        <Badge label="Urdu or English" tone="accent" />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
    gap: SPACE.md,
  },
  timerText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  timerMax: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  promptText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    minHeight: 28,
  },
  footerContainer: {
    width: '100%',
    gap: SPACE.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
  manualBtn: {
    alignSelf: 'center',
  },
});
