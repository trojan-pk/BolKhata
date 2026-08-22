import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {
  Home,
  Users,
  Wallet,
  PieChart,
  Settings as SettingsIcon,
  Mic,
} from 'lucide-react-native';

// Services, Theme & Typography
import { StorageService } from './src/services/storage';
import { COLORS } from './src/theme/colors';
import { FONTS, injectWebGoogleFonts } from './src/theme/typography';
import { getBottomInset } from './src/utils/safeArea';
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
import { EditTransactionModal } from './src/components/EditTransactionModal';
import { AddCustomerModal } from './src/components/AddCustomerModal';
import { VoiceAssistantModal } from './src/components/VoiceAssistantModal';
import { ApiConfigModal } from './src/components/ApiConfigModal';
import { CustomerDetailModal } from './src/components/CustomerDetailModal';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CashbookScreen } from './src/screens/CashbookScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { getTranslation } from './src/i18n/translations';

export default function App() {
  const bottomInset = getBottomInset();

  const [showSplashOverlay, setShowSplashOverlay] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const dashboardFade = useRef(new Animated.Value(0)).current;
  const dashboardTranslateY = useRef(new Animated.Value(10)).current;

  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    name: 'Bismillah General Store',
    ownerName: 'Muhammad Salman',
    mobile: '+92 300 1234567',
    currency: 'Rs',
    language: 'en',
    expressApiUrl: 'http://localhost:3000',
    isBackendConnected: true,
  });

  const t = getTranslation(storeProfile.language);

  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'home' | 'customers' | 'cashbook' | 'reports' | 'settings'>('home');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceInitialResult, setVoiceInitialResult] = useState<any | null>(null);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
  const [apiConfigModalVisible, setApiConfigModalVisible] = useState(false);
  const [selectedEditTxn, setSelectedEditTxn] = useState<Transaction | null>(null);

  // Animated Pill Navigation Dock Indicator
  const tabAnimIndex = useRef(new Animated.Value(0)).current;

  const [txnModalState, setTxnModalState] = useState<{
    visible: boolean;
    type: TransactionType;
    partyId?: string;
    partyName?: string;
  }>({
    visible: false,
    type: 'gave',
  });

  // Load initial data & Web Google Fonts
  useEffect(() => {
    injectWebGoogleFonts();

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

  // Update Animated Pill Dock position on tab change
  const animateTabTo = (index: number) => {
    Animated.spring(tabAnimIndex, {
      toValue: index,
      friction: 8,
      tension: 65,
      useNativeDriver: false,
    }).start();
  };

  const handleTabChange = (tab: 'home' | 'customers' | 'cashbook' | 'reports' | 'settings', index: number) => {
    setActiveTab(tab);
    animateTabTo(index);
  };

  // Smooth Cross-Fade Transition from Splash to Dashboard
  const handleSplashFinish = () => {
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dashboardFade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dashboardTranslateY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplashOverlay(false);
    });
  };

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
      avatarColor: data.type === 'customer' ? COLORS.primary : '#7c3aed',
    };

    const updated = [newParty, ...parties];
    await updatePartiesAndTxns(updated, transactions);
  };

  // Delete Customer and associated ledger transactions
  const handleDeleteParty = async (partyId: string) => {
    const updatedParties = parties.filter((p) => p.id !== partyId);
    const updatedTxns = transactions.filter((t) => t.partyId !== partyId);
    await updatePartiesAndTxns(updatedParties, updatedTxns);
    if (selectedParty && selectedParty.id === partyId) {
      setSelectedParty(null);
    }
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
      note: t.allSettled || 'Full balance settled',
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
  const handleVoiceParseResult = async (result: {
    partyName: string;
    amount: number;
    type: TransactionType;
    note: string;
    date?: string;
  }) => {
    let matchedParty = parties.find(
      (p) => p.name.toLowerCase().includes(result.partyName.toLowerCase()) ||
             result.partyName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (!matchedParty) {
      matchedParty = {
        id: 'p_' + Date.now(),
        name: result.partyName,
        mobile: '',
        address: '',
        type: 'customer',
        currentBalance: 0,
        lastUpdated: result.date || new Date().toISOString().split('T')[0],
        avatarColor: COLORS.primary,
      };
      parties.unshift(matchedParty);
    }

    const isGave = result.type === 'gave';
    const newTxn: Transaction = {
      id: 't_' + Date.now(),
      partyId: matchedParty.id,
      partyName: matchedParty.name,
      type: result.type,
      amount: result.amount,
      date: result.date || new Date().toISOString().split('T')[0],
      note: result.note || (isGave ? 'Credit given (voice entry)' : 'Payment received (voice entry)'),
      paymentMode: 'cash',
      source: 'voice',
      createdAt: Date.now(),
    };

    const updatedTxns = [newTxn, ...transactions];

    // Compute balance dynamically from all transactions
    const partyTxns = updatedTxns.filter((t) => t.partyId === matchedParty!.id);
    const updatedBalance = partyTxns.reduce(
      (sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount),
      0
    );

    const updatedParties = parties.map((p) =>
      p.id === matchedParty!.id
        ? {
            ...p,
            currentBalance: updatedBalance,
            lastUpdated: result.date || new Date().toISOString().split('T')[0],
          }
        : p
    );

    await updatePartiesAndTxns(updatedParties, updatedTxns);
  };

  // Save edited transaction and recalculate party balance
  const handleSaveEditedTransaction = async (updatedTxn: Transaction) => {
    const updatedTxns = transactions.map((t) =>
      t.id === updatedTxn.id ? updatedTxn : t
    );

    const partyTxns = updatedTxns.filter((t) => t.partyId === updatedTxn.partyId);
    const newBal = partyTxns.reduce(
      (sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount),
      0
    );

    const updatedParties = parties.map((p) =>
      p.id === updatedTxn.partyId
        ? {
            ...p,
            currentBalance: newBal,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    );

    await updatePartiesAndTxns(updatedParties, updatedTxns);

    if (selectedParty && selectedParty.id === updatedTxn.partyId) {
      setSelectedParty({
        ...selectedParty,
        currentBalance: newBal,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
  };

  // Delete transaction and recalculate party balance
  const handleDeleteTransaction = async (txnId: string) => {
    const txnToDelete = transactions.find((t) => t.id === txnId);
    if (!txnToDelete) return;

    const updatedTxns = transactions.filter((t) => t.id !== txnId);

    const partyTxns = updatedTxns.filter((t) => t.partyId === txnToDelete.partyId);
    const newBal = partyTxns.reduce(
      (sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount),
      0
    );

    const updatedParties = parties.map((p) =>
      p.id === txnToDelete.partyId
        ? {
            ...p,
            currentBalance: newBal,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    );

    await updatePartiesAndTxns(updatedParties, updatedTxns);

    if (selectedParty && selectedParty.id === txnToDelete.partyId) {
      setSelectedParty({
        ...selectedParty,
        currentBalance: newBal,
        lastUpdated: new Date().toISOString().split('T')[0],
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

  // Left position interpolation for sliding active pill indicator (5 items -> 0%, 20%, 40%, 60%, 80%)
  const slidingPillLeft = tabAnimIndex.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['1%', '21%', '41%', '61%', '81%'],
  });

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Main Responsive Dashboard Container */}
      <Animated.View
        style={[
          styles.appResponsiveWrapper,
          {
            opacity: dashboardFade,
            transform: [{ translateY: dashboardTranslateY }],
          },
        ]}
      >
        {/* Top App Header */}
        <Header
          storeProfile={storeProfile}
          onOpenVoice={() => setVoiceModalVisible(true)}
          onOpenApiConfig={() => setApiConfigModalVisible(true)}
        />

        {/* Tab Screen Views */}
        <View style={styles.mainContentArea}>
          {activeTab === 'home' && (
            <HomeScreen
              parties={parties}
              transactions={transactions}
              totalReceivable={totalReceivable}
              totalPayable={totalPayable}
              currency={storeProfile.currency}
              language={storeProfile.language}
              onOpenVoice={() => setVoiceModalVisible(true)}
              onViewAllCustomers={() => handleTabChange('customers', 1)}
              onViewAllTransactions={() => handleTabChange('reports', 3)}
              onSelectParty={(party) => setSelectedParty(party)}
              onSelectTransaction={(txn) => {
                setSelectedEditTxn(txn);
              }}
              onVoiceResultParsed={(res) => {
                setVoiceInitialResult(res);
                setVoiceModalVisible(true);
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersScreen
              parties={parties}
              currency={storeProfile.currency}
              language={storeProfile.language}
              onSelectParty={(party) => setSelectedParty(party)}
              onAddParty={() => setAddCustomerModalVisible(true)}
            />
          )}

          {activeTab === 'cashbook' && (
            <CashbookScreen
              entries={cashbook}
              currency={storeProfile.currency}
              language={storeProfile.language}
              onAddCashEntry={handleAddCashbookEntry}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsScreen
              parties={parties}
              currency={storeProfile.currency}
              language={storeProfile.language}
              onSelectParty={(party) => setSelectedParty(party)}
            />
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

        {/* DARK THEMED FLOATING ANIMATED PILL NAVIGATION DOCK */}
        <View style={[styles.pillDockWrapper, { bottom: bottomInset }]}>
          <View style={styles.floatingPillDock}>
            {/* Sliding Active Pill Background Highlight (Dark Charcoal) */}
            <Animated.View
              style={[
                styles.slidingPillIndicator,
                { left: slidingPillLeft },
              ]}
            />

            {/* Tab 1: Home */}
            <TouchableOpacity
              style={styles.pillTabItem}
              onPress={() => handleTabChange('home', 0)}
              activeOpacity={0.8}
            >
              <Home
                size={18}
                color={activeTab === 'home' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.pillTabLabel,
                  activeTab === 'home' && styles.pillTabLabelActive,
                ]}
              >
                {t.home}
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Customers */}
            <TouchableOpacity
              style={styles.pillTabItem}
              onPress={() => handleTabChange('customers', 1)}
              activeOpacity={0.8}
            >
              <Users
                size={18}
                color={activeTab === 'customers' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.pillTabLabel,
                  activeTab === 'customers' && styles.pillTabLabelActive,
                ]}
              >
                {t.customers}
              </Text>
            </TouchableOpacity>

            {/* Tab 3: Cashbook */}
            <TouchableOpacity
              style={styles.pillTabItem}
              onPress={() => handleTabChange('cashbook', 2)}
              activeOpacity={0.8}
            >
              <Wallet
                size={18}
                color={activeTab === 'cashbook' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.pillTabLabel,
                  activeTab === 'cashbook' && styles.pillTabLabelActive,
                ]}
              >
                {t.cashbook}
              </Text>
            </TouchableOpacity>

            {/* Tab 4: Reports */}
            <TouchableOpacity
              style={styles.pillTabItem}
              onPress={() => handleTabChange('reports', 3)}
              activeOpacity={0.8}
            >
              <PieChart
                size={18}
                color={activeTab === 'reports' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.pillTabLabel,
                  activeTab === 'reports' && styles.pillTabLabelActive,
                ]}
              >
                {t.reports}
              </Text>
            </TouchableOpacity>

            {/* Tab 5: Settings */}
            <TouchableOpacity
              style={styles.pillTabItem}
              onPress={() => handleTabChange('settings', 4)}
              activeOpacity={0.8}
            >
              <SettingsIcon
                size={18}
                color={activeTab === 'settings' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.pillTabLabel,
                  activeTab === 'settings' && styles.pillTabLabelActive,
                ]}
              >
                {t.settings}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Cross-Fading Splash Overlay */}
      {showSplashOverlay && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.splashOverlayContainer,
            { opacity: splashOpacity },
          ]}
          pointerEvents={showSplashOverlay ? 'auto' : 'none'}
        >
          <SplashScreen
            onFinish={handleSplashFinish}
            storeName={storeProfile.name}
            ownerName={storeProfile.ownerName}
          />
        </Animated.View>
      )}

      {/* Interactive Modals */}
      <CustomerDetailModal
        visible={!!selectedParty}
        party={selectedParty}
        transactions={transactions}
        currency={storeProfile.currency}
        language={storeProfile.language}
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
        onEditTransaction={(txn) => setSelectedEditTxn(txn)}
        onDeleteTransaction={handleDeleteTransaction}
        onDeleteParty={handleDeleteParty}
      />

      {/* 1-Tap Transaction Editor Modal */}
      <EditTransactionModal
        visible={!!selectedEditTxn}
        transaction={selectedEditTxn}
        currency={storeProfile.currency}
        language={storeProfile.language}
        onClose={() => setSelectedEditTxn(null)}
        onSave={handleSaveEditedTransaction}
        onDelete={handleDeleteTransaction}
      />

      <TransactionModal
        visible={txnModalState.visible}
        type={txnModalState.type}
        partyName={txnModalState.partyName || ''}
        currency={storeProfile.currency}
        language={storeProfile.language}
        onClose={() => setTxnModalState({ ...txnModalState, visible: false })}
        onSubmit={handleAddTransactionSubmit}
      />

      <AddCustomerModal
        visible={addCustomerModalVisible}
        language={storeProfile.language}
        onClose={() => setAddCustomerModalVisible(false)}
        onSubmit={handleAddPartySubmit}
      />

      {/* Voice Assistant Powered by Groq Whisper STT & Gemini */}
      <VoiceAssistantModal
        visible={voiceModalVisible}
        currency={storeProfile.currency}
        language={storeProfile.language}
        parties={parties}
        initialResult={voiceInitialResult}
        onClose={() => {
          setVoiceModalVisible(false);
          setVoiceInitialResult(null);
        }}
        onParseVoice={handleVoiceParseResult}
      />

      <ApiConfigModal
        visible={apiConfigModalVisible}
        storeProfile={storeProfile}
        onClose={() => setApiConfigModalVisible(false)}
        onSaveConfig={async (url, isConnected) => {
          const updated = {
            ...storeProfile,
            expressApiUrl: url,
            isBackendConnected: isConnected,
          };
          setStoreProfile(updated);
          await StorageService.saveStoreProfile(updated);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  appResponsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#f8fafc',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  splashOverlayContainer: {
    zIndex: 999,
    backgroundColor: '#ffffff',
  },
  mainContentArea: {
    flex: 1,
  },
  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  homeSectionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Floating Dark Pill Dock Wrapper
  pillDockWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingPillDock: {
    width: '100%',
    maxWidth: 520,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    paddingHorizontal: 4,
  },
  slidingPillIndicator: {
    position: 'absolute',
    width: '18%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    top: 4,
  },
  pillTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  pillTabLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  pillTabLabelActive: {
    fontFamily: FONTS.bodyBold,
    color: '#ffffff',
    fontWeight: '700',
  },

  // Central White Contrast Voice Mic Button inside Dark Pill Dock
  centerMicPillButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  centerMicPillLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '700',
  },
});
