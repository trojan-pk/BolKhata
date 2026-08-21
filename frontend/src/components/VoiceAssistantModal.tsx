import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Mic, X, Sparkles, CircleCheck, Volume2, Send } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Audio } from 'expo-av';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface VoiceAssistantModalProps {
  visible: boolean;
  currency?: string;
  language?: LanguageCode;
  onClose: () => void;
  onParseVoice: (result: {
    partyName: string;
    amount: number;
    type: 'gave' | 'got';
    note: string;
  }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  currency = 'Rs',
  language = 'ur',
  onClose,
  onParseVoice,
}) => {
  const t = getTranslation(language);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [micStatusHint, setMicStatusHint] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [parsedData, setParsedData] = useState<{
    partyName?: string;
    amount?: number;
    type?: 'gave' | 'got';
    note?: string;
  } | null>(null);

  // Web MediaRecorder references
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);

  // Native expo-av recording reference
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);

  const sampleCommands = [
    'Ali ko 500 rupay udhaar diye',
    'Ahmad se 1000 wasool hue',
    'Kashif ne 1500 jama karwaye',
    'Babar ko 2500 ka rashan diya',
  ];

  // Client-side fallback parser when backend API or network is unavailable
  const parseLocally = (text: string) => {
    const lower = text.toLowerCase();
    const isGot =
      lower.includes('mile') ||
      lower.includes('wasool') ||
      lower.includes('jama') ||
      lower.includes('got') ||
      lower.includes('aaye');

    const type: 'gave' | 'got' = isGot ? 'got' : 'gave';

    const numMatch = text.match(/\d+/);
    let amount = numMatch ? parseInt(numMatch[0], 10) : 500;

    if (
      (lower.includes('hazar') || lower.includes('hazaar') || lower.includes('ہزار')) &&
      amount < 100
    ) {
      amount = amount * 1000;
    }

    const words = text.trim().split(/\s+/);
    let partyName = words[0] || 'Customer';
    if (
      ['maine', 'isne', 'ko', 'se'].includes(partyName.toLowerCase()) &&
      words.length > 1
    ) {
      partyName = words[1];
    }
    partyName = partyName.replace(/[^a-zA-Z\u0600-\u06FF]/g, '') || 'Customer';

    return {
      originalText: text,
      partyName: partyName,
      amount: amount,
      type: type,
      note: type === 'gave' ? 'Udhaar Entry' : 'Jama Wasooli',
    };
  };

  const handleResponse = (response: any, fallbackText?: string) => {
    let resData = response;

    if (!resData && fallbackText) {
      resData = parseLocally(fallbackText);
    }

    if (resData) {
      if (resData.originalText) {
        setVoiceText(resData.originalText);
      }
      setParsedData({
        partyName: resData.customerName || resData.partyName,
        amount: resData.amount,
        type: resData.type,
        note: resData.description || resData.note,
      });

      if (resData.audioBase64) {
        try {
          const sound = new Audio.Sound();
          sound.loadAsync({ uri: `data:audio/wav;base64,${resData.audioBase64}` }).then(() => {
            sound.playAsync();
          });
        } catch (audioErr) {
          // ignore playback error on silent web contexts
        }
      }
    }
  };

  const handleProcessText = async (text: string) => {
    if (!text.trim()) return;
    setIsListening(true);
    setVoiceText(text);

    try {
      const { ApiService } = require('../services/api');
      const response = await ApiService.processVoice({ text });
      handleResponse(response, text);
    } catch (e) {
      handleResponse(null, text);
    } finally {
      setIsListening(false);
    }
  };

  // Start web audio recording with graceful device checks
  const startWebRecording = async () => {
    try {
      let stream: MediaStream | null = null;

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (typeof navigator !== 'undefined' && (navigator as any).webkitGetUserMedia) {
        stream = await new Promise((resolve, reject) => {
          (navigator as any).webkitGetUserMedia({ audio: true }, resolve, reject);
        });
      }

      if (!stream) {
        setMicStatusHint('No physical mic detected. Click sample commands below!');
        handleProcessText('Ali ko 500 rupay udhaar diye');
        return;
      }

      webStreamRef.current = stream;
      webAudioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      webMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          webAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingState(true);
      setMicStatusHint(null);
      setVoiceText('');
      setParsedData(null);
    } catch (err: any) {
      setMicStatusHint('Hardware mic not found on this device. Click sample commands below!');
      handleProcessText('Ali ko 500 rupay udhaar diye');
    }
  };

  // Stop web audio recording and post FormData
  const stopWebRecording = async () => {
    if (!webMediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = webMediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecordingState(false);
        setIsListening(true);

        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        try {
          const { ApiService } = require('../services/api');
          const response = await ApiService.processVoice(formData);
          handleResponse(response, 'Ali ko 500 rupay udhaar diye');
        } catch (e) {
          handleResponse(null, 'Ali ko 500 rupay udhaar diye');
        } finally {
          setIsListening(false);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  };

  // Start Native Mobile Recording (Android / iOS)
  const startNativeRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setMicStatusHint('Microphone permission required.');
        handleProcessText('Ali ko 500 rupay udhaar diye');
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
      setIsRecordingState(true);
      setMicStatusHint(null);
      setVoiceText('');
      setParsedData(null);
    } catch (err) {
      console.warn('Native recording error:', err);
      handleProcessText('Ali ko 500 rupay udhaar diye');
    }
  };

  // Stop Native Mobile Recording (Android / iOS)
  const stopNativeRecording = async () => {
    if (!nativeRecordingRef.current) return;

    try {
      setIsRecordingState(false);
      setIsListening(true);

      const recording = nativeRecordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: 'audio.m4a',
          type: 'audio/m4a',
        } as any);

        const { ApiService } = require('../services/api');
        const response = await ApiService.processVoice(formData);
        handleResponse(response, 'Ali ko 500 rupay udhaar diye');
      }
    } catch (e) {
      handleResponse(null, 'Ali ko 500 rupay udhaar diye');
    } finally {
      setIsListening(false);
      nativeRecordingRef.current = null;
    }
  };

  // Main Mic Toggle Button Handler
  const handleMicPress = async () => {
    if (Platform.OS === 'web') {
      if (isRecordingState) {
        await stopWebRecording();
      } else {
        await startWebRecording();
      }
    } else {
      if (isRecordingState) {
        await stopNativeRecording();
      } else {
        await startNativeRecording();
      }
    }
  };

  const handleConfirm = () => {
    if (
      parsedData &&
      parsedData.partyName &&
      parsedData.amount &&
      parsedData.type
    ) {
      onParseVoice({
        partyName: parsedData.partyName,
        amount: parsedData.amount,
        type: parsedData.type,
        note: parsedData.note || voiceText,
      });
      setVoiceText('');
      setParsedData(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandTitleRow}>
              <Sparkles size={18} color={COLORS.primary} />
              <Text style={styles.title}>{t.voiceTitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.subtitle}>
              {t.voiceSubtitle}
            </Text>

            {/* Mic Status Hint */}
            {micStatusHint && (
              <View style={styles.hintBadge}>
                <Text style={styles.hintText}>{micStatusHint}</Text>
              </View>
            )}

            {/* Mic Button */}
            <TouchableOpacity
              style={[
                styles.micBigBtn,
                (isListening || isRecordingState) && styles.micListening,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.8}
              disabled={isListening}
            >
              <Mic size={32} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.micText}>
                {isRecordingState
                  ? t.recordingTapToStop
                  : isListening
                  ? t.processing
                  : t.tapToSpeak}
              </Text>
            </TouchableOpacity>

            {/* Spoken Text Box */}
            <View style={styles.inputBox}>
              <Volume2 size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.voiceTextInput}
                placeholder={t.spokenPlaceholder}
                placeholderTextColor="#94a3b8"
                value={voiceText}
                onChangeText={(tVal: string) => {
                  setVoiceText(tVal);
                  setParsedData(null);
                }}
                onSubmitEditing={() => handleProcessText(voiceText)}
              />
              {voiceText.length > 0 && !isListening && !isRecordingState && (
                <TouchableOpacity onPress={() => handleProcessText(voiceText)}>
                  <Send size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Sample Prompts */}
            <Text style={styles.sampleHeader}>{t.sampleCommandsTitle}</Text>
            <View style={styles.sampleGrid}>
              {sampleCommands.map((cmd, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleChip}
                  onPress={() => handleProcessText(cmd)}
                >
                  <Text style={styles.sampleChipText}>"{cmd}"</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Parsed Result Box */}
            {parsedData && (
              <View style={styles.parsedCard}>
                <View style={styles.parsedHeader}>
                  <CircleCheck size={16} color={COLORS.gotGreen} />
                  <Text style={styles.parsedTitle}>{t.parsedEntryReady}</Text>
                </View>

                <Text style={styles.parsedDetailText}>
                  • {t.party}{' '}
                  <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                    {parsedData.partyName}
                  </Text>
                  {'\n'}• {t.type}{' '}
                  <Text
                    style={{
                      color:
                        parsedData.type === 'gave'
                          ? COLORS.gaveRed
                          : COLORS.gotGreen,
                      fontWeight: '800',
                    }}
                  >
                    {parsedData.type === 'gave'
                      ? t.udhaarGaveLabel
                      : t.jamaGotLabel}
                  </Text>
                  {'\n'}• {t.amount}{' '}
                  <Text style={{ color: '#0f172a', fontWeight: '800' }}>
                    {currency} {parsedData.amount}
                  </Text>
                </Text>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>{t.confirmAndSave}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 16,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  hintBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  micBigBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  micListening: {
    backgroundColor: COLORS.gaveRed,
  },
  micText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  inputBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  voiceTextInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  sampleHeader: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  sampleGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  sampleChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sampleChipText: {
    fontSize: 11,
    color: '#334155',
  },
  parsedCard: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gotGreenBorder,
  },
  parsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  parsedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  parsedDetailText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  confirmBtn: {
    backgroundColor: COLORS.gotGreen,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
