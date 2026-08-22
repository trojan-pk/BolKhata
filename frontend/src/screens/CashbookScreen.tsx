import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Minus,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { GUTTER, SPACE, TYPE } from '../theme/tokens';
import { CashbookEntry } from '../types';
import {
  AmountField,
  Button,
  Card,
  Chip,
  DayHeading,
  EmptyState,
  Enter,
  IconButton,
  IconWell,
  Label,
  Money,
  Row,
  ScreenHeader,
  Segmented,
  Sheet,
  TextField,
  VDivider,
  useFeedback,
} from '../ui';
import { formatRelativeDate, groupByDate, parseAmount } from '../utils/format';

type EntryDirection = 'in' | 'out';

/**
 * Cash that moves through the shop but isn't tied to a customer's ledger.
 * Entries are grouped by day with a per-day net, because "what did today
 * actually leave me with" is the question this screen exists to answer.
 */
export const CashbookScreen: React.FC<{
  entries: CashbookEntry[];
  currency?: string;
  onAddCashEntry: (entry: {
    type: EntryDirection;
    amount: number;
    category: string;
    note: string;
  }) => void;
  onDeleteCashEntry?: (id: string) => void;
}> = ({ entries, currency = 'Rs', onAddCashEntry, onDeleteCashEntry }) => {
  const { toast, confirm } = useFeedback();

  const [composerOpen, setComposerOpen] = useState(false);
  const [direction, setDirection] = useState<EntryDirection>('in');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(COPY.cashbook.categories.in[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, entry) => {
          if (entry.type === 'in') acc.in += entry.amount;
          else acc.out += entry.amount;
          return acc;
        },
        { in: 0, out: 0 }
      ),
    [entries]
  );

  const days = useMemo(() => groupByDate(entries), [entries]);

  const openComposer = (next: EntryDirection) => {
    setDirection(next);
    setCategory(COPY.cashbook.categories[next][0]);
    setAmount('');
    setNote('');
    setError(null);
    setComposerOpen(true);
  };

  const switchDirection = (next: EntryDirection) => {
    setDirection(next);
    setCategory(COPY.cashbook.categories[next][0]);
  };

  const save = () => {
    const value = parseAmount(amount);
    if (value <= 0) {
      setError(COPY.txn.invalidAmount);
      return;
    }
    onAddCashEntry({
      type: direction,
      amount: value,
      category,
      note: note.trim(),
    });
    setComposerOpen(false);
    toast(direction === 'in' ? 'Cash in recorded' : 'Cash out recorded');
  };

  const remove = async (entry: CashbookEntry) => {
    if (!onDeleteCashEntry) return;
    const ok = await confirm({
      title: 'Delete cash entry?',
      body: `${entry.category} · ${currency} ${entry.amount.toLocaleString('en-IN')} will be removed.`,
      confirmLabel: COPY.common.delete,
      destructive: true,
    });
    if (ok) {
      onDeleteCashEntry(entry.id);
      toast('Cash entry deleted');
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={COPY.cashbook.title} subtitle={COPY.cashbook.subtitle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------- summary -- */}
        <Card padding={SPACE.lg}>
          <Text style={[TYPE.overline, styles.eyebrow]}>{COPY.cashbook.inHand}</Text>
          <Money
            value={totals.in - totals.out}
            currency={currency}
            size="title1"
            tone={totals.in - totals.out < 0 ? 'debit' : 'ink'}
            style={styles.netValue}
          />

          <View style={styles.summarySplit}>
            <SummaryCell
              label={COPY.cashbook.cashIn}
              value={totals.in}
              currency={currency}
              tone="credit"
            />
            <VDivider height={34} />
            <SummaryCell
              label={COPY.cashbook.cashOut}
              value={totals.out}
              currency={currency}
              tone="debit"
            />
          </View>
        </Card>

        {/* ------------------------------------------------------- actions -- */}
        <View style={styles.actions}>
          <Button
            label={COPY.cashbook.addIn}
            icon={Plus}
            variant="credit"
            onPress={() => openComposer('in')}
            style={styles.actionButton}
          />
          <Button
            label={COPY.cashbook.addOut}
            icon={Minus}
            variant="debit"
            onPress={() => openComposer('out')}
            style={styles.actionButton}
          />
        </View>

        {/* --------------------------------------------------------- feed -- */}
        {entries.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={COPY.cashbook.emptyTitle}
            body={COPY.cashbook.emptyBody}
            actionLabel={COPY.cashbook.addIn}
            actionIcon={Plus}
            onAction={() => openComposer('in')}
            size="full"
          />
        ) : (
          days.map((day) => {
            const dayNet = day.items.reduce(
              (sum, item) => sum + (item.type === 'in' ? item.amount : -item.amount),
              0
            );
            return (
              <View key={day.key}>
                <DayHeading
                  label={day.label}
                  meta={`${COPY.cashbook.dayTotal} ${dayNet < 0 ? '−' : '+'} ${currency} ${Math.abs(
                    dayNet
                  ).toLocaleString('en-IN')}`}
                />
                <View style={styles.dayRows}>
                  {day.items.map((entry, index) => (
                    <Enter key={entry.id} index={index}>
                      <Row
                        leading={
                          <IconWell
                            icon={entry.type === 'in' ? ArrowDownLeft : ArrowUpRight}
                            tone={entry.type === 'in' ? 'credit' : 'debit'}
                          />
                        }
                        title={entry.category || 'Other'}
                        subtitle={entry.note || formatRelativeDate(entry.date)}
                        trailing={
                          <View style={styles.entryTrailing}>
                            <Money
                              value={entry.amount}
                              currency={currency}
                              size="body"
                              tone={entry.type === 'in' ? 'credit' : 'debit'}
                              sign={entry.type === 'in' ? '+' : '-'}
                            />
                            {onDeleteCashEntry ? (
                              <IconButton
                                icon={Trash2}
                                onPress={() => remove(entry)}
                                accessibilityLabel={`Delete ${entry.category} entry`}
                                variant="ghost"
                                size={30}
                              />
                            ) : null}
                          </View>
                        }
                      />
                    </Enter>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ------------------------------------------------------- composer -- */}
      <Sheet
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={direction === 'in' ? COPY.cashbook.newIn : COPY.cashbook.newOut}
        subtitle={COPY.common.today}
        footer={
          <Button
            label={COPY.common.save}
            variant={direction === 'in' ? 'credit' : 'debit'}
            onPress={save}
            fullWidth
            size="lg"
          />
        }
      >
        <Segmented
          segments={[
            { value: 'in', label: COPY.cashbook.cashIn, tone: 'credit' },
            { value: 'out', label: COPY.cashbook.cashOut, tone: 'debit' },
          ]}
          value={direction}
          onChange={(next) => switchDirection(next as EntryDirection)}
        />

        <AmountField
          value={amount}
          onChangeText={(next) => {
            setAmount(next);
            if (error) setError(null);
          }}
          currency={currency}
          tone={direction === 'in' ? 'credit' : 'debit'}
          autoFocus
          error={error}
        />

        <View>
          <Label text={COPY.cashbook.categoryLabel} />
          <View style={styles.categoryGrid}>
            {COPY.cashbook.categories[direction].map((item) => (
              <Chip
                key={item}
                label={item}
                size="sm"
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>
        </View>

        <TextField
          label={COPY.common.note}
          optional
          value={note}
          onChangeText={setNote}
          placeholder="Anything worth remembering"
        />
      </Sheet>
    </View>
  );
};

const SummaryCell: React.FC<{
  label: string;
  value: number;
  currency: string;
  tone: 'credit' | 'debit';
}> = ({ label, value, currency, tone }) => (
  <View style={styles.summaryCell}>
    <Text style={[TYPE.caption, styles.summaryLabel]}>{label}</Text>
    <Money value={value} currency={currency} size="title3" tone={tone} />
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: 132,
  },
  eyebrow: {
    color: COLORS.textMuted,
  },
  netValue: {
    marginTop: SPACE.xs,
  },
  summarySplit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACE.lg,
    paddingTop: SPACE.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  summaryLabel: {
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
  actionButton: {
    flex: 1,
  },
  dayRows: {
    gap: SPACE.sm,
  },
  entryTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
});
