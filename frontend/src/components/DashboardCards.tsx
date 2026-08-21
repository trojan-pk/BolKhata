import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface DashboardCardsProps {
  totalReceivable: number;
  totalPayable: number;
  todayCashIn: number;
  todayCashOut: number;
  currency?: string;
  language?: LanguageCode;
  onPressReceivable?: () => void;
  onPressPayable?: () => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  totalReceivable,
  totalPayable,
  todayCashIn,
  todayCashOut,
  currency = 'Rs',
  language = 'en',
  onPressReceivable,
  onPressPayable,
}) => {
  const t = getTranslation(language);
  const netBalance = totalReceivable - totalPayable;

  return (
    <View style={styles.container}>
      {/* Main Net Khata Card */}
      <View style={styles.netCard}>
        <View style={styles.netHeader}>
          <View style={styles.netLabelRow}>
            <View style={styles.iconCircle}>
              <Wallet size={15} color={COLORS.primary} />
            </View>
            <Text style={styles.netLabel}>{t.netLedgerBalance}</Text>
          </View>
          <Text style={styles.netSubtext}>{t.overallStatus}</Text>
        </View>

        <Text
          style={[
            styles.netAmount,
            { color: netBalance >= 0 ? COLORS.gotGreen : COLORS.gaveRed },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currency} {Math.abs(netBalance).toLocaleString('en-IN')}
          <Text style={styles.netSuffix}>
            {' '}
            {netBalance >= 0 ? t.receivable : t.payable}
          </Text>
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
            <Text style={styles.receivableTitle} numberOfLines={1}>
              {t.youWillCollect}
            </Text>
            <View style={styles.redIconCircle}>
              <ArrowUpRight size={14} color={COLORS.gaveRed} />
            </View>
          </View>
          <Text style={styles.hindiSub}>{t.youWillCollectSub}</Text>
          <Text
            style={styles.receivableAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
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
            <Text style={styles.payableTitle} numberOfLines={1}>
              {t.youWillPay}
            </Text>
            <View style={styles.greenIconCircle}>
              <ArrowDownLeft size={14} color={COLORS.gotGreen} />
            </View>
          </View>
          <Text style={styles.hindiSub}>{t.youWillPaySub}</Text>
          <Text
            style={styles.payableAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {currency} {totalPayable.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Cashbook Strip */}
      <View style={styles.cashbookStrip}>
        <View style={styles.cashCol}>
          <View style={styles.cashRowTitle}>
            <TrendingUp size={13} color={COLORS.gotGreen} />
            <Text style={styles.cashLabel}>{t.todayCashIn}</Text>
          </View>
          <Text style={styles.cashInVal} numberOfLines={1}>
            + {currency} {todayCashIn.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.cashDivider} />

        <View style={styles.cashCol}>
          <View style={styles.cashRowTitle}>
            <TrendingDown size={13} color={COLORS.gaveRed} />
            <Text style={styles.cashLabel}>{t.todayCashOut}</Text>
          </View>
          <Text style={styles.cashOutVal} numberOfLines={1}>
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
    width: '100%',
  },
  netCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  netSubtext: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  netAmount: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  netSuffix: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  receivableCard: {
    backgroundColor: COLORS.gaveRedBg,
    borderColor: COLORS.gaveRedBorder,
  },
  payableCard: {
    backgroundColor: COLORS.gotGreenBg,
    borderColor: COLORS.gotGreenBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receivableTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#9f1239',
    flex: 1,
  },
  payableTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  hindiSub: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 6,
  },
  receivableAmount: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
  payableAmount: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gotGreen,
  },
  redIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbookStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  cashInVal: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gotGreen,
  },
  cashOutVal: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gaveRed,
  },
  cashDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
});
