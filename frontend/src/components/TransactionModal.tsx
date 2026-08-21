import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Check, CreditCard, Banknote, QrCode, FileText } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { TransactionType, PaymentMode } from '../types';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface TransactionModalProps {
  visible: boolean;
  type: TransactionType;
  partyName: string;
  currency?: string;
  language?: LanguageCode;
  onClose: () => void;
  onSubmit: (data: { amount: number; note: string; paymentMode: PaymentMode }) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  type,
  partyName,
  currency = 'Rs',
  language = 'en',
  onClose,
  onSubmit,
}) => {
  const t = getTranslation(language);
  const isGave = type === 'gave';
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      alert(t.enterAmount);
      return;
    }
    onSubmit({ amount: numAmount, note: note.trim(), paymentMode });
    setAmount('');
    setNote('');
    onClose();
  };

  const paymentModes: { key: PaymentMode; label: string; icon: any }[] = [
    { key: 'cash', label: t.cash, icon: Banknote },
    { key: 'upi', label: t.onlineBank, icon: QrCode },
    { key: 'card', label: 'Card', icon: CreditCard },
    { key: 'credit', label: t.creditUdhaar, icon: FileText },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={[styles.modalHeader, isGave ? styles.gaveHeader : styles.gotHeader]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                {isGave ? t.youGaveTitle : t.youGotTitle}
              </Text>
              <Text style={styles.partySub} numberOfLines={1}>
                {t.party} {partyName}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formBody} contentContainerStyle={{ padding: 16 }}>
            {/* Amount Input */}
            <Text style={styles.fieldLabel}>{t.enterAmount} ({currency})</Text>
            <View style={styles.amountInputRow}>
              <Text
                style={[
                  styles.currencyPrefix,
                  { color: isGave ? COLORS.gaveRed : COLORS.gotGreen },
                ]}
              >
                {currency}
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: isGave ? COLORS.gaveRed : COLORS.gotGreen },
                ]}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Quick Amount Pills */}
            <View style={styles.pillsRow}>
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.pill}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={styles.pillText}>+{currency}{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Method Picker */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t.paymentMode}</Text>
            <View style={styles.modeGrid}>
              {paymentModes.map((item) => {
                const Icon = item.icon;
                const isSelected = paymentMode === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                    onPress={() => setPaymentMode(item.key)}
                  >
                    <Icon size={16} color={isSelected ? COLORS.primary : '#64748b'} />
                    <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Item Details / Note */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
              {t.itemDescriptionNote}
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. 5kg Basmati Rice, Oil packet, Cheeni..."
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isGave ? styles.submitGave : styles.submitGot]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Check size={18} color="#ffffff" />
              <Text style={styles.submitText}>
                {t.saveTransaction}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  gaveHeader: {
    backgroundColor: COLORS.gaveRed,
  },
  gotHeader: {
    backgroundColor: COLORS.gotGreen,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  partySub: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBody: {
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 54,
    fontSize: 26,
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  modeTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    color: '#0f172a',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 56,
  },
  submitButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 16,
  },
  submitGave: {
    backgroundColor: COLORS.gaveRed,
  },
  submitGot: {
    backgroundColor: COLORS.gotGreen,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
