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
import { TrendingUp, TrendingDown, Plus, Minus, X, Calendar } from 'lucide-react-native';
import { CashbookEntry } from '../types';
import { COLORS } from '../theme/colors';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface CashbookScreenProps {
  entries: CashbookEntry[];
  currency?: string;
  language?: LanguageCode;
  onAddCashEntry: (entry: { type: 'in' | 'out'; amount: number; category: string; note: string }) => void;
}

export const CashbookScreen: React.FC<CashbookScreenProps> = ({
  entries,
  currency = 'Rs',
  language = 'en',
  onAddCashEntry,
}) => {
  const t = getTranslation(language);
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(t.sales);
  const [note, setNote] = useState('');

  const totalIn = entries
    .filter((e) => e.type === 'in')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOut = entries
    .filter((e) => e.type === 'out')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenModal = (type: 'in' | 'out') => {
    setEntryType(type);
    setCategory(type === 'in' ? t.sales : t.expense);
    setAmount('');
    setNote('');
    setModalVisible(true);
  };

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) {
      alert(t.enterAmount);
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
            <TrendingUp size={13} color={COLORS.gotGreen} />
            <Text style={styles.summaryLabel}>{t.todayCashIn}</Text>
          </View>
          <Text style={styles.valIn} numberOfLines={1}>
            + {currency} {totalIn.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryCol}>
          <View style={styles.iconLabel}>
            <TrendingDown size={13} color={COLORS.gaveRed} />
            <Text style={styles.summaryLabel}>{t.todayCashOut}</Text>
          </View>
          <Text style={styles.valOut} numberOfLines={1}>
            - {currency} {totalOut.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Entry Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnIn]}
          onPress={() => handleOpenModal('in')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.btnText}>+ {t.cashIn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnOut]}
          onPress={() => handleOpenModal('out')}
          activeOpacity={0.85}
        >
          <Minus size={16} color="#ffffff" />
          <Text style={styles.btnText}>- {t.cashOut}</Text>
        </TouchableOpacity>
      </View>

      {/* Cashbook History */}
      <Text style={styles.sectionTitle}>{t.dailyCashbook}</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {entries.map((item) => {
          const isIn = item.type === 'in';
          return (
            <View key={item.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={styles.dateRow}>
                  <Calendar size={11} color="#64748b" />
                  <Text style={styles.entryDate}>{item.date}</Text>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.entryNote} numberOfLines={2}>
                  {item.note || 'No notes'}
                </Text>
              </View>

              <Text
                style={[
                  styles.entryAmount,
                  { color: isIn ? COLORS.gotGreen : COLORS.gaveRed },
                ]}
                numberOfLines={1}
              >
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
            <View
              style={[
                styles.modalHeader,
                entryType === 'in' ? styles.headerIn : styles.headerOut,
              ]}
            >
              <Text style={styles.modalTitle}>
                {entryType === 'in' ? `+ ${t.cashIn}` : `- ${t.cashOut}`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>{t.enterAmount} ({currency})</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t.category}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sales, Rashan, Tea, Electric Bill"
                placeholderTextColor="#94a3b8"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t.itemDescriptionNote}</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional details..."
                placeholderTextColor="#94a3b8"
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  entryType === 'in' ? styles.btnIn : styles.btnOut,
                ]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>{t.saveTransaction}</Text>
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
    width: '100%',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  valIn: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  valOut: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
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
    color: '#475569',
    marginBottom: 8,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  entryLeft: {
    flex: 1,
    paddingRight: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11,
    color: '#64748b',
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  catBadgeText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
  },
  entryNote: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: '#0f172a',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
