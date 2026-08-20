import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Party } from '../types';

interface CustomerCardProps {
  party: Party;
  currency?: string;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  party,
  currency = '₹',
  onPress,
}) => {
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
      <View style={[styles.avatar, { backgroundColor: party.avatarColor || COLORS.primary }]}>
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
              {party.type === 'customer' ? 'Grahak' : 'Supplier'}
            </Text>
          </View>
        </View>

        <View style={styles.phoneRow}>
          <Phone size={12} color="#64748b" />
          <Text style={styles.phoneText}>{party.mobile}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.dateText}>{party.lastUpdated}</Text>
        </View>
      </View>

      {/* Balance Tag */}
      <View style={styles.balanceCol}>
        {isReceivable && (
          <View style={styles.receivableBadge}>
            <Text style={styles.balanceStatusRed}>Aap Lenge</Text>
            <Text style={styles.balanceAmountRed}>
              {currency} {party.currentBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {isPayable && (
          <View style={styles.payableBadge}>
            <Text style={styles.balanceStatusGreen}>Aap Denge</Text>
            <Text style={styles.balanceAmountGreen}>
              {currency} {Math.abs(party.currentBalance).toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {isSettled && (
          <View style={styles.settledBadge}>
            <Text style={styles.settledStatus}>Settled</Text>
            <Text style={styles.settledAmount}>{currency} 0</Text>
          </View>
        )}
      </View>

      <ChevronRight size={18} color="#94a3b8" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 150,
  },
  typeBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#475569',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  receivableBadge: {
    alignItems: 'flex-end',
  },
  balanceStatusRed: {
    fontSize: 10,
    color: COLORS.gaveRed,
    fontWeight: '700',
  },
  balanceAmountRed: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  payableBadge: {
    alignItems: 'flex-end',
  },
  balanceStatusGreen: {
    fontSize: 10,
    color: COLORS.gotGreen,
    fontWeight: '700',
  },
  balanceAmountGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  settledBadge: {
    alignItems: 'flex-end',
  },
  settledStatus: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  settledAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
