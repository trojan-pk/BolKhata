import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { GUTTER, MOTION, SPACE, TYPE } from '../theme/tokens';
import { Party, Transaction } from '../types';
import { ApiService } from '../services/api';
import { BalanceCard } from '../components/BalanceCard';
import { EntryRow } from '../components/EntryRow';
import { OrbState, VoiceOrb } from '../components/VoiceOrb';
import {
  Badge,
  EmptyState,
  Enter,
  SectionHeader,
  SkeletonRow,
  useFeedback,
} from '../ui';
import { todayISO } from '../utils/format';

const MAX_SESSION_MS = 30000;

interface HomeScreenProps {
  parties: Party[];
  transactions: Transaction[];
  toCollect: number;
  toPay: number;
  currency: string;
  loading?: boolean;
  onOpenVoiceReview: () => void;
  onViewAllCustomers: () => void;
  onSelectTransaction: (txn: Transaction) => void;
  onVoiceResultParsed: (result: unknown) => void;
}

/**
 * Home is a voice canvas first and a dashboard second: the orb sits where the
 * thumb naturally lands, the net position anchors the screen beneath it, and
 * recent entries confirm that what you said was actually recorded.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  parties,
  transactions,
  toCollect,
  toPay,
  currency,
  loading = false,
  onOpenVoiceReview,
  onViewAllCustomers,
  onSelectTransaction,
  onVoiceResultParsed,
}) => {
  const { width } = useWindowDimensions();
  const { toast } = useFeedback();

  const orbSize = Math.min(Math.round((width || 390) * 0.56), 216);

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [captureMode, setCaptureMode] = useState<'hold' | 'tap' | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [feedExpanded, setFeedExpanded] = useState(false);
  const promptFade = useRef(new Animated.Value(1)).current;

  /* ------------------------------------------------------- capture refs -- */
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  const capturingRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Mirrors `captureMode` for the press handlers. A hold released within a frame
   * or two of the long-press firing would otherwise read the pre-update state,
   * miss the stop, and leave recording running until the 30s timeout.
   */
  const captureModeRef = useRef<'hold' | 'tap' | null>(null);
  /**
   * The 30s auto-stop timer must call the *current* stop handler, not the one
   * captured when recording began — otherwise it closes over a stale party list.
   */
  const stopRef = useRef<() => void>(() => {});

  /* --------------------------------------------------- rotating examples -- */
  useEffect(() => {
    if (orbState !== 'idle') return;
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
    }, 4200);
    return () => clearInterval(interval);
  }, [orbState, promptFade]);

  useEffect(
    () => () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    },
    []
  );

  /* ------------------------------------------------------------- capture -- */

  const releaseWebStream = () => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }
  };

  const abortCapture = useCallback(
    (message?: string) => {
      capturingRef.current = false;
      captureModeRef.current = null;
      setOrbState('idle');
      setCaptureMode(null);
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      releaseWebStream();
      if (Platform.OS !== 'web' && audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {});
      }
      if (message) toast(message, 'error');
    },
    [audioRecorder, toast]
  );

  const startCapture = useCallback(
    async (mode: 'hold' | 'tap') => {
      if (capturingRef.current) return;

      try {
        capturingRef.current = true;
        captureModeRef.current = mode;
        setCaptureMode(mode);
        setOrbState('recording');

        sessionTimerRef.current = setTimeout(() => {
          if (capturingRef.current) stopRef.current();
        }, MAX_SESSION_MS);

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

        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          abortCapture(COPY.voice.micDenied);
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } catch (error) {
        abortCapture(COPY.voice.micDenied);
      }
    },
    [abortCapture, audioRecorder]
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
          onVoiceResultParsed(result);
        } else {
          toast(COPY.voice.failed, 'error');
          onOpenVoiceReview();
        }
      } catch (error) {
        toast(COPY.voice.failed, 'error');
        onOpenVoiceReview();
      } finally {
        setOrbState('idle');
      }
    },
    [parties, onVoiceResultParsed, onOpenVoiceReview, toast]
  );

  const stopCaptureAndParse = useCallback(async () => {
    if (!capturingRef.current) return;
    capturingRef.current = false;

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setCaptureMode(null);
    captureModeRef.current = null;
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

          if (webChunksRef.current.length === 0) {
            setOrbState('idle');
            toast(COPY.voice.tooShort, 'error');
            return;
          }

          const blob = new Blob(webChunksRef.current, { type: 'audio/webm' });
          if (blob.size < 500) {
            setOrbState('idle');
            toast(COPY.voice.tooShort, 'error');
            return;
          }

          const body = new FormData();
          body.append('audio', blob, 'entry.webm');
          await sendForParsing(body);
        };
        recorder.stop();
        return;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        setOrbState('idle');
        toast(COPY.voice.tooShort, 'error');
        return;
      }

      const body = new FormData();
      body.append('audio', {
        uri,
        name: 'entry.m4a',
        type: 'audio/m4a',
      } as any);
      await sendForParsing(body);
    } catch (error) {
      setOrbState('idle');
      toast(COPY.voice.failed, 'error');
    }
  }, [audioRecorder, sendForParsing, toast]);

  useEffect(() => {
    stopRef.current = stopCaptureAndParse;
  }, [stopCaptureAndParse]);

  /* -------------------------------------------------- press interactions -- */

  const handleLongPress = () => {
    if (orbState === 'idle') startCapture('hold');
  };

  const handlePressOut = () => {
    // Only a hold-capture ends on release; tap-capture waits for a second tap.
    if (capturingRef.current && captureModeRef.current === 'hold') {
      stopCaptureAndParse();
    }
  };

  const handlePress = () => {
    if (orbState === 'processing') return;
    if (!capturingRef.current) {
      startCapture('tap');
    } else if (captureModeRef.current === 'tap') {
      stopCaptureAndParse();
    }
  };

  /* ----------------------------------------------------------------- copy -- */

  const stageTitle =
    orbState === 'processing'
      ? COPY.home.voiceThinking
      : orbState === 'recording'
      ? captureMode === 'tap'
        ? COPY.home.voiceRecording
        : COPY.home.voiceListening
      : COPY.home.voiceIdle;

  const stageLine =
    orbState === 'processing'
      ? COPY.home.hintThinking
      : orbState === 'recording'
      ? captureMode === 'tap'
        ? COPY.home.hintTap
        : COPY.home.hintHold
      : `“${COPY.home.examples[promptIndex]}”`;

  const FEED_PREVIEW = 5;
  const recent = feedExpanded
    ? transactions.slice(0, 50)
    : transactions.slice(0, FEED_PREVIEW);
  const canExpand = transactions.length > FEED_PREVIEW;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ------------------------------------------------------ voice stage -- */}
      <View style={styles.stage}>
        <Text style={[TYPE.title1, styles.stageTitle]}>{stageTitle}</Text>

        <Animated.Text
          style={[
            TYPE.bodySm,
            styles.stageLine,
            orbState === 'idle' && { opacity: promptFade },
          ]}
          numberOfLines={2}
        >
          {stageLine}
        </Animated.Text>

        <VoiceOrb
          size={orbSize}
          state={orbState}
          maxDurationMs={MAX_SESSION_MS}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
        />

        {orbState === 'idle' ? (
          <View style={styles.stageFooter}>
            <Badge label="Urdu or English" tone="accent" />
            <Text style={[TYPE.caption, styles.stageHint]}>
              {COPY.home.hintIdle}
            </Text>
          </View>
        ) : (
          <View style={styles.stageFooter} />
        )}
      </View>

      {/* ---------------------------------------------------- net position -- */}
      <View style={styles.block}>
        <BalanceCard
          toCollect={toCollect}
          toPay={toPay}
          accounts={parties.length}
          currency={currency}
          onPressCollect={onViewAllCustomers}
          onPressPay={onViewAllCustomers}
        />
      </View>

      {/* -------------------------------------------------- recent activity -- */}
      <View style={styles.block}>
        <SectionHeader
          title={COPY.home.recentActivity}
          actionLabel={
            canExpand ? (feedExpanded ? 'Show less' : COPY.common.viewAll) : undefined
          }
          onAction={() => setFeedExpanded((prev) => !prev)}
        />

        {loading ? (
          <SkeletonRow count={3} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={COPY.home.emptyTitle}
            body={COPY.home.emptyBody}
          />
        ) : (
          <View style={styles.list}>
            {recent.map((txn, index) => (
              <Enter key={txn.id} index={index}>
                <EntryRow
                  transaction={txn}
                  currency={currency}
                  onPress={() => onSelectTransaction(txn)}
                />
              </Enter>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 132,
  },
  stage: {
    alignItems: 'center',
    paddingTop: SPACE.sm,
    paddingHorizontal: SPACE.xxl,
  },
  stageTitle: {
    textAlign: 'center',
  },
  stageLine: {
    ...TYPE.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACE.xs + 2,
    minHeight: 38,
  },
  stageFooter: {
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: 52,
    marginTop: SPACE.xs,
  },
  stageHint: {
    color: COLORS.textFaint,
    textAlign: 'center',
  },
  block: {
    paddingHorizontal: GUTTER,
    marginTop: SPACE.xxl,
  },
  list: {
    gap: SPACE.sm,
  },
});
