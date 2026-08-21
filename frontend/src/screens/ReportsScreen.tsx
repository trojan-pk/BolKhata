import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Download } from 'lucide-react-native';
import { Party } from '../types';
import { COLORS } from '../theme/colors';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface ReportsScreenProps {
  parties: Party[];
  currency?: string;
  language?: LanguageCode;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  parties,
  currency = 'Rs',
  language = 'ur',
}) => {
  const t = getTranslation(language);
  const debtors = parties.filter((p) => p.currentBalance > 0);
  const creditors = parties.filter((p) => p.currentBalance < 0);

  const totalUdhaar = debtors.reduce((sum, p) => sum + p.currentBalance, 0);
  const totalJama = creditors.reduce((sum, p) => sum + Math.abs(p.currentBalance), 0);

  const handleExportPDF = () => {
    alert(t.downloadPdf);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Action Header */}
      <View style={styles.actionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>{t.reportsTitle}</Text>
          <Text style={styles.pageSub}>{t.reportsSubtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportPDF}
          activeOpacity={0.85}
        >
          <Download size={15} color="#ffffff" />
          <Text style={styles.exportBtnText}>{t.downloadPdf}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{t.totalMarketUdhaar}</Text>
          <Text style={styles.metricValRed} numberOfLines={1}>
            {debtors.length} Parties
          </Text>
          <Text style={styles.metricSub} numberOfLines={1}>
            {currency} {totalUdhaar.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{t.totalSupplierPayable}</Text>
          <Text style={styles.metricValGreen} numberOfLines={1}>
            {creditors.length} Parties
          </Text>
          <Text style={styles.metricSub} numberOfLines={1}>
            {currency} {totalJama.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Top Pending Debtors List */}
      <Text style={styles.sectionHeader}>
        {t.topCustomersUdhaar}
      </Text>

      {debtors.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.allSettled}</Text>
        </View>
      ) : (
        debtors
          .sort((a, b) => b.currentBalance - a.currentBalance)
          .map((party) => (
            <View key={party.id} style={styles.debtorCard}>
              <View style={styles.debtorInfo}>
                <Text style={styles.debtorName} numberOfLines={1}>
                  {party.name}
                </Text>
                <Text style={styles.debtorPhone}>{party.mobile}</Text>
              </View>

              <View style={styles.debtorValBox}>
                <Text style={styles.debtorStatus}>{t.youWillCollect}</Text>
                <Text style={styles.debtorAmount} numberOfLines={1}>
                  {currency} {party.currentBalance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  pageSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  metricValRed: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gaveRed,
    marginTop: 4,
  },
  metricValGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gotGreen,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  debtorCard: {
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
  debtorInfo: {
    flex: 1,
    paddingRight: 8,
  },
  debtorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  debtorPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  debtorValBox: {
    alignItems: 'flex-end',
  },
  debtorStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gaveRed,
  },
  debtorAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
});
