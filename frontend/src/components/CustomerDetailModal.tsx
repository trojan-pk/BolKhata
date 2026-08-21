import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import {
  X,
  Phone,
  MessageCircle,
  CirclePlus,
  CircleMinus,
  CheckCheck,
  Calendar,
  Tag,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Party, Transaction } from '../types';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface CustomerDetailModalProps {
  visible: boolean;
  party: Party | null;
  transactions: Transaction[];
  currency?: string;
  language?: LanguageCode;
  storeName?: string;
  onClose: () => void;
  onAddGave: () => void;
  onAddGot: () => void;
  onSettleUp: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  visible,
  party,
  transactions,
  currency = 'Rs',
  language = 'ur',
  storeName = 'BolKhata Store',
  onClose,
  onAddGave,
  onAddGot,
  onSettleUp,
}) => {
  if (!party) return null;

  const t = getTranslation(language);
  const partyTxns = transactions.filter((t) => t.partyId === party.id);
  const isReceivable = party.currentBalance > 0;
  const isPayable = party.currentBalance < 0;

  // WhatsApp Payment Reminder Generator
  const handleSendWhatsAppReminder = () => {
    const message = encodeURIComponent(
      `اسلام علیکم ${party.name}،\n\nیہ ${storeName} کی طرف سے کھاتہ کی یاددہانی ہے۔\nآپ کا کل بقایا بیلنس ${currency} ${Math.abs(
        party.currentBalance
      ).toLocaleString('en-IN')} ہے۔\n\nبراہ کرم ادائیگی فرما دیں۔ شکریہ!`
    );

    const url = `whatsapp://send?phone=${party.mobile}&text=${message}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${party.mobile}?text=${message}`);
    });
  };

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${party.mobile}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <X size={18} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {party.name}
            </Text>
            <Text style={styles.headerPhone}>{party.mobile}</Text>
          </View>

          {/* Call & WhatsApp Quick Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionCircle} onPress={handlePhoneCall}>
              <Phone size={15} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappCircle}
              onPress={handleSendWhatsAppReminder}
            >
              <MessageCircle size={15} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Balance Banner */}
        <View
          style={[
            styles.balanceBanner,
            isReceivable
              ? styles.receivableBanner
              : isPayable
              ? styles.payableBanner
              : styles.settledBanner,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>
              {isReceivable
                ? t.youWillCollect
                : isPayable
                ? t.youWillPay
                : t.allSettled}
            </Text>
            <Text
              style={[
                styles.balanceValue,
                {
                  color: isReceivable
                    ? COLORS.gaveRed
                    : isPayable
                    ? COLORS.gotGreen
                    : '#64748b',
                },
              ]}
              numberOfLines={1}
            >
              {currency} {Math.abs(party.currentBalance).toLocaleString('en-IN')}
            </Text>
          </View>

          {party.currentBalance !== 0 && (
            <TouchableOpacity style={styles.settleBtn} onPress={onSettleUp}>
              <CheckCheck size={14} color="#0f172a" />
              <Text style={styles.settleBtnText}>{t.allSettled}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* WhatsApp Reminder Strip */}
        {isReceivable && (
          <TouchableOpacity
            style={styles.reminderStrip}
            onPress={handleSendWhatsAppReminder}
            activeOpacity={0.8}
          >
            <MessageCircle size={15} color="#166534" />
            <Text style={styles.reminderText}>{t.sendWhatsAppReminder}</Text>
          </TouchableOpacity>
        )}

        {/* Transactions History Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t.transactionHistory}</Text>
          <Text style={styles.txnBadge}>{partyTxns.length} Entries</Text>
        </View>

        {/* Transactions List */}
        <ScrollView
          style={styles.txnList}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {partyTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t.noTransactionsYet}</Text>
            </View>
          ) : (
            partyTxns.map((txn) => {
              const isGave = txn.type === 'gave';
              return (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnIconCircle,
                        isGave ? styles.gaveIconCircle : styles.gotIconCircle,
                      ]}
                    >
                      {isGave ? (
                        <CircleMinus size={15} color={COLORS.gaveRed} />
                      ) : (
                        <CirclePlus size={15} color={COLORS.gotGreen} />
                      )}
                    </View>

                    <View style={styles.txnInfo}>
                      <Text style={styles.txnNote} numberOfLines={1}>
                        {txn.note || (isGave ? t.youGave : t.youGot)}
                      </Text>
                      <View style={styles.txnMetaRow}>
                        <Calendar size={11} color="#94a3b8" />
                        <Text style={styles.txnDate}>{txn.date}</Text>
                        {txn.paymentMode && (
                          <>
                            <Text style={styles.dot}>•</Text>
                            <Tag size={10} color="#94a3b8" />
                            <Text style={styles.txnMode}>{txn.paymentMode.toUpperCase()}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.txnRight}>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: isGave ? COLORS.gaveRed : COLORS.gotGreen },
                      ]}
                    >
                      {isGave ? '-' : '+'} {currency}{' '}
                      {txn.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.txnTag,
                        { color: isGave ? COLORS.gaveRed : COLORS.gotGreen },
                      ]}
                    >
                      {isGave ? t.youGave : t.youGot}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Entry Actions Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomActionBtn, styles.gaveBtn]}
            onPress={onAddGave}
            activeOpacity={0.85}
          >
            <CircleMinus size={18} color="#ffffff" />
            <Text style={styles.bottomActionText}>{t.youGaveBtn} ({currency})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomActionBtn, styles.gotBtn]}
            onPress={onAddGot}
            activeOpacity={0.85}
          >
            <CirclePlus size={18} color="#ffffff" />
            <Text style={styles.bottomActionText}>{t.youGotBtn} ({currency})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexShrink: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.whatsapp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  receivableBanner: {
    backgroundColor: COLORS.gaveRedBg,
    borderColor: COLORS.gaveRedBorder,
  },
  payableBanner: {
    backgroundColor: COLORS.gotGreenBg,
    borderColor: COLORS.gotGreenBorder,
  },
  settledBanner: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  reminderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  txnBadge: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  txnList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  txnLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaveIconCircle: {
    backgroundColor: COLORS.gaveRedBg,
  },
  gotIconCircle: {
    backgroundColor: COLORS.gotGreenBg,
  },
  txnInfo: {
    flex: 1,
  },
  txnNote: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  txnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  txnDate: {
    fontSize: 11,
    color: '#64748b',
  },
  dot: {
    fontSize: 10,
    color: '#94a3b8',
  },
  txnMode: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  txnTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  gaveBtn: {
    backgroundColor: COLORS.gaveRed,
  },
  gotBtn: {
    backgroundColor: COLORS.gotGreen,
  },
  bottomActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
