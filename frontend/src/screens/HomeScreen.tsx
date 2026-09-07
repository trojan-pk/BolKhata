import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { DOCK_INSET, GUTTER, SPACE } from '../theme/tokens';
import { Party, Transaction } from '../types';
import { BalanceCard } from '../components/BalanceCard';
import { EntryRow } from '../components/EntryRow';
import {
  EmptyState,
  Enter,
  SectionHeader,
  SkeletonRow,
} from '../ui';

interface HomeScreenProps {
  parties: Party[];
  transactions: Transaction[];
  toCollect: number;
  toPay: number;
  currency: string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Increments when the active tab is tapped again. */
  scrollTopSignal?: number;
  onOpenVoiceReview?: () => void;
  onViewAllCustomers: () => void;
  onSelectTransaction: (txn: Transaction) => void;
  onVoiceResultParsed?: (result: unknown) => void;
}

/**
 * Clean, elegant dashboard:
 * Net position summary card followed immediately by recent transaction activity.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  parties,
  transactions,
  toCollect,
  toPay,
  currency,
  loading = false,
  refreshing = false,
  onRefresh,
  scrollTopSignal = 0,
  onViewAllCustomers,
  onSelectTransaction,
}) => {
  const [feedExpanded, setFeedExpanded] = useState(false);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollTopSignal > 0) {
      scroller.current?.scrollTo({ y: 0, animated: true });
    }
  }, [scrollTopSignal]);

  const FEED_PREVIEW = 5;
  const recent = feedExpanded
    ? transactions.slice(0, 50)
    : transactions.slice(0, FEED_PREVIEW);
  const canExpand = transactions.length > FEED_PREVIEW;

  return (
    <ScrollView
      ref={scroller}
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressBackgroundColor={COLORS.surface}
          />
        ) : undefined
      }
    >
      {/* ---------------------------------------------------- Net Position -- */}
      <View style={[styles.block, styles.topBlock]}>
        <BalanceCard
          toCollect={toCollect}
          toPay={toPay}
          accounts={parties.length}
          currency={currency}
          onPressCollect={onViewAllCustomers}
          onPressPay={onViewAllCustomers}
        />
      </View>

      {/* -------------------------------------------------- Recent Activity -- */}
      <View style={styles.block}>
        <SectionHeader
          title={COPY.home.recentActivity}
          meta={
            transactions.length > FEED_PREVIEW
              ? `${recent.length} of ${transactions.length}`
              : undefined
          }
          actionLabel={
            canExpand ? (feedExpanded ? 'Show less' : COPY.common.viewAll) : undefined
          }
          onAction={() => setFeedExpanded((prev) => !prev)}
        />

        {loading ? (
          <SkeletonRow count={3} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={COPY.home.emptyTitle}
            body={COPY.home.emptyBody}
          />
        ) : (
          <View style={styles.list}>
            {recent.map((txn, index) => (
              <Enter key={txn.id} index={index}>
                <EntryRow
                  transaction={txn}
                  currency={currency}
                  onPress={() => onSelectTransaction(txn)}
                />
              </Enter>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: DOCK_INSET,
  },
  topBlock: {
    marginTop: SPACE.md,
  },
  block: {
    paddingHorizontal: GUTTER,
    marginTop: SPACE.xl,
  },
  list: {
    gap: SPACE.sm,
  },
});
