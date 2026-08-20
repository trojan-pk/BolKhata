import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FileText, Share2, AlertCircle, TrendingUp, Download } from 'lucide-react-native';
import { Party } from '../types';
import { COLORS } from '../theme/colors';

interface ReportsScreenProps {
  parties: Party[];
  currency?: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  parties,
  currency = '₹',
}) => {
  const debtors = parties.filter((p) => p.currentBalance > 0);
  const creditors = parties.filter((p) => p.currentBalance < 0);

  const totalUdhaar = debtors.reduce((sum, p) => sum + p.currentBalance, 0);
  const totalJama = creditors.reduce((sum, p) => sum + Math.abs(p.currentBalance), 0);

  const handleExportPDF = () => {
    alert('PDF Statement generated! Downloading shop ledger statement report...');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Action Header */}
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.pageTitle}>Reports & Analytics</Text>
          <Text style={styles.pageSub}>Download statements & debt insights</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} activeOpacity={0.85}>
          <Download size={16} color="#ffffff" />
          <Text style={styles.exportBtnText}>PDF Report</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Debtors (Udhaar Grahak)</Text>
          <Text style={styles.metricValRed}>{debtors.length} Parties</Text>
          <Text style={styles.metricSub}>
            {currency} {totalUdhaar.toLocaleString('en-IN')} pending
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Creditors (Suppliers)</Text>
          <Text style={styles.metricValGreen}>{creditors.length} Parties</Text>
          <Text style={styles.metricSub}>
            {currency} {totalJama.toLocaleString('en-IN')} payable
          </Text>
        </View>
      </View>

      {/* Top Pending Debtors List */}
      <Text style={styles.sectionHeader}>Top Pending Debtors (Action Required)</Text>

      {debtors.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>All customer balances cleared!</Text>
        </View>
      ) : (
        debtors
          .sort((a, b) => b.currentBalance - a.currentBalance)
          .map((party) => (
            <View key={party.id} style={styles.debtorCard}>
              <View style={styles.debtorInfo}>
                <Text style={styles.debtorName}>{party.name}</Text>
                <Text style={styles.debtorPhone}>{party.mobile}</Text>
              </View>

              <View style={styles.debtorValBox}>
                <Text style={styles.debtorStatus}>Aap Lenge</Text>
                <Text style={styles.debtorAmount}>
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
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  pageSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricValRed: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gaveRed,
    marginTop: 4,
  },
  metricValGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gotGreen,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  debtorCard: {
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
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  debtorPhone: {
    fontSize: 12,
    color: '#94a3b8',
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gaveRed,
  },
});
