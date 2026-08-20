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
  PlusCircle,
  MinusCircle,
  CheckCheck,
  Calendar,
  Tag,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Party, Transaction } from '../types';

interface CustomerDetailModalProps {
  visible: boolean;
  party: Party | null;
  transactions: Transaction[];
  currency?: string;
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
  currency = '₹',
  storeName = 'Sharma General Store',
  onClose,
  onAddGave,
  onAddGot,
  onSettleUp,
}) => {
  if (!party) return null;

  const partyTxns = transactions.filter((t) => t.partyId === party.id);
  const isReceivable = party.currentBalance > 0;
  const isPayable = party.currentBalance < 0;

  // WhatsApp Payment Reminder Generator
  const handleSendWhatsAppReminder = () => {
    const message = encodeURIComponent(
      `Hello ${party.name},\n\nThis is a friendly reminder from ${storeName}.\nYour total pending balance is ${currency}${Math.abs(
        party.currentBalance
      ).toLocaleString('en-IN')}.\n\nPlease settle via UPI or cash at your convenience. Thank you!`
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
                ? 'Amount You Will Collect (Udhaar)'
                : isPayable
                ? 'Amount You Will Pay (Jama)'
                : 'Khata Balance Cleared'}
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
              <Text style={styles.settleBtnText}>Settle Up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ledger Transaction Timeline */}
        <Text style={styles.timelineHeader}>
          Ledger Entry History ({partyTxns.length})
        </Text>

        <ScrollView
          style={styles.timelineList}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {partyTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Tag size={28} color="#94a3b8" />
              <Text style={styles.emptyText}>No entries recorded yet</Text>
              <Text style={styles.emptySub}>
                Use the + Gave or + Got buttons below to record credit/cash
              </Text>
            </View>
          ) : (
            partyTxns.map((txn) => {
              const isGave = txn.type === 'gave';
              return (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={styles.txnMainRow}>
                    <View style={styles.txnLeftCol}>
                      <View style={styles.txnDateRow}>
                        <Calendar size={11} color="#64748b" />
                        <Text style={styles.txnDate}>{txn.date}</Text>
                        <View style={styles.modeBadge}>
                          <Text style={styles.modeBadgeText}>
                            {txn.paymentMode.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {txn.note ? (
                        <Text style={styles.txnNote} numberOfLines={2}>
                          {txn.note}
                        </Text>
                      ) : (
                        <Text style={styles.txnNoNote}>No note added</Text>
                      )}
                    </View>

                    {/* Amount Col */}
                    <View style={styles.txnRightCol}>
                      <Text
                        style={[
                          styles.txnAmount,
                          { color: isGave ? COLORS.gaveRed : COLORS.gotGreen },
                        ]}
                        numberOfLines={1}
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
                        {isGave ? 'Gave (Udhaar)' : 'Got (Jama)'}
                      </Text>
                    </View>
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
            <MinusCircle size={18} color="#ffffff" />
            <Text style={styles.bottomActionText}>+ YOU GAVE ({currency})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomActionBtn, styles.gotBtn]}
            onPress={onAddGot}
            activeOpacity={0.85}
          >
            <PlusCircle size={18} color="#ffffff" />
            <Text style={styles.bottomActionText}>+ YOU GOT ({currency})</Text>
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
  timelineHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  timelineList: {
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
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  txnCard: {
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
  txnMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txnLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  txnDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  txnDate: {
    fontSize: 11,
    color: '#64748b',
  },
  modeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  modeBadgeText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
  },
  txnNote: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },
  txnNoNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  txnRightCol: {
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
