import React, { useState } from 'react';
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
import { createAudioPlayer, useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
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
  const [voiceText, setVoiceText] = useState('');
  const [parsedData, setParsedData] = useState<{
    partyName?: string;
    amount?: number;
    type?: 'gave' | 'got';
    note?: string;
  } | null>(null);

  const sampleCommands = [
    'Ali ko 500 rupay udhaar diye',
    'Ahmad se 1000 wasool hue',
    'Kashif ne 1500 jama karwaye',
    'Babar ko 2500 ka rashan diya',
  ];

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleResponse = (response: any) => {
    if (response) {
      if (response.originalText) {
        setVoiceText(response.originalText);
      }
      setParsedData({
        partyName: response.customerName || response.partyName,
        amount: response.amount,
        type: response.type,
        note: response.description || response.note,
      });

      if (response.audioBase64) {
        try {
          const player = createAudioPlayer({
            uri: `data:audio/wav;base64,${response.audioBase64}`,
          });
          player.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) player.remove();
          });
          player.play();
        } catch (audioErr) {
          console.error('Failed to play TTS audio:', audioErr);
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
      handleResponse(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsListening(false);
    }
  };

  const handleMicPress = async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setIsListening(true);
        try {
          const formData = new FormData();
          if (Platform.OS === 'web') {
            const fileResponse = await fetch(uri);
            const blob = await fileResponse.blob();
            formData.append('audio', blob, 'audio.webm');
          } else {
            formData.append('audio', {
              uri,
              name: 'audio.m4a',
              type: 'audio/m4a',
            } as any);
          }
          const { ApiService } = require('../services/api');
          const response = await ApiService.processVoice(formData);
          handleResponse(response);
        } catch (e) {
          console.error(e);
        } finally {
          setIsListening(false);
        }
      }
    } else {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.granted) {
        setVoiceText('');
        setParsedData(null);
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
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

            {/* Mic Button */}
            <TouchableOpacity
              style={[
                styles.micBigBtn,
                (isListening || audioRecorder.isRecording) && styles.micListening,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.8}
              disabled={isListening}
            >
              <Mic size={32} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.micText}>
                {audioRecorder.isRecording
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
              {voiceText.length > 0 && !isListening && !audioRecorder.isRecording && (
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
    marginBottom: 16,
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
