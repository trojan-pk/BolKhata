import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { TYPE } from '../theme/tokens';
import { Party } from '../types';
import { Avatar, Money, Row } from '../ui';
import { formatPhone, formatRelativeDate } from '../utils/format';

/**
 * A customer as a list row.
 *
 * The balance label follows the convention shopkeepers already use: green for
 * what you will get, red for what you will give. (The previous build had these
 * inverted against the home screen — one convention now, everywhere.)
 */
export const CustomerCard: React.FC<{
  party: Party;
  currency?: string;
  onPress: () => void;
}> = ({ party, currency = 'Rs', onPress }) => {
  const balance = party.currentBalance;
  const settled = balance === 0;
  const toCollect = balance > 0;

  const label = settled
    ? COPY.common.settled
    : toCollect
    ? COPY.ledger.toCollect
    : COPY.ledger.toPay;

  const subtitle = [
    party.mobile ? formatPhone(party.mobile) : null,
    formatRelativeDate(party.lastUpdated),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Row
      onPress={onPress}
      chevron
      accessibilityLabel={`${party.name}, ${label} ${currency} ${Math.abs(balance)}`}
      leading={<Avatar name={party.name} size={42} />}
      title={party.name}
      subtitle={subtitle}
      trailing={
        <>
          <Money
            value={balance}
            currency={currency}
            size="body"
            tone={settled ? 'muted' : toCollect ? 'credit' : 'debit'}
          />
          <Text style={[TYPE.caption, styles.label]}>{label}</Text>
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  label: {
    color: COLORS.textFaint,
  },
});
