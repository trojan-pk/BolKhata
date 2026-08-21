import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Mic, X, Sparkles, CircleCheck, Volume2, Send, Edit2 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Audio } from 'expo-av';
import { getTranslation, LanguageCode } from '../i18n/translations';
import { ApiService, getApiBaseUrl } from '../services/api';
import { TransactionType } from '../types';

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
  language = 'roman_ur',
  onClose,
  onParseVoice,
}) => {
  const t = getTranslation(language);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');

  // Editable parsed fields
  const [partyName, setPartyName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [txnType, setTxnType] = useState<TransactionType>('gave');
  const [note, setNote] = useState('');
  const [hasParsedEntry, setHasParsedEntry] = useState(false);

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

  const handleResponse = (resData: any) => {
    if (resData) {
      setErrorMessage(null);
      setStatusMessage('Spoken entry transcribed & parsed! You can edit details below:');
      
      if (resData.originalText) {
        setVoiceText(resData.originalText);
      }
      
      setPartyName(resData.customerName || resData.partyName || 'Customer');
      setAmountStr((resData.amount || 0).toString());
      setTxnType(resData.type || 'gave');
      setNote(resData.description || resData.note || '');
      setHasParsedEntry(true);

      if (resData.audioBase64) {
        try {
          const sound = new Audio.Sound();
          sound.loadAsync({ uri: `data:audio/wav;base64,${resData.audioBase64}` }).then(() => {
            sound.playAsync();
          });
        } catch (audioErr) {
          // ignore
        }
      }
    }
  };

  const handleProcessText = async (text: string) => {
    if (!text.trim()) return;
    setIsListening(true);
    setErrorMessage(null);
    setStatusMessage('Processing text command...');
    setVoiceText(text);

    try {
      const response = await ApiService.processVoice({ text });
      handleResponse(response);
    } catch (e: any) {
      setErrorMessage(`Error: ${e?.message || 'Could not connect to voice server'}`);
    } finally {
      setIsListening(false);
    }
  };

  // Start web audio recording
  const startWebRecording = async () => {
    try {
      setErrorMessage(null);
      setStatusMessage('Listening to microphone...');
      let stream: MediaStream | null = null;

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (!stream) {
        setErrorMessage('Microphone not accessible. Please type or tap a sample command.');
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
      setVoiceText('');
      setHasParsedEntry(false);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or not found.');
    }
  };

  // Stop web audio recording
  const stopWebRecording = async () => {
    if (!webMediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = webMediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecordingState(false);
        setIsListening(true);
        setStatusMessage('Transcribing speech with Whisper STT...');

        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');

        try {
          const response = await ApiService.processVoice(formData);
          handleResponse(response);
        } catch (e: any) {
          setErrorMessage(`STT Upload Failed: ${e?.message}`);
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
      setErrorMessage(null);
      setStatusMessage('Recording speech on mobile...');
      
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Microphone permission denied. Please enable in settings.');
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
      setVoiceText('');
      setHasParsedEntry(false);
    } catch (err: any) {
      setErrorMessage(`Mic init error: ${err?.message || err}`);
    }
  };

  // Stop Native Mobile Recording (Android / iOS)
  const stopNativeRecording = async () => {
    if (!nativeRecordingRef.current) return;

    try {
      setIsRecordingState(false);
      setIsListening(true);
      setStatusMessage('Sending audio to Groq Whisper STT on PC...');

      const recording = nativeRecordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: 'speech.m4a',
          type: 'audio/m4a',
        } as any);

        const response = await ApiService.processVoice(formData);
        handleResponse(response);
      } else {
        setErrorMessage('No audio recorded from device.');
      }
    } catch (e: any) {
      setErrorMessage(`API Connection Error to ${getApiBaseUrl()}: ${e?.message}`);
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
    const parsedAmount = parseFloat(amountStr) || 0;
    if (!partyName.trim()) {
      alert('Please enter or verify customer name');
      return;
    }
    if (parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onParseVoice({
      partyName: partyName.trim(),
      amount: parsedAmount,
      type: txnType,
      note: note || voiceText,
    });
    
    setVoiceText('');
    setHasParsedEntry(false);
    onClose();
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

          <ScrollView style={styles.body} contentContainerStyle={{ alignItems: 'center' }}>
            <Text style={styles.subtitle}>
              Endpoint: {getApiBaseUrl()}
            </Text>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBadge}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Status Message */}
            {statusMessage && !errorMessage && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}

            {/* Mic Button */}
            <TouchableOpacity
              style={[
                styles.micBigBtn,
                isRecordingState && styles.micRecording,
                isListening && styles.micListening,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.8}
              disabled={isListening}
            >
              {isListening ? (
                <ActivityIndicator color="#ffffff" size="large" />
              ) : (
                <Mic size={32} color="#ffffff" strokeWidth={2.5} />
              )}
              <Text style={styles.micText}>
                {isRecordingState
                  ? 'Recording... Tap to Stop'
                  : isListening
                  ? 'Processing Speech...'
                  : 'Tap to Speak'}
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
                onChangeText={setVoiceText}
                onSubmitEditing={() => handleProcessText(voiceText)}
              />
              {voiceText.length > 0 && !isListening && !isRecordingState && (
                <TouchableOpacity onPress={() => handleProcessText(voiceText)}>
                  <Send size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Sample Prompts */}
            {!hasParsedEntry && (
              <>
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
              </>
            )}

            {/* Interactive Editable Parsed Result Card */}
            {hasParsedEntry && (
              <View style={styles.parsedCard}>
                <View style={styles.parsedHeader}>
                  <CircleCheck size={16} color={COLORS.gotGreen} />
                  <Text style={styles.parsedTitle}>Verify & Edit Entry Details</Text>
                </View>

                {/* Gave / Got Toggle */}
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      txnType === 'gave' && styles.typeBtnGaveActive,
                    ]}
                    onPress={() => setTxnType('gave')}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        txnType === 'gave' && styles.typeBtnTextActive,
                      ]}
                    >
                      {t.youGaveBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      txnType === 'got' && styles.typeBtnGotActive,
                    ]}
                    onPress={() => setTxnType('got')}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        txnType === 'got' && styles.typeBtnTextActive,
                      ]}
                    >
                      {t.youGotBtn}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Customer Name */}
                <Text style={styles.fieldLabel}>{t.party}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={partyName}
                  onChangeText={setPartyName}
                  placeholder="Customer Name"
                  placeholderTextColor="#94a3b8"
                />

                {/* Amount */}
                <Text style={styles.fieldLabel}>{t.amount} ({currency})</Text>
                <TextInput
                  style={[styles.fieldInput, { fontWeight: '800', fontSize: 16 }]}
                  keyboardType="numeric"
                  value={amountStr}
                  onChangeText={setAmountStr}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                />

                {/* Note */}
                <Text style={styles.fieldLabel}>Item / Note</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Udhaar Entry"
                  placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>{t.confirmAndSave}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
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
    width: '100%',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    width: '100%',
  },
  statusText: {
    fontSize: 11,
    color: '#1d4ed8',
    textAlign: 'center',
    fontWeight: '600',
  },
  micBigBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micRecording: {
    backgroundColor: COLORS.gaveRed,
  },
  micListening: {
    backgroundColor: '#6366f1',
  },
  micText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  inputBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
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
    marginBottom: 12,
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
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  parsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  parsedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeBtnGaveActive: {
    backgroundColor: '#fef2f2',
    borderColor: COLORS.gaveRed,
  },
  typeBtnGotActive: {
    backgroundColor: '#f0fdf4',
    borderColor: COLORS.gotGreen,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: '#0f172a',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: COLORS.gotGreen,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
