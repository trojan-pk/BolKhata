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
import {
  Mic,
  X,
  Sparkles,
  CircleCheck,
  Volume2,
  Send,
  AlertCircle,
  Calendar,
  User,
  Users,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getTranslation, LanguageCode } from '../i18n/translations';
import { ApiService, getApiBaseUrl } from '../services/api';
import { Party, TransactionType } from '../types';

interface VoiceAssistantModalProps {
  visible: boolean;
  currency?: string;
  language?: LanguageCode;
  parties?: Party[];
  onClose: () => void;
  onParseVoice: (result: {
    partyName: string;
    amount: number;
    type: 'gave' | 'got';
    note: string;
    date?: string;
  }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  currency = 'Rs',
  language = 'roman_ur',
  parties = [],
  onClose,
  onParseVoice,
}) => {
  const t = getTranslation(language);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');

  // Structured parsed state
  const [parseResult, setParseResult] = useState<any | null>(null);

  // Editable parsed fields for confirmation
  const [partyName, setPartyName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [txnType, setTxnType] = useState<TransactionType>('gave');
  const [reason, setReason] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);

  // Balance Inquiry state
  const [balanceInfo, setBalanceInfo] = useState<{ personName: string; balance: number } | null>(null);

  // Web MediaRecorder references
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);

  // Native expo-av recording reference
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);

  const sampleCommands = [
    'Ali ko 400 diye mobile balance ke liye',
    'Hamza ne 2000 wapis kiye',
    'Kal Ali ko 1500 diye thay bike repair ke',
    'Zain ko 2000 diye bike tube ke liye',
    'Papa se 5000 liye',
    'Ali ka hisaab batao',
  ];

  // Natural high-clarity voice feedback via Native Device Speech (Urdu / English)
  const speakNativeConfirmation = (person: string, amount: number, direction: 'gave' | 'got', reasonText?: string) => {
    try {
      Speech.stop();
      const actionUrdu = direction === 'gave' ? 'ادھار دیے گئے ہیں' : 'وصول ہوئے ہیں';
      const reasonPart = reasonText ? `، ${reasonText} کے لیے` : '';
      const textToSpeak = `${person} کے ${amount} روپے ${actionUrdu}${reasonPart}۔`;

      Speech.speak(textToSpeak, {
        language: 'ur-PK',
        pitch: 1.0,
        rate: 0.9,
        onError: () => {
          Speech.speak(`${direction === 'gave' ? 'Gave' : 'Received'} ${amount} rupees ${direction === 'gave' ? 'to' : 'from'} ${person}`, {
            language: 'en',
          });
        },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleResponse = (resData: any) => {
    if (!resData) return;
    setErrorMessage(null);
    setParseResult(resData);

    if (resData.originalText) {
      setVoiceText(resData.originalText);
    }

    // 1. Balance Inquiry Intent
    if (resData.intent === 'get_balance') {
      const pName = resData.person?.name || resData.customerName || resData.partyName || '';
      const matched = parties.find(
        (p) => p.name.toLowerCase().includes(pName.toLowerCase()) ||
               pName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matched) {
        setBalanceInfo({ personName: matched.name, balance: matched.currentBalance });
        setStatusMessage(`${matched.name} ka hisaab mil gaya:`);
        try {
          Speech.stop();
          Speech.speak(`${matched.name} ka balance ${matched.currentBalance} rupaye hai.`, { language: 'ur-PK' });
        } catch (e) {}
      } else {
        setErrorMessage(`"${pName}" aap ki customer list mein nahi mila.`);
      }
      return;
    }

    // 2. Transaction Intent
    setBalanceInfo(null);

    const nameValue =
      resData.person?.name ||
      resData.customerName ||
      resData.partyName ||
      'Customer';

    const amtValue =
      resData.transaction?.amount ??
      resData.amount ??
      0;

    const dirValue: TransactionType =
      resData.transaction?.direction === 'got' ||
      resData.type === 'got' ||
      resData.direction === 'got' ||
      resData.intent === 'ADD_PAYMENT'
        ? 'got'
        : 'gave';

    const reasonValue =
      resData.transaction?.reason ||
      resData.description ||
      resData.note ||
      '';

    const dateValue =
      resData.transaction?.date ||
      resData.date ||
      new Date().toISOString().split('T')[0];

    // Populate editable form state
    setPartyName(nameValue);
    setAmountStr(amtValue > 0 ? amtValue.toString() : '');
    setTxnType(dirValue);
    setReason(reasonValue);
    setTxnDate(dateValue);

    if (resData.ambiguous && resData.candidates && resData.candidates.length > 1) {
      setStatusMessage(`Aik se zyada "${nameValue}" milay. Please select karein:`);
    } else if (amtValue <= 0) {
      setStatusMessage(`"${nameValue}" samajh aa gaya, lekin raqam darj karein:`);
    } else {
      setStatusMessage('Voice entry parsed! Verify & confirm below:');
      // Speak natural device confirmation in clear Urdu
      speakNativeConfirmation(nameValue, amtValue, dirValue, reasonValue);
    }
  };

  const handleProcessText = async (text: string) => {
    if (!text.trim()) return;
    setIsListening(true);
    setErrorMessage(null);
    setBalanceInfo(null);
    setStatusMessage('Analyzing intent & context with AI...');
    setVoiceText(text);

    try {
      const peoplePayload = parties.map((p) => ({ id: p.id, name: p.name }));
      const response = await ApiService.processVoice({
        text,
        people: peoplePayload,
        current_date: new Date().toISOString().split('T')[0],
      });
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
      setBalanceInfo(null);
      setParseResult(null);
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
        setStatusMessage('Transcribing & Parsing with AI...');

        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');
        formData.append('people', JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name }))));
        formData.append('current_date', new Date().toISOString().split('T')[0]);

        try {
          const response = await ApiService.processVoice(formData);
          handleResponse(response);
        } catch (e: any) {
          setErrorMessage(`Voice Process Error: ${e?.message}`);
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
      setBalanceInfo(null);
      setParseResult(null);
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
      setStatusMessage('Transcribing & Resolving Intent...');

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
        formData.append('people', JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name }))));
        formData.append('current_date', new Date().toISOString().split('T')[0]);

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
      alert('Please enter or select a customer name');
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
      note: reason || voiceText,
      date: txnDate,
    });
    
    Speech.stop();
    setVoiceText('');
    setParseResult(null);
    setPartyName('');
    setAmountStr('');
    setReason('');
    onClose();
  };

  const handleCloseModal = () => {
    Speech.stop();
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
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ alignItems: 'center' }}>
            <Text style={styles.subtitle}>
              Natural Speech AI • Groq Whisper + Gemini
            </Text>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBadge}>
                <AlertCircle size={14} color="#b91c1c" />
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
                placeholder="Bol kar bole ya type karein..."
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

            {/* Ambiguity Resolver: Person Candidates Chips */}
            {parseResult?.ambiguous && parseResult.candidates && parseResult.candidates.length > 1 && (
              <View style={styles.ambiguousContainer}>
                <View style={styles.ambiguousHeader}>
                  <Users size={14} color="#b45309" />
                  <Text style={styles.ambiguousHeaderText}>Which person do you mean?</Text>
                </View>
                <View style={styles.candidateChipsRow}>
                  {parseResult.candidates.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.candidateChip,
                        partyName === c.name && styles.candidateChipActive,
                      ]}
                      onPress={() => {
                        setPartyName(c.name);
                        setParseResult({ ...parseResult, ambiguous: false });
                      }}
                    >
                      <Text
                        style={[
                          styles.candidateChipText,
                          partyName === c.name && styles.candidateChipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Balance Inquiry Result Card */}
            {balanceInfo && (
              <View style={styles.balanceInquiryCard}>
                <User size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.balancePersonName}>{balanceInfo.personName}</Text>
                  <Text style={styles.balanceStatusText}>
                    {balanceInfo.balance > 0
                      ? `Aap Lenge: ${currency} ${balanceInfo.balance.toLocaleString('en-IN')}`
                      : balanceInfo.balance < 0
                      ? `Aap Denge: ${currency} ${Math.abs(balanceInfo.balance).toLocaleString('en-IN')}`
                      : 'Hisaab Barabar Hai (0)'}
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Sample Prompts */}
            {!parseResult && !balanceInfo && (
              <>
                <Text style={styles.sampleHeader}>Natural Voice Command Examples:</Text>
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

            {/* Interactive Confirmation & Validation Form Card */}
            {parseResult && parseResult.intent !== 'get_balance' && (
              <View style={styles.parsedCard}>
                <View style={styles.parsedHeader}>
                  <CircleCheck size={16} color={COLORS.gotGreen} />
                  <Text style={styles.parsedTitle}>Transaction Confirmation</Text>
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
                <Text style={styles.fieldLabel}>Person / Customer</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={partyName}
                  onChangeText={setPartyName}
                  placeholder="e.g. Ali"
                  placeholderTextColor="#94a3b8"
                />

                {/* Amount */}
                <Text style={styles.fieldLabel}>Amount ({currency})</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    { fontWeight: '800', fontSize: 16 },
                    (!amountStr || amountStr === '0') && styles.missingFieldHighlight,
                  ]}
                  keyboardType="numeric"
                  value={amountStr}
                  onChangeText={setAmountStr}
                  placeholder="e.g. 400"
                  placeholderTextColor="#94a3b8"
                />

                {/* Free-form Reason */}
                <Text style={styles.fieldLabel}>Reason (Optional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. mobile balance, bike repair, rashan"
                  placeholderTextColor="#94a3b8"
                />

                {/* Date */}
                <View style={styles.metaRow}>
                  <Calendar size={12} color="#64748b" />
                  <Text style={styles.metaText}>Date: {txnDate}</Text>
                </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontWeight: '600',
    flex: 1,
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
  ambiguousContainer: {
    width: '100%',
    backgroundColor: '#fefce8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: 12,
  },
  ambiguousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ambiguousHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
  },
  candidateChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  candidateChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  candidateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  candidateChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  candidateChipTextActive: {
    color: '#ffffff',
  },
  balanceInquiryCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gotGreenBorder,
    marginBottom: 14,
  },
  balancePersonName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  balanceStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginTop: 2,
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
  missingFieldHighlight: {
    borderColor: COLORS.gaveRed,
    backgroundColor: '#fff5f5',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
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
