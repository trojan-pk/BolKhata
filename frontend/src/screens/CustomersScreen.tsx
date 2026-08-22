import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Search, SearchX, UserPlus, Users, X } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { GUTTER, SPACE, TYPE } from '../theme/tokens';
import { Party } from '../types';
import { CustomerCard } from '../components/CustomerCard';
import {
  Card,
  Chip,
  EmptyState,
  Enter,
  IconButton,
  Money,
  ScreenHeader,
  SkeletonRow,
  TextField,
  VDivider,
} from '../ui';

type Filter = 'all' | 'collect' | 'pay' | 'settled';

/**
 * The full customer list. Sorted by how much is outstanding rather than
 * alphabetically — the person who owes the most is the one you came here to
 * find. Settled accounts sink to the bottom, alphabetised.
 */
export const CustomersScreen: React.FC<{
  parties: Party[];
  currency?: string;
  loading?: boolean;
  onSelectParty: (party: Party) => void;
  onAddParty: () => void;
  initialFilter?: Filter;
}> = ({
  parties,
  currency = 'Rs',
  loading = false,
  onSelectParty,
  onAddParty,
  initialFilter = 'all',
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const counts = useMemo(
    () => ({
      all: parties.length,
      collect: parties.filter((p) => p.currentBalance > 0).length,
      pay: parties.filter((p) => p.currentBalance < 0).length,
      settled: parties.filter((p) => p.currentBalance === 0).length,
    }),
    [parties]
  );

  const totals = useMemo(
    () =>
      parties.reduce(
        (acc, party) => {
          if (party.currentBalance > 0) acc.collect += party.currentBalance;
          if (party.currentBalance < 0) acc.pay += Math.abs(party.currentBalance);
          return acc;
        },
        { collect: 0, pay: 0 }
      ),
    [parties]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');

    return parties
      .filter((party) => {
        if (needle) {
          const matchesName = party.name.toLowerCase().includes(needle);
          const matchesPhone =
            digits.length > 0 &&
            (party.mobile || '').replace(/\D/g, '').includes(digits);
          if (!matchesName && !matchesPhone) return false;
        }
        if (filter === 'collect') return party.currentBalance > 0;
        if (filter === 'pay') return party.currentBalance < 0;
        if (filter === 'settled') return party.currentBalance === 0;
        return true;
      })
      .sort((a, b) => {
        const aOpen = a.currentBalance !== 0;
        const bOpen = b.currentBalance !== 0;
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        if (aOpen) return Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
        return a.name.localeCompare(b.name);
      });
  }, [parties, query, filter]);

  const searching = query.trim().length > 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={COPY.customers.title}
        subtitle={
          parties.length > 0
            ? COPY.customers.countLabel(parties.length)
            : COPY.customers.subtitle
        }
        action={
          <IconButton
            icon={UserPlus}
            onPress={onAddParty}
            accessibilityLabel={COPY.customers.add}
            variant="ink"
            size={40}
          />
        }
      />

      <View style={styles.controls}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={COPY.customers.searchPlaceholder}
          icon={Search}
          autoCorrect={false}
          returnKeyType="search"
          accessory={
            searching ? (
              <IconButton
                icon={X}
                onPress={() => setQuery('')}
                accessibilityLabel="Clear search"
                variant="ghost"
                size={28}
              />
            ) : undefined
          }
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterRail}
      >
        <Chip
          label={COPY.customers.filterAll}
          count={counts.all}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <Chip
          label={COPY.customers.filterCollect}
          count={counts.collect}
          selected={filter === 'collect'}
          onPress={() => setFilter('collect')}
        />
        <Chip
          label={COPY.customers.filterPay}
          count={counts.pay}
          selected={filter === 'pay'}
          onPress={() => setFilter('pay')}
        />
        <Chip
          label={COPY.customers.filterSettled}
          count={counts.settled}
          selected={filter === 'settled'}
          onPress={() => setFilter('settled')}
        />
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {parties.length > 0 ? (
          <Card padding={0} style={styles.totals}>
            <TotalCell
              label={COPY.ledger.toCollect}
              value={totals.collect}
              currency={currency}
              tone="credit"
            />
            <VDivider height={34} />
            <TotalCell
              label={COPY.ledger.toPay}
              value={totals.pay}
              currency={currency}
              tone="debit"
            />
          </Card>
        ) : null}

        {loading ? (
          <SkeletonRow count={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={searching ? SearchX : Users}
            title={searching ? COPY.customers.noMatchTitle : COPY.customers.emptyTitle}
            body={searching ? COPY.customers.noMatchBody : COPY.customers.emptyBody}
            actionLabel={searching ? undefined : COPY.customers.add}
            actionIcon={UserPlus}
            onAction={onAddParty}
            size="full"
          />
        ) : (
          <View style={styles.rows}>
            {visible.map((party, index) => (
              <Enter key={party.id} index={index}>
                <CustomerCard
                  party={party}
                  currency={currency}
                  onPress={() => onSelectParty(party)}
                />
              </Enter>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const TotalCell: React.FC<{
  label: string;
  value: number;
  currency: string;
  tone: 'credit' | 'debit';
}> = ({ label, value, currency, tone }) => (
  <View style={styles.totalCell}>
    <Text style={[TYPE.caption, styles.totalLabel]}>{label}</Text>
    <Money value={value} currency={currency} size="title3" tone={tone} />
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: GUTTER,
  },
  filterRail: {
    flexGrow: 0,
    marginTop: SPACE.md,
  },
  filters: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.md,
    paddingBottom: 132,
    gap: SPACE.lg,
  },
  totals: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.md,
  },
  totalCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  totalLabel: {
    color: COLORS.textMuted,
  },
  rows: {
    gap: SPACE.sm,
  },
});
