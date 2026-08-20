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

  const handleSimulateVoice = (phrase: string) => {
    setIsListening(true);
    setVoiceText(phrase);

    setTimeout(() => {
      setIsListening(false);
      // Smart voice parsing logic
      const isGot = phrase.toLowerCase().includes('jama') || phrase.toLowerCase().includes('mila');
      const isGave = phrase.toLowerCase().includes('diya') || phrase.toLowerCase().includes('udhaar');

      const numbers = phrase.match(/\d+/g);
      const amount = numbers ? parseInt(numbers[0]) : 500;

      let partyName = 'Ramesh Kumar (Grocery)';
      if (phrase.includes('Sunita')) partyName = 'Sunita Devi';
      if (phrase.includes('Amrit')) partyName = 'Amrit Rice Supplier';

      setParsedData({
        partyName,
        amount,
        type: isGot ? 'got' : 'gave',
        note: phrase,
      });
    }, 1200);
  };

  const handleConfirm = () => {
    if (parsedData && parsedData.partyName && parsedData.amount && parsedData.type) {
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
              <Sparkles size={20} color={COLORS.gotGreen} />
              <Text style={styles.title}>BolKhata Voice Assistant</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.subtitle}>
              Speak or tap a phrase to add a voice transaction (बोलकर खाता जोड़ें)
            </Text>

            {/* Glowing Mic Button */}
            <TouchableOpacity
              style={[styles.micBigBtn, isListening && styles.micListening]}
              onPress={() => handleSimulateVoice('Ramesh ko 500 basmati rice diya')}
              activeOpacity={0.8}
            >
              <Mic size={36} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.micText}>
                {isListening ? 'Listening...' : 'Tap & Speak'}
              </Text>
            </TouchableOpacity>

            {/* Voice Input Box */}
            <View style={styles.inputBox}>
              <Volume2 size={18} color="#60a5fa" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.voiceTextInput}
                placeholder="Spoken entry will appear here..."
                placeholderTextColor="#64748b"
                value={voiceText}
                onChangeText={(t: string) => {
                  setVoiceText(t);
                  setParsedData(null);
                }}
              />
            </View>

            {/* Quick Sample Prompts */}
            <Text style={styles.sampleHeader}>Try sample store voice commands:</Text>
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
                  <CheckCircle size={18} color={COLORS.gotGreen} />
                  <Text style={styles.parsedTitle}>Parsed Entry Ready:</Text>
                </View>

                <Text style={styles.parsedDetailText}>
                  • Party: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{parsedData.partyName}</Text>{'\n'}
                  • Type:{' '}
                  <Text
                    style={{
                      color: parsedData.type === 'gave' ? COLORS.gaveRed : COLORS.gotGreen,
                      fontWeight: '800',
                    }}
                  >
                    {parsedData.type === 'gave' ? 'You Gave (Udhaar)' : 'You Received (Jama)'}
                  </Text>{'\n'}
                  • Amount:{' '}
                  <Text style={{ color: '#ffffff', fontWeight: '800' }}>₹{parsedData.amount}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 16,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  micBigBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.gotGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.gotGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
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
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  voiceTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  sampleHeader: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  sampleGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  sampleChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sampleChipText: {
    fontSize: 12,
    color: '#38bdf8',
  },
  parsedCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gotGreen,
  },
  parsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  parsedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gotGreen,
  },
  parsedDetailText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: COLORS.gotGreen,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
