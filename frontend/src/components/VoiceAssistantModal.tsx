import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Mic, X, Sparkles, CheckCircle, Volume2 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface VoiceAssistantModalProps {
  visible: boolean;
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
  onClose,
  onParseVoice,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [parsedData, setParsedData] = useState<{
    partyName?: string;
    amount?: number;
    type?: 'gave' | 'got';
    note?: string;
  } | null>(null);

  const sampleCommands = [
    'Ramesh ko 500 basmati rice diya',
    'Sunita Devi se 1000 jama mila',
    'Amrit Supplier ko 3200 diya',
  ];

  const handleSimulateVoice = async (phrase: string) => {
    setIsListening(true);
    setVoiceText(phrase);

    try {
      const { ApiService } = require('../services/api');
      const response = await ApiService.processVoice();
      
      if (response) {
        setParsedData({
          partyName: response.customerName,
          amount: response.amount,
          type: response.type,
          note: response.description,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsListening(false);
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
              <Text style={styles.title}>BolKhata Voice Assistant</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.subtitle}>
              Speak or tap a phrase to add a voice transaction (बोलकर खाता जोड़ें)
            </Text>

            {/* Mic Button */}
            <TouchableOpacity
              style={[styles.micBigBtn, isListening && styles.micListening]}
              onPress={() => handleSimulateVoice('Ramesh ko 500 basmati rice diya')}
              activeOpacity={0.8}
            >
              <Mic size={32} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.micText}>
                {isListening ? 'Listening...' : 'Tap & Speak'}
              </Text>
            </TouchableOpacity>

            {/* Spoken Text Box */}
            <View style={styles.inputBox}>
              <Volume2 size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.voiceTextInput}
                placeholder="Spoken entry will appear here..."
                placeholderTextColor="#94a3b8"
                value={voiceText}
                onChangeText={(t: string) => {
                  setVoiceText(t);
                  setParsedData(null);
                }}
              />
            </View>

            {/* Quick Sample Prompts */}
            <Text style={styles.sampleHeader}>Try sample store commands:</Text>
            <View style={styles.sampleGrid}>
              {sampleCommands.map((cmd, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleChip}
                  onPress={() => handleSimulateVoice(cmd)}
                >
                  <Text style={styles.sampleChipText}>"{cmd}"</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Parsed Result Box */}
            {parsedData && (
              <View style={styles.parsedCard}>
                <View style={styles.parsedHeader}>
                  <CheckCircle size={16} color={COLORS.gotGreen} />
                  <Text style={styles.parsedTitle}>Parsed Entry Ready:</Text>
                </View>

                <Text style={styles.parsedDetailText}>
                  • Party:{' '}
                  <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                    {parsedData.partyName}
                  </Text>
                  {'\n'}• Type:{' '}
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
                      ? 'You Gave (Udhaar)'
                      : 'You Received (Jama)'}
                  </Text>
                  {'\n'}• Amount:{' '}
                  <Text style={{ color: '#0f172a', fontWeight: '800' }}>
                    ₹{parsedData.amount}
                  </Text>
                </Text>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Confirm & Save Entry</Text>
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
