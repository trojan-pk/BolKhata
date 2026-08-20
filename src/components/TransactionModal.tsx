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

interface TransactionModalProps {
  visible: boolean;
  type: TransactionType;
  partyName: string;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: { amount: number; note: string; paymentMode: PaymentMode }) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  type,
  partyName,
  currency = '₹',
  onClose,
  onSubmit,
}) => {
  const isGave = type === 'gave';
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    onSubmit({ amount: numAmount, note: note.trim(), paymentMode });
    setAmount('');
    setNote('');
    onClose();
  };

  const paymentModes: { key: PaymentMode; label: string; icon: any }[] = [
    { key: 'cash', label: 'Cash', icon: Banknote },
    { key: 'upi', label: 'UPI / GPay', icon: QrCode },
    { key: 'card', label: 'Card', icon: CreditCard },
    { key: 'credit', label: 'Credit', icon: FileText },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={[styles.modalHeader, isGave ? styles.gaveHeader : styles.gotHeader]}>
            <View>
              <Text style={styles.modalTitle}>
                {isGave ? 'You Gave Money (Udhaar)' : 'You Received Money (Jama)'}
              </Text>
              <Text style={styles.partySub}>For: {partyName}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formBody} contentContainerStyle={{ padding: 16 }}>
            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Enter Amount ({currency})</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: isGave ? COLORS.gaveRed : COLORS.gotGreen }]}>
                {currency}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: isGave ? COLORS.gaveRed : COLORS.gotGreen }]}
                placeholder="0"
                placeholderTextColor="#64748b"
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
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Payment Mode</Text>
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
                    <Icon size={18} color={isSelected ? COLORS.primary : '#94a3b8'} />
                    <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Item Details / Note */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Entry Note / Items list (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. 5kg Basmati Rice, Oil packet..."
              placeholderTextColor="#64748b"
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
              <Check size={20} color="#ffffff" />
              <Text style={styles.submitText}>
                Save {isGave ? 'Udhaar' : 'Jama'} Entry
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#f8fafc',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 60,
    fontSize: 28,
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillText: {
    fontSize: 12,
    color: '#e2e8f0',
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
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  modeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modeTextSelected: {
    color: '#ffffff',
  },
  noteInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 60,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
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
    fontSize: 16,
    fontWeight: '800',
  },
});
