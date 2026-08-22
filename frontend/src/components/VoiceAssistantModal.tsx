import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Sparkles,
  Check,
  Calendar,
  User,
  Tag,
  Mic,
  Volume2,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getTranslation, LanguageCode } from '../i18n/translations';
import { ApiService } from '../services/api';
import { Party, TransactionType } from '../types';

interface VoiceAssistantModalProps {
  visible: boolean;
  currency?: string;
  language?: LanguageCode;
  parties?: Party[];
  initialResult?: any;
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
  initialResult,
  onClose,
  onParseVoice,
}) => {
  const t = getTranslation(language);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');

  // Editable parsed fields
  const [partyName, setPartyName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [txnType, setTxnType] = useState<TransactionType>('gave');
  const [reason, setReason] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);

  // Balance Inquiry state
  const [balanceInfo, setBalanceInfo] = useState<{ personName: string; balance: number } | null>(null);
  const [hasResult, setHasResult] = useState(false);

  // Natural high-clarity voice feedback via Native Device Speech (Urdu / English)
  const speakNativeConfirmation = (person: string, amount: number, direction: 'gave' | 'got', reasonText?: string) => {
    try {
      const actionUrdu = direction === 'gave' ? 'ادھار دیے گئے ہیں' : 'وصول ہوئے ہیں';
      const reasonPart = reasonText ? `، ${reasonText} کے لیے` : '';
      const textToSpeak = `${person} کے ${amount} روپے ${actionUrdu}${reasonPart}۔ کھاتے میں سیو کرنے کے لیے کنفرم دبائیں۔`;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'ur-PK';
        utterance.rate = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const urVoice = voices.find(v => v.lang.includes('ur') || v.lang.includes('hi') || v.lang.includes('PK'));
        if (urVoice) utterance.voice = urVoice;
        window.speechSynthesis.speak(utterance);
        return;
      }

      Speech.stop();
      Speech.speak(textToSpeak, {
        language: 'ur-PK',
        pitch: 1.0,
        rate: 1.0,
        onError: () => {
          Speech.speak(`${direction === 'gave' ? 'Gave' : 'Received'} ${amount} rupees ${direction === 'gave' ? 'to' : 'from'} ${person}. Press confirm to save to ledger.`, {
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
    setHasResult(true);

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
        try {
          Speech.stop();
          Speech.speak(`${matched.name} ka balance ${matched.currentBalance} rupaye hai.`, { language: 'ur-PK' });
        } catch (e) {}
      } else {
        setErrorMessage(`"${pName}" customer list mein nahi mila.`);
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
      resData.direction === 'got'
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

    if (amtValue > 0) {
      speakNativeConfirmation(nameValue, amtValue, dirValue, reasonValue);
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialResult) {
        handleResponse(initialResult);
      } else {
        setHasResult(false);
        setPartyName('');
        setAmountStr('');
        setReason('');
        setVoiceText('');
      }
    }
  }, [visible, initialResult]);

  const handleConfirm = () => {
    const finalAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
    if (finalAmount <= 0) {
      setErrorMessage('Please enter a valid amount.');
      return;
    }

    onParseVoice({
      partyName: partyName.trim() || 'Customer',
      amount: finalAmount,
      type: txnType,
      note: reason.trim(),
      date: txnDate,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerBadge}>
              <Sparkles size={14} color="#0f172a" />
              <Text style={styles.headerBadgeText}>Voice Entry</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Spoken Text Quote */}
            {voiceText ? (
              <View style={styles.transcriptBox}>
                <Volume2 size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.transcriptText} numberOfLines={2}>
                  "{voiceText}"
                </Text>
              </View>
            ) : null}

            {/* Error Badge */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Balance Query Result */}
            {balanceInfo && (
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>{balanceInfo.personName}</Text>
                <Text style={styles.balanceAmount}>
                  {balanceInfo.balance > 0 ? `Lenge: ${currency} ${balanceInfo.balance.toLocaleString('en-IN')}` : `Denge: ${currency} ${Math.abs(balanceInfo.balance).toLocaleString('en-IN')}`}
                </Text>
              </View>
            )}

            {/* Main Transaction Card */}
            {!balanceInfo && (
              <View style={styles.formContainer}>
                {/* Type Selector (Gave / Got Pill Toggle) */}
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typePill,
                      txnType === 'gave' ? styles.typePillGaveActive : styles.typePillInactive,
                    ]}
                    onPress={() => setTxnType('gave')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typePillText, txnType === 'gave' && styles.typePillTextActive]}>
                      🔴 You Gave (Udhaar)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typePill,
                      txnType === 'got' ? styles.typePillGotActive : styles.typePillInactive,
                    ]}
                    onPress={() => setTxnType('got')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typePillText, txnType === 'got' && styles.typePillTextActive]}>
                      🟢 You Got (Wasool)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Big Editable Amount Header */}
                <View style={styles.amountHeroContainer}>
                  <Text style={styles.amountCurrencyPrefix}>{currency}</Text>
                  <TextInput
                    style={styles.amountHeroInput}
                    keyboardType="numeric"
                    value={amountStr}
                    onChangeText={setAmountStr}
                    placeholder="0"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>

                {/* Minimalist Input Rows */}
                <View style={styles.inputStack}>
                  {/* Person / Customer */}
                  <View style={styles.minimalInputRow}>
                    <User size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.minimalTextInput}
                      value={partyName}
                      onChangeText={setPartyName}
                      placeholder="Customer name"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  {/* Reason */}
                  <View style={styles.minimalInputRow}>
                    <Tag size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.minimalTextInput}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Note / Reason (optional)"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  {/* Date Chip */}
                  <View style={styles.dateChipRow}>
                    <Calendar size={13} color="#94a3b8" />
                    <Text style={styles.dateChipText}>{txnDate}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Primary Action Footer */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
              <Check size={18} color="#ffffff" strokeWidth={2.6} style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>Confirm & Save to Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  transcriptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  transcriptText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
  },
  formContainer: {
    width: '100%',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillGaveActive: {
    backgroundColor: '#ffe4e6',
    borderWidth: 1.5,
    borderColor: '#e11d48',
  },
  typePillGotActive: {
    backgroundColor: '#ccfbf1',
    borderWidth: 1.5,
    borderColor: '#0d9488',
  },
  typePillInactive: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },
  amountHeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  amountCurrencyPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 6,
  },
  amountHeroInput: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
  },
  inputStack: {
    gap: 10,
  },
  minimalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 10,
  },
  minimalTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  dateChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 2,
  },
  dateChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
