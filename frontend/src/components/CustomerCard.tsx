import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { Party } from '../types';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface CustomerCardProps {
  party: Party;
  currency?: string;
  language?: LanguageCode;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  party,
  currency = 'Rs',
  language = 'en',
  onPress,
}) => {
  const t = getTranslation(language);
  const isReceivable = party.currentBalance > 0;
  const isPayable = party.currentBalance < 0;
  const isSettled = party.currentBalance === 0;

  const initials = party.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: party.avatarColor || COLORS.primary },
        ]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Details */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.partyName} numberOfLines={1}>
            {party.name}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {party.type === 'customer' ? t.customer : t.supplier}
            </Text>
          </View>
        </View>

        <View style={styles.phoneRow}>
          <Phone size={11} color="#64748b" />
          <Text style={styles.phoneText} numberOfLines={1}>{party.mobile}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.dateText}>{party.lastUpdated}</Text>
        </View>
      </View>

      {/* Balance Tag */}
      <View style={styles.balanceCol}>
        {isReceivable && (
          <View style={styles.badgeContainer}>
            <Text style={styles.balanceStatusRed}>{t.youWillCollect}</Text>
            <Text style={styles.balanceAmountRed} numberOfLines={1}>
              {currency} {party.currentBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {isPayable && (
          <View style={styles.badgeContainer}>
            <Text style={styles.balanceStatusGreen}>{t.youWillPay}</Text>
            <Text style={styles.balanceAmountGreen} numberOfLines={1}>
              {currency} {Math.abs(party.currentBalance).toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {isSettled && (
          <View style={styles.badgeContainer}>
            <Text style={styles.settledStatus}>{t.allSettled}</Text>
            <Text style={styles.settledAmount}>{currency} 0</Text>
          </View>
        )}
      </View>

      <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: FONTS.headingBold,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyName: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phoneText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#64748b',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  dateText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#94a3b8',
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  balanceStatusRed: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.gaveRed,
    fontWeight: '700',
  },
  balanceAmountRed: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  balanceStatusGreen: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.gotGreen,
    fontWeight: '700',
  },
  balanceAmountGreen: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  settledStatus: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  settledAmount: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
