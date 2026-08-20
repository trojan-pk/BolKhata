import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { TrendingUp, TrendingDown, Plus, Minus, X, Calendar, Wallet } from 'lucide-react-native';
import { CashbookEntry } from '../types';
import { COLORS } from '../theme/colors';

interface CashbookScreenProps {
  entries: CashbookEntry[];
  currency?: string;
  onAddCashEntry: (entry: { type: 'in' | 'out'; amount: number; category: string; note: string }) => void;
}

export const CashbookScreen: React.FC<CashbookScreenProps> = ({
  entries,
  currency = '₹',
  onAddCashEntry,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Daily Cash Sale');
  const [note, setNote] = useState('');

  const totalIn = entries
    .filter((e) => e.type === 'in')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOut = entries
    .filter((e) => e.type === 'out')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenModal = (type: 'in' | 'out') => {
    setEntryType(type);
    setCategory(type === 'in' ? 'Daily Cash Sale' : 'Shop Expense');
    setAmount('');
    setNote('');
    setModalVisible(true);
  };

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) {
      alert('Please enter valid amount');
      return;
    }

    onAddCashEntry({
      type: entryType,
      amount: num,
      category,
      note: note.trim(),
    });

    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Metric Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <View style={styles.iconLabel}>
            <TrendingUp size={14} color={COLORS.gotGreen} />
            <Text style={styles.summaryLabel}>Total Cash In</Text>
          </View>
          <Text style={styles.valIn}>+ {currency} {totalIn.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryCol}>
          <View style={styles.iconLabel}>
            <TrendingDown size={14} color={COLORS.gaveRed} />
            <Text style={styles.summaryLabel}>Total Cash Out</Text>
          </View>
          <Text style={styles.valOut}>- {currency} {totalOut.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Entry Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnIn]}
          onPress={() => handleOpenModal('in')}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.btnText}>+ CASH IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnOut]}
          onPress={() => handleOpenModal('out')}
          activeOpacity={0.85}
        >
          <Minus size={18} color="#ffffff" />
          <Text style={styles.btnText}>- CASH OUT</Text>
        </TouchableOpacity>
      </View>

      {/* Cashbook History */}
      <Text style={styles.sectionTitle}>Daily Cash Movement Log</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {entries.map((item) => {
          const isIn = item.type === 'in';
          return (
            <View key={item.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={styles.dateRow}>
                  <Calendar size={12} color="#94a3b8" />
                  <Text style={styles.entryDate}>{item.date}</Text>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.entryNote}>{item.note || 'No notes'}</Text>
              </View>

              <Text style={[styles.entryAmount, { color: isIn ? COLORS.gotGreen : COLORS.gaveRed }]}>
                {isIn ? '+' : '-'} {currency} {item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, entryType === 'in' ? styles.headerIn : styles.headerOut]}>
              <Text style={styles.modalTitle}>
                {entryType === 'in' ? 'Record Cash In' : 'Record Cash Out / Expense'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Amount ({currency})</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Daily Cash Sale, Tea, Electric Bill"
                placeholderTextColor="#64748b"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Note / Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional details..."
                placeholderTextColor="#64748b"
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                style={[styles.saveBtn, entryType === 'in' ? styles.btnIn : styles.btnOut]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Save Cash Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  valIn: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  valOut: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnIn: {
    backgroundColor: COLORS.gotGreen,
  },
  btnOut: {
    backgroundColor: COLORS.gaveRed,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  entryLeft: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  catBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  catBadgeText: {
    fontSize: 9,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  entryNote: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerIn: {
    backgroundColor: COLORS.gotGreen,
  },
  headerOut: {
    backgroundColor: COLORS.gaveRed,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
