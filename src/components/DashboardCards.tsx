import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface DashboardCardsProps {
  totalReceivable: number; // Aap lenge (Udhaar)
  totalPayable: number; // Aap denge (Jama)
  todayCashIn: number;
  todayCashOut: number;
  currency?: string;
  onPressReceivable?: () => void;
  onPressPayable?: () => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  totalReceivable,
  totalPayable,
  todayCashIn,
  todayCashOut,
  currency = '₹',
  onPressReceivable,
  onPressPayable,
}) => {
  const netBalance = totalReceivable - totalPayable;

  return (
    <View style={styles.container}>
      {/* Main Net Khata Card */}
      <View style={styles.netCard}>
        <View style={styles.netHeader}>
          <View style={styles.netLabelRow}>
            <Wallet size={16} color="#94a3b8" />
            <Text style={styles.netLabel}>Net Shop Ledger Balance</Text>
          </View>
          <Text style={styles.netSubtext}>Overall Udhaar Status</Text>
        </View>

        <Text style={[styles.netAmount, { color: netBalance >= 0 ? COLORS.gotGreen : COLORS.gaveRed }]}>
          {currency} {Math.abs(netBalance).toLocaleString('en-IN')}
          <Text style={styles.netSuffix}> {netBalance >= 0 ? '(Receivable)' : '(Payable)'}</Text>
        </Text>
      </View>

      {/* Split Credit/Debit Metrics */}
      <View style={styles.splitRow}>
        {/* You Will Collect (Udhaar Given) */}
        <TouchableOpacity
          style={[styles.metricCard, styles.receivableCard]}
          activeOpacity={0.8}
          onPress={onPressReceivable}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.receivableTitle}>You Will Collect</Text>
            <View style={styles.redIconCircle}>
              <ArrowUpRight size={16} color={COLORS.gaveRed} />
            </View>
          </View>
          <Text style={styles.hindiSub}>आप लेंगे (Udhaar)</Text>
          <Text style={styles.receivableAmount}>
            {currency} {totalReceivable.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>

        {/* You Will Pay (Payable to Suppliers) */}
        <TouchableOpacity
          style={[styles.metricCard, styles.payableCard]}
          activeOpacity={0.8}
          onPress={onPressPayable}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.payableTitle}>You Will Pay</Text>
            <View style={styles.greenIconCircle}>
              <ArrowDownLeft size={16} color={COLORS.gotGreen} />
            </View>
          </View>
          <Text style={styles.hindiSub}>आप देंगे (Jama)</Text>
          <Text style={styles.payableAmount}>
            {currency} {totalPayable.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Cashbook Strip */}
      <View style={styles.cashbookStrip}>
        <View style={styles.cashCol}>
          <View style={styles.cashRowTitle}>
            <TrendingUp size={14} color={COLORS.gotGreen} />
            <Text style={styles.cashLabel}>Today's Cash In</Text>
          </View>
          <Text style={styles.cashInVal}>
            + {currency} {todayCashIn.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.cashDivider} />

        <View style={styles.cashCol}>
          <View style={styles.cashRowTitle}>
            <TrendingDown size={14} color={COLORS.gaveRed} />
            <Text style={styles.cashLabel}>Today's Cash Out</Text>
          </View>
          <Text style={styles.cashOutVal}>
            - {currency} {todayCashOut.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  netCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  netHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  netLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  netSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  netAmount: {
    fontSize: 26,
    fontWeight: '800',
  },
  netSuffix: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  receivableCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#fca5a5',
  },
  payableCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receivableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
  },
  payableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  hindiSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 6,
  },
  receivableAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  payableAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  redIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbookStrip: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cashCol: {
    flex: 1,
    alignItems: 'center',
  },
  cashRowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cashLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cashInVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gotGreen,
  },
  cashOutVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gaveRed,
  },
  cashDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
});
