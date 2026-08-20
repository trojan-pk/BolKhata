import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import {
  Home,
  Users,
  Wallet,
  PieChart,
  Settings as SettingsIcon,
  Mic,
  UserPlus,
} from 'lucide-react-native';

// Services & Theme
import { StorageService } from './src/services/storage';
import { COLORS } from './src/theme/colors';
import {
  Party,
  Transaction,
  CashbookEntry,
  StoreProfile,
  TransactionType,
  PaymentMode,
  PartyType,
} from './src/types';

// Components
import { SplashScreen } from './src/components/SplashScreen';
import { Header } from './src/components/Header';
import { DashboardCards } from './src/components/DashboardCards';
import { CustomerCard } from './src/components/CustomerCard';
import { TransactionModal } from './src/components/TransactionModal';
import { AddCustomerModal } from './src/components/AddCustomerModal';
import { VoiceAssistantModal } from './src/components/VoiceAssistantModal';
import { ApiConfigModal } from './src/components/ApiConfigModal';
import { CustomerDetailModal } from './src/components/CustomerDetailModal';

// Screens
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CashbookScreen } from './src/screens/CashbookScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    name: 'Sharma General Store',
    ownerName: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    currency: '₹',
    language: 'hi',
    expressApiUrl: 'http://localhost:5000/api',
    isBackendConnected: false,
  });

  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'home' | 'customers' | 'cashbook' | 'reports' | 'settings'>('home');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
  const [apiConfigModalVisible, setApiConfigModalVisible] = useState(false);

  const [txnModalState, setTxnModalState] = useState<{
    visible: boolean;
    type: TransactionType;
    partyId?: string;
    partyName?: string;
  }>({
    visible: false,
    type: 'gave',
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const profile = await StorageService.getStoreProfile();
      const loadedParties = await StorageService.getParties();
      const loadedTxns = await StorageService.getTransactions();
      const loadedCashbook = await StorageService.getCashbook();

      setStoreProfile(profile);
      setParties(loadedParties);
      setTransactions(loadedTxns);
      setCashbook(loadedCashbook);
    }
    loadData();
  }, []);

  // Save changes helper
  const updatePartiesAndTxns = async (newParties: Party[], newTxns: Transaction[]) => {
    setParties(newParties);
    setTransactions(newTxns);
    await StorageService.saveParties(newParties);
    await StorageService.saveTransactions(newTxns);
  };

  // Add new customer / supplier
  const handleAddPartySubmit = async (data: {
    name: string;
    mobile: string;
    address: string;
    type: PartyType;
    openingBalance: number;
  }) => {
    const newParty: Party = {
      id: 'p_' + Date.now(),
      name: data.name,
      mobile: data.mobile,
      address: data.address,
      type: data.type,
      currentBalance: data.openingBalance,
      lastUpdated: new Date().toISOString().split('T')[0],
      avatarColor: data.type === 'customer' ? COLORS.primary : COLORS.accent,
    };

    const updated = [newParty, ...parties];
    setParties(updated);
    await StorageService.saveParties(updated);
  };

  // Record Gave / Got transaction
  const handleAddTransactionSubmit = async (data: {
    amount: number;
    note: string;
    paymentMode: PaymentMode;
  }) => {
    if (!txnModalState.partyId) return;

    const targetParty = parties.find((p) => p.id === txnModalState.partyId);
    if (!targetParty) return;

    const isGave = txnModalState.type === 'gave';

    const newTxn: Transaction = {
      id: 't_' + Date.now(),
      partyId: targetParty.id,
      partyName: targetParty.name,
      type: txnModalState.type,
      amount: data.amount,
      date: new Date().toISOString().split('T')[0],
      note: data.note,
      paymentMode: data.paymentMode,
      createdAt: Date.now(),
    };

    // Calculate updated balance
    // Gave = Udhaar (+ balance towards receivable), Got = Jama (- balance)
    const balanceChange = isGave ? data.amount : -data.amount;
    const updatedBalance = targetParty.currentBalance + balanceChange;

    const updatedParties = parties.map((p) =>
      p.id === targetParty.id
        ? {
            ...p,
            currentBalance: updatedBalance,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    );

    const updatedTxns = [newTxn, ...transactions];

    await updatePartiesAndTxns(updatedParties, updatedTxns);

    // Update active modal selected party state
    if (selectedParty && selectedParty.id === targetParty.id) {
      setSelectedParty({
        ...targetParty,
        currentBalance: updatedBalance,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
  };

  // Settle Up Customer Balance
  const handleSettleUpParty = async () => {
    if (!selectedParty) return;

    const currentBal = selectedParty.currentBalance;
    if (currentBal === 0) return;

    const settlementType: TransactionType = currentBal > 0 ? 'got' : 'gave';
    const amount = Math.abs(currentBal);

    const settlementTxn: Transaction = {
      id: 't_' + Date.now(),
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      type: settlementType,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      note: 'Full balance settled',
      paymentMode: 'cash',
      createdAt: Date.now(),
    };

    const updatedParties = parties.map((p) =>
      p.id === selectedParty.id
        ? {
            ...p,
            currentBalance: 0,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    );

    const updatedTxns = [settlementTxn, ...transactions];
    await updatePartiesAndTxns(updatedParties, updatedTxns);

    setSelectedParty({
      ...selectedParty,
      currentBalance: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  // Voice assistant parsed entry callback
  const handleVoiceParseResult = (result: {
    partyName: string;
    amount: number;
    type: TransactionType;
    note: string;
  }) => {
    let matchedParty = parties.find(
      (p) => p.name.toLowerCase() === result.partyName.toLowerCase()
    );

    if (!matchedParty) {
      matchedParty = parties[0]; // fallback to first party
    }

    if (matchedParty) {
      setTxnModalState({
        visible: true,
        type: result.type,
        partyId: matchedParty.id,
        partyName: matchedParty.name,
      });
    }
  };

  // Add Cashbook Entry
  const handleAddCashbookEntry = async (entry: {
    type: 'in' | 'out';
    amount: number;
    category: string;
    note: string;
  }) => {
    const newEntry: CashbookEntry = {
      id: 'c_' + Date.now(),
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      note: entry.note,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
    };

    const updated = [newEntry, ...cashbook];
    setCashbook(updated);
    await StorageService.saveCashbook(updated);
  };

  // Totals
  const totalReceivable = parties
    .filter((p) => p.currentBalance > 0)
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayable = parties
    .filter((p) => p.currentBalance < 0)
    .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0);

  const todayCashIn = cashbook
    .filter((c) => c.type === 'in')
    .reduce((sum, c) => sum + c.amount, 0);

  const todayCashOut = cashbook
    .filter((c) => c.type === 'out')
    .reduce((sum, c) => sum + c.amount, 0);

  // If showing splash screen loading entry
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
        storeName={storeProfile.name}
        ownerName={storeProfile.ownerName}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top App Header */}
      <Header
        storeProfile={storeProfile}
        onOpenVoice={() => setVoiceModalVisible(true)}
        onOpenApiConfig={() => setApiConfigModalVisible(true)}
      />

      {/* Tab Screen Views */}
      <View style={styles.mainContentArea}>
        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Dashboard Metrics */}
            <DashboardCards
              totalReceivable={totalReceivable}
              totalPayable={totalPayable}
              todayCashIn={todayCashIn}
              todayCashOut={todayCashOut}
              currency={storeProfile.currency}
              onPressReceivable={() => setActiveTab('customers')}
              onPressPayable={() => setActiveTab('customers')}
            />

            {/* Quick Grahak Ledger Summary */}
            <View style={styles.homeSectionHeader}>
              <Text style={styles.homeSectionTitle}>Recent Customer Khata</Text>
              <TouchableOpacity onPress={() => setActiveTab('customers')}>
                <Text style={styles.viewAllText}>View All ({parties.length})</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              {parties.slice(0, 4).map((party) => (
                <CustomerCard
                  key={party.id}
                  party={party}
                  currency={storeProfile.currency}
                  onPress={() => setSelectedParty(party)}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === 'customers' && (
          <CustomersScreen
            parties={parties}
            currency={storeProfile.currency}
            onSelectParty={(party) => setSelectedParty(party)}
            onAddParty={() => setAddCustomerModalVisible(true)}
          />
        )}

        {activeTab === 'cashbook' && (
          <CashbookScreen
            entries={cashbook}
            currency={storeProfile.currency}
            onAddCashEntry={handleAddCashbookEntry}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen parties={parties} currency={storeProfile.currency} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            storeProfile={storeProfile}
            onUpdateStore={async (updated) => {
              setStoreProfile(updated);
              await StorageService.saveStoreProfile(updated);
            }}
            onOpenApiConfig={() => setApiConfigModalVisible(true)}
          />
        )}
      </View>

      {/* Floating BolKhata Voice Action Button */}
      <TouchableOpacity
        style={styles.floatingMicBtn}
        onPress={() => setVoiceModalVisible(true)}
        activeOpacity={0.85}
      >
        <Mic size={22} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabActive]}
          onPress={() => setActiveTab('home')}
        >
          <Home size={20} color={activeTab === 'home' ? COLORS.primary : '#94a3b8'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'customers' && styles.tabActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Users size={20} color={activeTab === 'customers' ? COLORS.primary : '#94a3b8'} />
          <Text style={[styles.tabLabel, activeTab === 'customers' && styles.tabLabelActive]}>
            Customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'cashbook' && styles.tabActive]}
          onPress={() => setActiveTab('cashbook')}
        >
          <Wallet size={20} color={activeTab === 'cashbook' ? COLORS.primary : '#94a3b8'} />
          <Text style={[styles.tabLabel, activeTab === 'cashbook' && styles.tabLabelActive]}>
            Cashbook
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <PieChart size={20} color={activeTab === 'reports' ? COLORS.primary : '#94a3b8'} />
          <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>
            Reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <SettingsIcon size={20} color={activeTab === 'settings' ? COLORS.primary : '#94a3b8'} />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Modals */}
      <CustomerDetailModal
        visible={!!selectedParty}
        party={selectedParty}
        transactions={transactions}
        currency={storeProfile.currency}
        storeName={storeProfile.name}
        onClose={() => setSelectedParty(null)}
        onAddGave={() => {
          if (selectedParty) {
            setTxnModalState({
              visible: true,
              type: 'gave',
              partyId: selectedParty.id,
              partyName: selectedParty.name,
            });
          }
        }}
        onAddGot={() => {
          if (selectedParty) {
            setTxnModalState({
              visible: true,
              type: 'got',
              partyId: selectedParty.id,
              partyName: selectedParty.name,
            });
          }
        }}
        onSettleUp={handleSettleUpParty}
      />

      <TransactionModal
        visible={txnModalState.visible}
        type={txnModalState.type}
        partyName={txnModalState.partyName || ''}
        currency={storeProfile.currency}
        onClose={() => setTxnModalState({ ...txnModalState, visible: false })}
        onSubmit={handleAddTransactionSubmit}
      />

      <AddCustomerModal
        visible={addCustomerModalVisible}
        onClose={() => setAddCustomerModalVisible(false)}
        onSubmit={handleAddPartySubmit}
      />

      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onParseVoice={handleVoiceParseResult}
      />

      <ApiConfigModal
        visible={apiConfigModalVisible}
        storeProfile={storeProfile}
        onClose={() => setApiConfigModalVisible(false)}
        onSaveConfig={async (url, isConnected) => {
          const updated = { ...storeProfile, expressApiUrl: url, isBackendConnected: isConnected };
          setStoreProfile(updated);
          await StorageService.saveStoreProfile(updated);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainContentArea: {
    flex: 1,
  },
  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  homeSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  floatingMicBtn: {
    position: 'absolute',
    bottom: 74,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gotGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gotGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
