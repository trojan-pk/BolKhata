import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Mic } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { TYPE } from '../theme/tokens';
import { Transaction } from '../types';
import { IconWell, Money, Row } from '../ui';
import { formatRelativeDate, groupDigits } from '../utils/format';

/**
 * A single ledger entry. Shared by the home feed and a customer's statement —
 * `context` decides which fact leads: on home you're scanning for *who*, inside
 * a statement you already know who and are scanning for *what*.
 */
export const EntryRow: React.FC<{
  transaction: Transaction;
  currency: string;
  context?: 'feed' | 'statement';
  onPress?: () => void;
  /** Balance after this entry, shown in statements. */
  runningBalance?: number;
}> = ({ transaction, currency, context = 'feed', onPress, runningBalance }) => {
  const isGave = transaction.type === 'gave';
  const directionLabel = isGave ? COPY.ledger.youGave : COPY.ledger.youGot;
  const note = transaction.note?.trim();
  const when = formatRelativeDate(transaction.date);

  const title =
    context === 'feed'
      ? transaction.partyName || 'Customer'
      : note || (isGave ? COPY.ledger.creditGiven : COPY.ledger.paymentReceived);

  const subtitleParts =
    context === 'feed'
      ? [note, when].filter(Boolean)
      : [when, transaction.paymentMode ? capitalise(transaction.paymentMode) : null].filter(
          Boolean
        );

  return (
    <Row
      onPress={onPress}
      accessibilityLabel={`${title}, ${directionLabel} ${currency} ${transaction.amount}, ${when}`}
      leading={
        <IconWell
          icon={isGave ? ArrowUpRight : ArrowDownLeft}
          tone={isGave ? 'debit' : 'credit'}
        />
      }
      title={title}
      subtitle={subtitleParts.join(' · ')}
      meta={
        transaction.source === 'voice' ? (
          <View style={styles.voiceTag}>
            <Mic size={9} color={COLORS.accent} strokeWidth={2.4} />
            <Text style={[TYPE.caption, styles.voiceTagText]}>Voice</Text>
          </View>
        ) : null
      }
      trailing={
        <>
          <Money
            value={transaction.amount}
            currency={currency}
            size="body"
            tone={isGave ? 'debit' : 'credit'}
            sign={isGave ? '-' : '+'}
          />
          <Text style={[TYPE.caption, styles.direction]}>
            {runningBalance === undefined
              ? directionLabel
              : `${COPY.ledger.balance} ${currency} ${groupDigits(runningBalance)}`}
          </Text>
        </>
      }
    />
  );
};

function capitalise(value: string): string {
  if (value.toLowerCase() === 'upi') return 'Bank / online';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  direction: {
    color: COLORS.textFaint,
  },
  voiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  voiceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
