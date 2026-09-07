import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { StorageService, INITIAL_STORE_PROFILE } from './src/services/storage';
import { COLORS } from './src/theme/colors';
import { injectWebGoogleFonts } from './src/theme/typography';
import { MAX_CONTENT_WIDTH, MOTION } from './src/theme/tokens';
import { COPY } from './src/i18n/copy';
import {
  CashbookEntry,
  Party,
  PartyType,
  PaymentMode,
  StoreProfile,
  Transaction,
  TransactionType,
} from './src/types';

import { CrossFade, FeedbackProvider, useFeedback } from './src/ui';
import { SplashScreen } from './src/components/SplashScreen';
import { SetupCelebration } from './src/components/SetupCelebration';
import { AppBar } from './src/components/AppBar';
import { TabBar, TabKey } from './src/components/TabBar';
import { AddCustomerModal } from './src/components/AddCustomerModal';
import { ApiConfigModal } from './src/components/ApiConfigModal';
import { CustomerLedgerPanel } from './src/components/CustomerLedgerPanel';
import { EditTransactionModal } from './src/components/EditTransactionModal';
import { TransactionModal } from './src/components/TransactionModal';
import { VoiceAssistantModal } from './src/components/VoiceAssistantModal';
import { AuroraVoiceOverlay } from './src/components/AuroraVoiceOverlay';
import { Audio } from 'expo-av';
import { ApiService } from './src/services/api';

import { HomeScreen } from './src/screens/HomeScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CashbookScreen } from './src/screens/CashbookScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { IntroScreen } from './src/screens/IntroScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingWizardModal } from './src/screens/OnboardingWizardModal';
import { supabase } from './src/services/supabase';
import { Session } from '@supabase/supabase-js';
import { todayISO } from './src/utils/format';

/* -------------------------------------------------------------- ledger math -- */

/**
 * A party's balance is always the sum of its entries — including the opening
 * balance, which is stored as a real transaction rather than a loose number.
 * That's what lets edits and deletions recompute correctly instead of silently
 * dropping whatever the account started with.
 */
function balanceFor(transactions: Transaction[], partyId: string): number {
  return transactions
    .filter((t) => t.partyId === partyId)
    .reduce((sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount), 0);
}

function withRecalculatedBalance(
  parties: Party[],
  transactions: Transaction[],
  partyId: string,
  date = todayISO()
): Party[] {
  const balance = balanceFor(transactions, partyId);
  return parties.map((p) =>
    p.id === partyId ? { ...p, currentBalance: balance, lastUpdated: date } : p
  );
}

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* --------------------------------------------------------------------- root -- */

export default function App() {
  useEffect(() => {
    injectWebGoogleFonts();
  }, []);

  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <BolKhata />
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}

function BolKhata() {
  const insets = useSafeAreaInsets();
  const { toast } = useFeedback();

  /* ------------------------------------------------------------------ data -- */
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(
    INITIAL_STORE_PROFILE
  );
  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  /**
   * Whose data is currently in state. Guards against `SIGNED_IN` — which also
   * fires on token refresh and tab focus — re-running the whole load.
   */
  const loadedUserRef = useRef<string | null>(null);
  /**
   * The pre-session flow. `intro` is only ever entered once per device — see
   * `StorageService.getIntroSeen`.
   */
  const [authView, setAuthView] = useState<'intro' | 'welcome' | 'auth'>('welcome');
  /** Which way the next pre-session transition travels. `-1` is a step back. */
  const [authDirection, setAuthDirection] = useState<1 | -1>(1);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  /**
   * Holds the owner's name while the setup-complete beat plays, and doubles as
   * the flag that it's playing. Set after `saveProfile` resolves, so the beat
   * only ever celebrates a write that actually landed.
   */
  const [celebrateName, setCelebrateName] = useState<string | null>(null);

  /* --------------------------------------------------------------- routing -- */
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [customerFilter, setCustomerFilter] =
    useState<'all' | 'collect' | 'pay' | 'settled'>('all');

  /* ---------------------------------------------------------------- modals -- */
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceResult, setVoiceResult] = useState<unknown>(null);
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [apiConfigOpen, setApiConfigOpen] = useState(false);

  /* -------------------------------------------------------- voice capture -- */
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);

  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const capturingRef = useRef(false);
  const isTapRecordingRef = useRef(false);
  const pressStartRef = useRef(0);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});

  const releaseWebStream = () => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }
  };

  const abortVoiceCapture = useCallback((message?: string) => {
    capturingRef.current = false;
    isTapRecordingRef.current = false;
    setVoiceState('idle');
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    releaseWebStream();
    if (message) toast(message, 'error');
  }, [toast]);

  const sendForParsing = useCallback(async (body: FormData) => {
    body.append(
      'people',
      JSON.stringify(parties.map((p) => ({ id: p.id, name: p.name })))
    );
    body.append('current_date', todayISO());

    try {
      const result = await ApiService.processVoice(body);
      if (result) {
        setVoiceResult(result);
        setVoiceOpen(true);
      } else {
        toast(COPY.voice.failed, 'error');
        setVoiceResult(null);
        setVoiceOpen(true);
      }
    } catch (error) {
      toast(COPY.voice.failed, 'error');
      setVoiceResult(null);
      setVoiceOpen(true);
    } finally {
      setVoiceState('idle');
    }
  }, [parties, toast]);

  const stopVoiceCaptureAndParse = useCallback(async () => {
    if (!capturingRef.current) return;
    capturingRef.current = false;
    isTapRecordingRef.current = false;

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setVoiceState('processing');

    try {
      if (Platform.OS === 'web') {
        const recorder = webRecorderRef.current;
        if (!recorder) {
          setVoiceState('idle');
          return;
        }
        recorder.onstop = async () => {
          releaseWebStream();
          const chunks = webChunksRef.current;
          if (!chunks.length) {
            setVoiceState('idle');
            return;
          }
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size < 500) {
            setVoiceState('idle');
            toast(COPY.voice.tooShort, 'error');
            return;
          }
          const file = new File([blob], 'recording.webm', { type: mimeType });
          const formData = new FormData();
          formData.append('audio', file);
          await sendForParsing(formData);
        };
        recorder.stop();
        return;
      }

      const recording = nativeRecordingRef.current;
      if (!recording) {
        setVoiceState('idle');
        return;
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      nativeRecordingRef.current = null;
      if (!uri) {
        setVoiceState('idle');
        toast(COPY.voice.failed, 'error');
        return;
      }
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      await sendForParsing(formData);
    } catch {
      setVoiceState('idle');
      toast(COPY.voice.failed, 'error');
    }
  }, [sendForParsing, toast]);

  useEffect(() => {
    stopRef.current = stopVoiceCaptureAndParse;
  }, [stopVoiceCaptureAndParse]);

  const startVoiceCapture = useCallback(async () => {
    if (capturingRef.current) return;

    try {
      capturingRef.current = true;
      setVoiceDuration(0);
      setVoiceState('recording');

      sessionTimerRef.current = setTimeout(() => {
        if (capturingRef.current) stopRef.current();
      }, 30000);

      durationIntervalRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);

      if (Platform.OS === 'web') {
        const media =
          typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
        if (!media?.getUserMedia) {
          abortVoiceCapture(COPY.voice.micUnavailable);
          return;
        }
        const stream = await media.getUserMedia({ audio: true });
        webStreamRef.current = stream;
        webChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        webRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) webChunksRef.current.push(event.data);
        };
        recorder.start();
        return;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        abortVoiceCapture(COPY.voice.micDenied);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      nativeRecordingRef.current = recording;
    } catch (error) {
      abortVoiceCapture(COPY.voice.micDenied);
    }
  }, [abortVoiceCapture]);

  useEffect(() => {
    if (voiceState !== 'recording') return;
    const interval = setInterval(() => {
      setPromptIdx((prev) => (prev + 1) % COPY.home.examples.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [voiceState]);

  /* ------------------------------------------- tap vs hold-and-release -- */
  const handleVoicePressIn = () => {
    pressStartRef.current = Date.now();
    if (voiceState === 'idle') {
      startVoiceCapture();
    }
  };

  const handleVoicePressOut = () => {
    const elapsed = Date.now() - pressStartRef.current;
    if (elapsed >= 450 && capturingRef.current) {
      stopVoiceCaptureAndParse();
    } else if (elapsed < 450 && capturingRef.current) {
      isTapRecordingRef.current = true;
    }
  };

  const handleVoicePress = () => {
    if (isTapRecordingRef.current && capturingRef.current) {
      stopVoiceCaptureAndParse();
    }
  };
  const [composer, setComposer] = useState<{
    visible: boolean;
    type: TransactionType;
    partyId?: string;
    partyName?: string;
  }>({ visible: false, type: 'gave' });

  /* ---------------------------------------------------------------- splash -- */
  const [splashVisible, setSplashVisible] = useState(true);
  /**
   * Flips the moment the splash *starts* lifting, rather than when it's gone.
   *
   * The content underneath is gated on this, so it mounts and rises while the
   * splash is still dissolving. Waiting for `splashVisible` to clear meant the
   * splash faded out to reveal an empty background, then the app appeared in one
   * jump — the fade-in below never had anything to fade in over.
   */
  const [splashLifting, setSplashLifting] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const appShift = useRef(new Animated.Value(10)).current;

  const userId = session?.user?.id;

  const finishSplash = useCallback(() => {
    setSplashLifting(true);
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: MOTION.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: MOTION.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appShift, {
        toValue: 0,
        duration: MOTION.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setSplashVisible(false));
  }, [splashOpacity, appOpacity, appShift]);

  const loadUserData = useCallback(async (uid?: string) => {
    setLoading(true);
    try {
      const [profile, loadedParties, loadedTxns, loadedCash] = await Promise.all([
        StorageService.getStoreProfile(uid),
        StorageService.getParties(uid),
        StorageService.getTransactions(uid),
        StorageService.getCashbook(uid),
      ]);
      setStoreProfile(profile);
      setParties(loadedParties);
      setTransactions(loadedTxns);
      setCashbook(loadedCash);
      loadedUserRef.current = uid ?? null;
    } catch (e) {
      console.warn('[BolKhata] Error loading user data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Both answers are needed before the first screen can be chosen, so they're
    // resolved together — settling `authLoading` early would show Welcome for a
    // frame before the intro replaced it.
    Promise.all([
      supabase.auth.getSession(),
      StorageService.getIntroSeen(),
    ]).then(async ([{ data: { session } }, introSeen]) => {
      if (cancelled) return;
      setSession(session);
      if (!session && !introSeen) setAuthView('intro');
      if (session?.user?.id) {
        await loadUserData(session.user.id);
      }
      if (!cancelled) {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && session?.user?.id) {
        // `SIGNED_IN` also fires on tab focus and after a token refresh, so an
        // unconditional reload here re-fetched the whole ledger repeatedly and
        // could clobber in-flight local edits. Only a new user reloads.
        if (loadedUserRef.current !== session.user.id) {
          await loadUserData(session.user.id);
        }
      } else if (_event === 'SIGNED_OUT') {
        loadedUserRef.current = null;
        setParties([]);
        setTransactions([]);
        setCashbook([]);
        setStoreProfile(INITIAL_STORE_PROFILE);
        setAuthView('welcome');
        setAuthDirection(-1);
      }
    });

    /**
     * Strips auth material out of the address bar once it has been consumed.
     *
     * Leaving `?code=` behind meant a refresh replayed a spent single-use code
     * and failed, and it kept the grant in browser history.
     */
    const scrubWebUrl = () => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return;
      if (window.location.search || window.location.hash) {
        const { origin, pathname } = window.location;
        window.history.replaceState({}, document.title, `${origin}${pathname}`);
      }
    };

    /**
     * Native-only OAuth / email-confirmation callback handling.
     *
     * On web this must not run: `detectSessionInUrl` is enabled there, so
     * supabase-js consumes the `?code=` itself. Both of them racing for the same
     * single-use PKCE code meant the loser threw "invalid flow state" — which is
     * why Google sign-in and confirmation links failed intermittently in the
     * browser depending on which handler reached the code first.
     */
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url || Platform.OS === 'web') return;

      try {
        // 1. PKCE code exchange
        const parsed = Linking.parse(url);
        if (parsed.queryParams?.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(String(parsed.queryParams.code));
          if (error) {
            console.warn('[BolKhata] Code exchange failed:', error.message);
            return;
          }
          if (data?.session) {
            setSession(data.session);
            if (data.session.user?.id) {
              await loadUserData(data.session.user.id);
            }
          }
          return;
        }

        // 2. Implicit flow token extraction from hash (#access_token=...)
        const hashIdx = url.indexOf('#');
        if (hashIdx !== -1) {
          const hashStr = url.substring(hashIdx + 1);
          const hashParams = new URLSearchParams(hashStr);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session) {
              setSession(data.session);
              if (data.session.user?.id) {
                await loadUserData(data.session.user.id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[BolKhata] Deep link auth error:', err);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    if (Platform.OS === 'web') {
      // Let supabase-js finish reading the URL, then clear it.
      void supabase.auth.getSession().then(scrubWebUrl);
    } else {
      Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
      });
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, [loadUserData]);

  /** Leaving the intro is one-way: the flag is written as the transition starts. */
  const finishIntro = useCallback(() => {
    void StorageService.setIntroSeen();
    setAuthDirection(1);
    setAuthView('welcome');
  }, []);

  /* ------------------------------------------------------------ persistence -- */

  const commit = useCallback(
    async (nextParties: Party[], nextTxns: Transaction[]) => {
      setParties(nextParties);
      setTransactions(nextTxns);
      await Promise.all([
        StorageService.saveParties(nextParties, userId),
        StorageService.saveTransactions(nextTxns, userId),
      ]);
    },
    [userId]
  );

  const commitCashbook = useCallback(async (next: CashbookEntry[]) => {
    setCashbook(next);
    await StorageService.saveCashbook(next, userId);
  }, [userId]);

  const saveProfile = useCallback(async (next: StoreProfile) => {
    setStoreProfile(next);
    await StorageService.saveStoreProfile(next, userId);
  }, [userId]);

  /* -------------------------------------------------------------- mutations -- */

  const addParty = useCallback(
    async (data: {
      name: string;
      mobile: string;
      address: string;
      type: PartyType;
      openingBalance: number;
    }) => {
      const party: Party = {
        id: uid('p'),
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        type: data.type,
        currentBalance: 0,
        lastUpdated: todayISO(),
      };

      let nextTxns = transactions;

      // An opening balance is a real entry, so it survives later recalculation
      // and shows up in the statement where it can be audited.
      if (data.openingBalance !== 0) {
        const opening: Transaction = {
          id: uid('t'),
          partyId: party.id,
          partyName: party.name,
          type: data.openingBalance > 0 ? 'gave' : 'got',
          amount: Math.abs(data.openingBalance),
          date: todayISO(),
          note: 'Opening balance',
          paymentMode: 'cash',
          source: 'manual',
          createdAt: Date.now(),
        };
        nextTxns = [opening, ...transactions];
        party.currentBalance = data.openingBalance;
      }

      await commit([party, ...parties], nextTxns);
      toast(COPY.party.createdToast(party.name));
    },
    [parties, transactions, commit, toast]
  );

  const deleteParty = useCallback(
    async (partyId: string) => {
      await StorageService.deleteParty(partyId, userId);
      await commit(
        parties.filter((p) => p.id !== partyId),
        transactions.filter((t) => t.partyId !== partyId)
      );
      if (selectedParty?.id === partyId) setSelectedParty(null);
    },
    [parties, transactions, commit, selectedParty, userId]
  );

  const addTransaction = useCallback(
    async (data: { amount: number; note: string; paymentMode: PaymentMode }) => {
      const party = parties.find((p) => p.id === composer.partyId);
      if (!party) return;

      const txn: Transaction = {
        id: uid('t'),
        partyId: party.id,
        partyName: party.name,
        type: composer.type,
        amount: data.amount,
        date: todayISO(),
        note: data.note,
        paymentMode: data.paymentMode,
        source: 'manual',
        createdAt: Date.now(),
      };

      const nextTxns = [txn, ...transactions];
      const nextParties = withRecalculatedBalance(parties, nextTxns, party.id);
      await commit(nextParties, nextTxns);

      if (selectedParty?.id === party.id) {
        setSelectedParty(nextParties.find((p) => p.id === party.id) || null);
      }
      toast(COPY.txn.savedToast);
    },
    [parties, transactions, composer, commit, selectedParty, toast]
  );

  const settleParty = useCallback(async () => {
    if (!selectedParty || selectedParty.currentBalance === 0) return;

    const settlement: Transaction = {
      id: uid('t'),
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      type: selectedParty.currentBalance > 0 ? 'got' : 'gave',
      amount: Math.abs(selectedParty.currentBalance),
      date: todayISO(),
      note: 'Balance settled',
      paymentMode: 'cash',
      source: 'manual',
      createdAt: Date.now(),
    };

    const nextTxns = [settlement, ...transactions];
    const nextParties = withRecalculatedBalance(parties, nextTxns, selectedParty.id);
    await commit(nextParties, nextTxns);
    setSelectedParty(nextParties.find((p) => p.id === selectedParty.id) || null);
  }, [selectedParty, parties, transactions, commit]);

  /**
   * Applies a voice-parsed entry, creating the customer if the name is new.
   *
   * The previous implementation mutated the `parties` state array in place with
   * `unshift`, so a newly spoken customer often failed to appear until the next
   * unrelated render. Everything here is derived immutably instead.
   */
  const applyVoiceEntry = useCallback(
    async (result: {
      partyName: string;
      amount: number;
      type: TransactionType;
      note: string;
      date?: string;
    }) => {
      const needle = result.partyName.trim().toLowerCase();
      const existing = parties.find((p) => {
        const name = p.name.toLowerCase();
        return name.includes(needle) || needle.includes(name);
      });

      const party: Party =
        existing ??
        {
          id: uid('p'),
          name: result.partyName.trim(),
          mobile: '',
          address: '',
          type: 'customer',
          currentBalance: 0,
          lastUpdated: result.date || todayISO(),
        };

      const txn: Transaction = {
        id: uid('t'),
        partyId: party.id,
        partyName: party.name,
        type: result.type,
        amount: result.amount,
        date: result.date || todayISO(),
        note:
          result.note ||
          (result.type === 'gave' ? COPY.ledger.creditGiven : COPY.ledger.paymentReceived),
        paymentMode: 'cash',
        source: 'voice',
        createdAt: Date.now(),
      };

      const nextTxns = [txn, ...transactions];
      const baseParties = existing ? parties : [party, ...parties];
      const nextParties = withRecalculatedBalance(
        baseParties,
        nextTxns,
        party.id,
        result.date || todayISO()
      );

      await commit(nextParties, nextTxns);
      toast(
        existing
          ? COPY.txn.savedToast
          : `${party.name} added · ${COPY.txn.savedToast.toLowerCase()}`
      );
    },
    [parties, transactions, commit, toast]
  );

  const saveEditedTransaction = useCallback(
    async (updated: Transaction) => {
      const nextTxns = transactions.map((t) => (t.id === updated.id ? updated : t));
      const nextParties = withRecalculatedBalance(parties, nextTxns, updated.partyId);
      await commit(nextParties, nextTxns);

      if (selectedParty?.id === updated.partyId) {
        setSelectedParty(nextParties.find((p) => p.id === updated.partyId) || null);
      }
    },
    [transactions, parties, commit, selectedParty]
  );

  const deleteTransaction = useCallback(
    async (txnId: string) => {
      const target = transactions.find((t) => t.id === txnId);
      if (!target) return;

      await StorageService.deleteTransaction(txnId, userId);
      const nextTxns = transactions.filter((t) => t.id !== txnId);
      const nextParties = withRecalculatedBalance(parties, nextTxns, target.partyId);
      await commit(nextParties, nextTxns);

      if (selectedParty?.id === target.partyId) {
        setSelectedParty(nextParties.find((p) => p.id === target.partyId) || null);
      }
    },
    [transactions, parties, commit, selectedParty, userId]
  );

  const addCashEntry = useCallback(
    async (entry: {
      type: 'in' | 'out';
      amount: number;
      category: string;
      note: string;
    }) => {
      const record: CashbookEntry = {
        id: uid('c'),
        ...entry,
        date: todayISO(),
        createdAt: Date.now(),
      };
      await commitCashbook([record, ...cashbook]);
    },
    [cashbook, commitCashbook]
  );

  const deleteCashEntry = useCallback(
    async (id: string) => {
      await StorageService.deleteCashbookEntry(id, userId);
      await commitCashbook(cashbook.filter((c) => c.id !== id));
    },
    [cashbook, commitCashbook, userId]
  );

  const eraseAll = useCallback(async () => {
    await StorageService.clearUserStorage(userId);
    setParties([]);
    setTransactions([]);
    setCashbook([]);
    setStoreProfile(INITIAL_STORE_PROFILE);
    setSelectedParty(null);
    setEditingTxn(null);
    toast('All data erased');
  }, [toast, userId]);

  /* ----------------------------------------------------------------- totals -- */

  const { toCollect, toPay } = useMemo(
    () =>
      parties.reduce(
        (acc, party) => {
          if (party.currentBalance > 0) acc.toCollect += party.currentBalance;
          if (party.currentBalance < 0) acc.toPay += Math.abs(party.currentBalance);
          return acc;
        },
        { toCollect: 0, toPay: 0 }
      ),
    [parties]
  );

  /* ------------------------------------------------------------------ views -- */

  const goToCustomers = (filter: 'all' | 'collect' | 'pay' | 'settled') => {
    setCustomerFilter(filter);
    setActiveTab('customers');
  };

  const screen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            parties={parties}
            transactions={transactions}
            toCollect={toCollect}
            toPay={toPay}
            currency={storeProfile.currency}
            loading={loading}
            onViewAllCustomers={() => goToCustomers('all')}
            onSelectTransaction={setEditingTxn}
          />
        );
      case 'customers':
        return (
          <CustomersScreen
            key={customerFilter}
            parties={parties}
            currency={storeProfile.currency}
            loading={loading}
            initialFilter={customerFilter}
            onSelectParty={setSelectedParty}
            onAddParty={() => setAddPartyOpen(true)}
          />
        );
      case 'cashbook':
        return (
          <CashbookScreen
            entries={cashbook}
            currency={storeProfile.currency}
            onAddCashEntry={addCashEntry}
            onDeleteCashEntry={deleteCashEntry}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            parties={parties}
            currency={storeProfile.currency}
            storeName={storeProfile.name}
            onSelectParty={setSelectedParty}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            storeProfile={storeProfile}
            onUpdateStore={saveProfile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ----------------------------------- first run → auth → the ledger -- */}
      {/*
        One CrossFade spans the whole pre-app sequence, so every boundary in it
        dissolves: intro → welcome → auth, auth → welcome going back, and
        auth → ledger once a session lands. That last one is what the 2s splash
        replay used to paper over.
      */}
      {!authLoading && splashLifting ? (
        <CrossFade
          phase={session ? 'app' : authView}
          direction={authDirection}
          fill
        >
          {!session ? (
            authView === 'intro' ? (
              <IntroScreen onDone={finishIntro} />
            ) : authView === 'welcome' ? (
              <WelcomeScreen
                onSignUp={() => {
                  setAuthMode('signup');
                  setAuthDirection(1);
                  setAuthView('auth');
                }}
                onLogin={() => {
                  setAuthMode('login');
                  setAuthDirection(1);
                  setAuthView('auth');
                }}
              />
            ) : (
              <AuthScreen
                initialMode={authMode}
                onBackToWelcome={() => {
                  setAuthDirection(-1);
                  setAuthView('welcome');
                }}
              />
            )
          ) : (
            <Animated.View
              style={[
                styles.app,
                {
                  paddingTop: insets.top,
                  opacity: appOpacity,
                  transform: [{ translateY: appShift }],
                },
              ]}
            >
              <View style={styles.shell}>
                <AppBar
                  storeProfile={storeProfile}
                  onOpenSettings={() => setActiveTab('settings')}
                />

                <ScreenTransition key={activeTab} tabKey={activeTab}>
                  {screen()}
                </ScreenTransition>
              </View>

              <TabBar
                active={activeTab}
                onChange={setActiveTab}
                isRecording={voiceState === 'recording'}
                onPressVoice={handleVoicePress}
                onPressInVoice={handleVoicePressIn}
                onPressOutVoice={handleVoicePressOut}
              />

              {/* Post-signup personalisation & business setup wizard */}
              {!loading && session && !storeProfile.isOnboarded && (
                <OnboardingWizardModal
                  visible={true}
                  userEmail={session.user.email}
                  onComplete={async (updatedProfile) => {
                    await saveProfile(updatedProfile);
                    setCelebrateName(updatedProfile.ownerName);
                  }}
                />
              )}
            </Animated.View>
          )}
        </CrossFade>
      ) : null}

      {/* -------------------------------------------- setup-complete beat -- */}
      {/*
        Above the ledger, below the splash. The wizard is already unmounted by
        the time this renders — saving the profile flips `isOnboarded` — so this
        beat covers the hand-off and dissolves to reveal Home behind it.
      */}
      {celebrateName ? (
        <SetupCelebration
          name={celebrateName}
          onDone={() => setCelebrateName(null)}
        />
      ) : null}

      {/* -------------------------------------------------- splash overlay -- */}
      {splashVisible ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.splash, { opacity: splashOpacity }]}
          pointerEvents="auto"
        >
          <SplashScreen
            onFinish={finishSplash}
            storeName={storeProfile.name}
            ownerName={storeProfile.ownerName}
          />
        </Animated.View>
      ) : null}

      {/* --------------------------------------------------------- modals -- */}
      <CustomerLedgerPanel
        visible={!!selectedParty}
        party={selectedParty}
        transactions={transactions}
        currency={storeProfile.currency}
        storeName={storeProfile.name}
        onClose={() => setSelectedParty(null)}
        onAddGave={() =>
          selectedParty &&
          setComposer({
            visible: true,
            type: 'gave',
            partyId: selectedParty.id,
            partyName: selectedParty.name,
          })
        }
        onAddGot={() =>
          selectedParty &&
          setComposer({
            visible: true,
            type: 'got',
            partyId: selectedParty.id,
            partyName: selectedParty.name,
          })
        }
        onSettleUp={settleParty}
        onEditTransaction={setEditingTxn}
        onDeleteParty={deleteParty}
      />

      <TransactionModal
        visible={composer.visible}
        type={composer.type}
        partyName={composer.partyName || ''}
        currency={storeProfile.currency}
        onClose={() => setComposer((prev) => ({ ...prev, visible: false }))}
        onSubmit={addTransaction}
      />

      <EditTransactionModal
        visible={!!editingTxn}
        transaction={editingTxn}
        currency={storeProfile.currency}
        onClose={() => setEditingTxn(null)}
        onSave={saveEditedTransaction}
        onDelete={deleteTransaction}
      />

      <AddCustomerModal
        visible={addPartyOpen}
        currency={storeProfile.currency}
        onClose={() => setAddPartyOpen(false)}
        onSubmit={addParty}
      />

      {/* 60% Black Screen + Gradient Aurora Voice Animation */}
      <AuroraVoiceOverlay
        visible={voiceState !== 'idle'}
        state={voiceState === 'processing' ? 'processing' : 'recording'}
        durationSeconds={voiceDuration}
        promptText={`“${COPY.home.examples[promptIdx]}”`}
        onStop={stopVoiceCaptureAndParse}
        onCancel={() => abortVoiceCapture()}
      />

      <VoiceAssistantModal
        visible={voiceOpen}
        currency={storeProfile.currency}
        language={storeProfile.language}
        parties={parties}
        transactions={transactions}
        initialResult={voiceResult}
        onClose={() => {
          setVoiceOpen(false);
          setVoiceResult(null);
        }}
        onParseVoice={applyVoiceEntry}
        onUpdateTransaction={saveEditedTransaction}
        onDeleteTransaction={deleteTransaction}
        onDeleteParty={deleteParty}
      />

      <ApiConfigModal
        visible={apiConfigOpen}
        storeProfile={storeProfile}
        onClose={() => setApiConfigOpen(false)}
        onSaveConfig={(url, connected) =>
          saveProfile({
            ...storeProfile,
            expressApiUrl: url,
            isBackendConnected: connected,
          })
        }
      />
    </View>
  );
}

/** Cross-fades whichever screen is mounted when the tab changes. */
const ScreenTransition: React.FC<{
  tabKey: string;
  children: React.ReactNode;
}> = ({ tabKey, children }) => {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: MOTION.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tabKey, fade]);

  return (
    <Animated.View style={[styles.screen, { opacity: fade }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  app: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  screen: {
    flex: 1,
  },
  splash: {
    zIndex: 999,
    backgroundColor: '#ffffff',
  },
});
