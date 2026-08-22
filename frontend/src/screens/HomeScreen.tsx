import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Sparkles,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../theme/colors';
import { Party, Transaction } from '../types';
import { getTranslation, LanguageCode } from '../i18n/translations';
import { ApiService } from '../services/api';
import { VoiceLogo } from '../components/VoiceLogo';
import { GoogleVoiceOrb } from '../components/GoogleVoiceOrb';

interface HomeScreenProps {
  parties: Party[];
  transactions: Transaction[];
  totalReceivable: number;
  totalPayable: number;
  currency: string;
  language: LanguageCode;
  onOpenVoice: () => void;
  onViewAllCustomers: () => void;
  onViewAllTransactions?: () => void;
  onSelectParty: (party: Party) => void;
  onSelectTransaction?: (txn: Transaction) => void;
  onVoiceResultParsed?: (result: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  parties,
  transactions,
  totalReceivable,
  totalPayable,
  currency,
  language,
  onOpenVoice,
  onViewAllCustomers,
  onViewAllTransactions,
  onSelectParty,
  onSelectTransaction,
  onVoiceResultParsed,
}) => {
  const t = getTranslation(language);
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth > 0 ? windowWidth : 390;
  const buttonSize = Math.min(Math.round(screenWidth * 0.70), 250);
  const innerCircleSize = Math.round(buttonSize * 0.84);
  const logoSize = Math.max(Math.round(buttonSize * 0.44), 68);

  // Rotating example prompts for voice recording
  const samplePrompts = [
    '“Zain ko 2000 diye bike tube ke liye”',
    '“Ali ko 400 diye mobile balance ke”',
    '“Papa se 5000 liye”',
    '“Hamza ne 2000 wapis kiye”',
    '“Ali ka hisaab batao”',
  ];

  const [promptIndex, setPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordMode, setRecordMode] = useState<'idle' | 'hold' | 'tap'>('idle');

  // Animated pulse rings
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  // Recording references
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false);
  const maxSessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (maxSessionTimeoutRef.current) {
        clearTimeout(maxSessionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRecording && !isProcessing) {
        setPromptIndex((prev) => (prev + 1) % samplePrompts.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isRecording, isProcessing]);

  // Pulse animation loop when recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.28,
              duration: 550,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1.0,
              duration: 550,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.5,
              duration: 550,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1.0,
              duration: 550,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording]);

  // --- Start Audio Recording ---
  const startAudioCapture = async () => {
    try {
      if (maxSessionTimeoutRef.current) {
        clearTimeout(maxSessionTimeoutRef.current);
      }

      // Max 30-Second Voice Session Limit
      maxSessionTimeoutRef.current = setTimeout(() => {
        if (isCapturingRef.current) {
          stopAudioCaptureAndProcess();
        }
      }, 30000);

      isCapturingRef.current = true;
      setIsRecording(true);

      if (Platform.OS === 'web') {
        let stream: MediaStream | null = null;
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!stream) {
          isCapturingRef.current = false;
          setIsRecording(false);
          setRecordMode('idle');
          onOpenVoice();
          return;
        }

        webStreamRef.current = stream;
        webAudioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        webMediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) webAudioChunksRef.current.push(e.data);
        };
        mediaRecorder.start();
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          isCapturingRef.current = false;
          setIsRecording(false);
          setRecordMode('idle');
          onOpenVoice();
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        nativeRecordingRef.current = recording;
      }
    } catch (err) {
      console.warn('Error starting audio recording:', err);
      isCapturingRef.current = false;
      setIsRecording(false);
      setRecordMode('idle');
      onOpenVoice();
    }
  };

  // --- Stop Audio Recording & Send to Parser ---
  const stopAudioCaptureAndProcess = async () => {
    if (maxSessionTimeoutRef.current) {
      clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = null;
    }
    if (!isCapturingRef.current) return;
    isCapturingRef.current = false;
    setIsRecording(false);
    setRecordMode('idle');
    setIsProcessing(true);

    try {
      if (Platform.OS === 'web') {
        if (!webMediaRecorderRef.current) {
          setIsProcessing(false);
          return;
        }
        const mediaRecorder = webMediaRecorderRef.current;

        mediaRecorder.onstop = async () => {
          if (webStreamRef.current) {
            webStreamRef.current.getTracks().forEach((t) => t.stop());
            webStreamRef.current = null;
          }
          
          if (webAudioChunksRef.current.length === 0) {
            setIsProcessing(false);
            return;
          }

          const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size < 500) {
            // Blob too small / silent
            setIsProcessing(false);
            return;
          }

          const formData = new FormData();
          formData.append('audio', audioBlob, 'mic_speech.webm');
          formData.append('people', JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name }))));
          formData.append('current_date', new Date().toISOString().split('T')[0]);

          try {
            const response: any = await ApiService.processVoice(formData);
            if (response && onVoiceResultParsed) {
              onVoiceResultParsed(response);
            } else {
              onOpenVoice();
            }
          } catch (e) {
            onOpenVoice();
          } finally {
            setIsProcessing(false);
          }
        };
        mediaRecorder.stop();
      } else {
        if (!nativeRecordingRef.current) {
          setIsProcessing(false);
          return;
        }
        const recording = nativeRecordingRef.current;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
          const formData = new FormData();
          formData.append('audio', {
            uri,
            name: 'mic_speech.m4a',
            type: 'audio/m4a',
          } as any);
          formData.append('people', JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name }))));
          formData.append('current_date', new Date().toISOString().split('T')[0]);

          const response: any = await ApiService.processVoice(formData);
          if (response && onVoiceResultParsed) {
            onVoiceResultParsed(response);
          } else {
            onOpenVoice();
          }
        }
        setIsProcessing(false);
        nativeRecordingRef.current = null;
      }
    } catch (e) {
      setIsProcessing(false);
      onOpenVoice();
    }
  };

  // --- Intentional Touch & Hold Handlers ---
  const handleLongPress = () => {
    if (!isRecording && !isProcessing) {
      setRecordMode('hold');
      startAudioCapture();
    }
  };

  const handlePressOut = () => {
    if (isRecording && recordMode === 'hold') {
      // User held and now released -> Stop and process
      stopAudioCaptureAndProcess();
    }
  };

  const handleButtonTap = () => {
    if (isProcessing) return;

    if (!isRecording) {
      // Intentional 1-tap to start recording in toggle mode
      setRecordMode('tap');
      startAudioCapture();
    } else if (recordMode === 'tap') {
      // Second tap while in tap mode -> Stop and process
      stopAudioCaptureAndProcess();
    }
  };

  const recentTransactions = transactions.slice(0, 6);

  const getTransactionIcon = (txn: Transaction) => {
    const note = (txn.note || '').toLowerCase();
    if (note.includes('coffee') || note.includes('chai') || note.includes('tea')) {
      return <Coffee size={18} color="#0d9488" />;
    }
    if (note.includes('bike') || note.includes('petrol') || note.includes('repair')) {
      return <ShoppingBag size={18} color="#0d9488" />;
    }
    if (txn.type === 'gave') {
      return <ArrowUpRight size={18} color="#e11d48" />;
    }
    return <ArrowDownLeft size={18} color="#059669" />;
  };

  const getIconBackground = (txn: Transaction) => {
    if (txn.type === 'gave') return '#ffe4e6'; // soft rose
    return '#ccfbf1'; // soft teal
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO SECTION: Seamless Clean Background */}
      <View style={styles.heroWrapper}>
        <Text style={styles.heroTitle}>
          {isRecording
            ? recordMode === 'tap'
              ? 'Recording (Tap to Stop)'
              : 'Listening...'
            : isProcessing
            ? 'Processing Voice...'
            : 'Tap or Hold to Record'}
        </Text>

        <Text
          style={[
            styles.heroSubtitle,
            isRecording && { color: '#e11d48', fontWeight: '800' },
          ]}
        >
          {isRecording
            ? recordMode === 'tap'
              ? 'Speak naturally • Tap button when finished'
              : 'Release button when you are done speaking'
            : isProcessing
            ? 'Transcribing & parsing with AI...'
            : samplePrompts[promptIndex]}
        </Text>

        {/* GOOGLE RECOGNITION STYLE VOICE ORB: ZERO SOLID FILL, ROTATING GRADIENT RING */}
        <GoogleVoiceOrb
          size={buttonSize}
          isRecording={isRecording}
          isProcessing={isProcessing}
          onPress={handleButtonTap}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
        />

        <Text style={styles.holdInstructionHint}>
          {isRecording
            ? recordMode === 'tap'
              ? 'Tap center button to finish & save'
              : 'Speaking... Release button to finish'
            : 'Hold to speak • or Tap once to start/pause'}
        </Text>
      </View>

      {/* COMPACT KPI METRIC CHIPS (Receivable & Payable Summary) */}
      <View style={styles.kpiRow}>
        <TouchableOpacity
          style={styles.kpiCard}
          onPress={onViewAllCustomers}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconDot, { backgroundColor: COLORS.gotGreenBg }]}>
              <TrendingUp size={14} color={COLORS.gotGreen} />
            </View>
            <Text style={styles.kpiLabel}>{t.youWillCollect}</Text>
          </View>
          <Text style={[styles.kpiValue, { color: COLORS.gotGreen }]}>
            {currency} {totalReceivable.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={onViewAllCustomers}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconDot, { backgroundColor: COLORS.gaveRedBg }]}>
              <TrendingDown size={14} color={COLORS.gaveRed} />
            </View>
            <Text style={styles.kpiLabel}>{t.youWillPay}</Text>
          </View>
          <Text style={[styles.kpiValue, { color: COLORS.gaveRed }]}>
            {currency} {totalPayable.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FLOATING RECENT ENTRIES CARD */}
      <View style={styles.recentEntriesCard}>
        <View style={styles.recentEntriesHeader}>
          <Text style={styles.recentEntriesTitle}>Recent Entry</Text>
          <TouchableOpacity
            onPress={onViewAllTransactions || onViewAllCustomers}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllLink}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Sparkles size={24} color="#94a3b8" />
            </View>
            <Text style={styles.emptyStateTitle}>No entries recorded yet</Text>
            <Text style={styles.emptyStateSub}>
              Tap or hold the giant mic above to record your first ledger entry!
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {recentTransactions.map((txn, index) => {
              const matchedParty = parties.find((p) => p.id === txn.partyId);
              const isGave = txn.type === 'gave';

              return (
                <TouchableOpacity
                  key={txn.id || index}
                  style={styles.entryRowCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (onSelectTransaction) {
                      onSelectTransaction(txn);
                    } else if (matchedParty) {
                      onSelectParty(matchedParty);
                    }
                  }}
                >
                  {/* Left Icon Badge */}
                  <View
                    style={[
                      styles.entryIconBadge,
                      { backgroundColor: getIconBackground(txn) },
                    ]}
                  >
                    {getTransactionIcon(txn)}
                  </View>

                  {/* Middle Info */}
                  <View style={styles.entryDetails}>
                    <Text style={styles.entryPartyName} numberOfLines={1}>
                      {txn.partyName || matchedParty?.name || 'Customer'}
                    </Text>

                    <View style={styles.entryTagRow}>
                      {/* Dark Tag Badge */}
                      <View
                        style={[
                          styles.darkTag,
                          isGave ? styles.gaveTag : styles.gotTag,
                        ]}
                      >
                        <Text style={styles.darkTagText}>
                          {isGave ? 'UDHAAR' : 'WASOOL'}
                        </Text>
                      </View>

                      {/* Reason / Note Text */}
                      {txn.note ? (
                        <Text style={styles.entryReasonText} numberOfLines={1}>
                          {txn.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Right Amount & Timestamp */}
                  <View style={styles.entryRightCol}>
                    <Text
                      style={[
                        styles.entryAmount,
                        isGave ? styles.amountGave : styles.amountGot,
                      ]}
                    >
                      {isGave ? '-' : '+'}
                      {currency} {txn.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.entryDateText}>
                      {txn.date || 'Today'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  /* Hero Top Section */
  heroWrapper: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    minHeight: 20,
  },
  /* Giant Mic Button & Concentric Pulse Rings */
  micButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
  pulseRingOuter: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  pulseRingInner: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.26)',
  },
  giantMicButton: {
    borderRadius: 9999,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  giantMicButtonRecording: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
    borderWidth: 3,
  },
  giantMicButtonProcessing: {
    backgroundColor: '#6366f1',
  },
  giantMicInnerCircle: {
    borderRadius: 9999,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  giantMicInnerRecording: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  holdInstructionHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  /* KPI Summary Chips */
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  kpiIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  /* Floating Recent Entries Card */
  recentEntriesCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  recentEntriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recentEntriesTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d9488',
  },
  entriesList: {
    gap: 10,
  },
  entryRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  entryIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
    marginRight: 8,
  },
  entryPartyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  entryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  darkTag: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gaveTag: {
    backgroundColor: '#1e293b',
  },
  gotTag: {
    backgroundColor: '#0f172a',
  },
  darkTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  entryReasonText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  entryRightCol: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  amountGave: {
    color: '#0f172a',
  },
  amountGot: {
    color: '#059669',
  },
  entryDateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  /* Empty state */
  emptyStateContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 240,
  },
});
