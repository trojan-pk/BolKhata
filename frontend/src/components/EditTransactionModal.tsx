import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { X, Trash2, CheckCircle2, Edit3 } from 'lucide-react-native';
import { Transaction, TransactionType } from '../types';
import { COLORS } from '../theme/colors';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  currency?: string;
  language?: LanguageCode;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete: (txnId: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  transaction,
  currency = 'Rs',
  language = 'roman_ur',
  onClose,
  onSave,
  onDelete,
}) => {
  const t = getTranslation(language);
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<TransactionType>('gave');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmountStr(transaction.amount.toString());
      setType(transaction.type);
      setDescription(transaction.note || '');
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = () => {
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onSave({
      ...transaction,
      amount: amountNum,
      type,
      note: description,
    });
    onClose();
  };

  const handleDelete = () => {
    const performDelete = () => {
      onDelete(transaction.id);
      onClose();
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you sure you want to delete this transaction?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Edit3 size={18} color={COLORS.primary} />
              <Text style={styles.title}>Edit Transaction Entry</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Type Selector (Gave / Got) */}
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'gave' && styles.typeBtnGaveActive,
                ]}
                onPress={() => setType('gave')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'gave' && styles.typeBtnTextActive,
                  ]}
                >
                  {t.youGaveBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'got' && styles.typeBtnGotActive,
                ]}
                onPress={() => setType('got')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'got' && styles.typeBtnTextActive,
                  ]}
                >
                  {t.youGotBtn}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Text style={styles.label}>Amount ({currency})</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0"
              placeholderTextColor="#94a3b8"
            />

            {/* Note / Item Description */}
            <Text style={styles.label}>Description / Item Note</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. 5kg Cheeni, Daal Mash, Bill Payment"
              placeholderTextColor="#94a3b8"
            />

            {/* Action Buttons (Save & Delete) */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color={COLORS.gaveRed} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#ffffff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
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
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: '#0f172a',
  },
  amountInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gaveRed,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
