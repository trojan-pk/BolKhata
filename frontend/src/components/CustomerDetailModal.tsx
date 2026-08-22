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
  ArrowUpRight,
  ArrowDownLeft,
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
  onEditTransaction?: (txn: Transaction) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  visible,
  party,
  transactions,
  currency = 'Rs',
  language = 'en',
  storeName = 'BolKhata Store',
  onClose,
  onAddGave,
  onAddGot,
  onSettleUp,
  onEditTransaction,
}) => {
  if (!party) return null;

  const t = getTranslation(language);
  const partyTxns = transactions.filter((t) => t.partyId === party.id);
  const isReceivable = party.currentBalance > 0;
  const isPayable = party.currentBalance < 0;

  // WhatsApp Payment Reminder Generator
  const handleSendWhatsAppReminder = () => {
    const message = encodeURIComponent(
      `Hello ${party.name},\n\nThis is a ledger reminder from ${storeName}.\nYour total outstanding balance is ${currency} ${Math.abs(
        party.currentBalance
      ).toLocaleString('en-IN')}.\n\nKindly arrange the payment at your convenience. Thank you!`
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
        {/* Top App Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {party.name}
            </Text>
            <Text style={styles.headerPhone}>{party.mobile || 'No phone'}</Text>
          </View>

          {/* Call & WhatsApp Quick Buttons */}
          <View style={styles.headerActions}>
            {party.mobile ? (
              <>
                <TouchableOpacity style={styles.actionCircle} onPress={handlePhoneCall}>
                  <Phone size={14} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappCircle}
                  onPress={handleSendWhatsAppReminder}
                >
                  <MessageCircle size={14} color="#ffffff" />
                </TouchableOpacity>
              </>
            ) : null}
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
            <TouchableOpacity style={styles.settleBtn} onPress={onSettleUp} activeOpacity={0.8}>
              <CheckCheck size={14} color="#0f172a" />
              <Text style={styles.settleBtnText}>{t.allSettled}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* WhatsApp Reminder Strip */}
        {isReceivable && party.mobile ? (
          <TouchableOpacity
            style={styles.reminderStrip}
            onPress={handleSendWhatsAppReminder}
            activeOpacity={0.8}
          >
            <MessageCircle size={15} color="#166534" />
            <Text style={styles.reminderText}>{t.sendWhatsAppReminder}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Transactions History Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t.transactionHistory}</Text>
          <View style={styles.entryBadge}>
            <Text style={styles.entryBadgeText}>{partyTxns.length} Entries</Text>
          </View>
        </View>

        {/* Transactions List */}
        <ScrollView
          style={styles.txnList}
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {partyTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t.noTransactionsYet}</Text>
              <Text style={styles.emptySubText}>
                Tap "You Gave" or "You Got" below to record the first transaction.
              </Text>
            </View>
          ) : (
            partyTxns.map((txn) => {
              const isGave = txn.type === 'gave';
              return (
                <TouchableOpacity
                  key={txn.id}
                  style={styles.txnCard}
                  onPress={() => onEditTransaction && onEditTransaction(txn)}
                  activeOpacity={0.7}
                >
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnIconCircle,
                        isGave ? styles.gaveIconCircle : styles.gotIconCircle,
                      ]}
                    >
                      {isGave ? (
                        <ArrowUpRight size={16} color={COLORS.gaveRed} />
                      ) : (
                        <ArrowDownLeft size={16} color={COLORS.gotGreen} />
                      )}
                    </View>

                    <View style={styles.txnInfo}>
                      <Text style={styles.txnNote} numberOfLines={1}>
                        {txn.note || (isGave ? t.youGave : t.youGot)}
                      </Text>
                      <View style={styles.txnMetaRow}>
                        <Calendar size={11} color="#94a3b8" />
                        <Text style={styles.txnDate}>{txn.date || 'Today'}</Text>
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
                        { color: isGave ? '#0f172a' : COLORS.gotGreen },
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
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* BOTTOM FIXED 1-TAP GAVE & GOT ACTION BAR */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.gaveBtn]}
            onPress={onAddGave}
            activeOpacity={0.85}
          >
            <CircleMinus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>{t.youGaveBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.gotBtn]}
            onPress={onAddGot}
            activeOpacity={0.85}
          >
            <CirclePlus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>{t.youGotBtn}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  receivableBanner: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  payableBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  settledBanner: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  settleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  reminderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  entryBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  entryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  txnList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  txnIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gaveIconCircle: {
    backgroundColor: '#ffe4e6',
  },
  gotIconCircle: {
    backgroundColor: '#dcfce7',
  },
  txnInfo: {
    flex: 1,
  },
  txnNote: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  txnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txnDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  dot: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  txnMode: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  txnTag: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  gaveBtn: {
    backgroundColor: COLORS.gaveRed,
  },
  gotBtn: {
    backgroundColor: COLORS.gotGreen,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
