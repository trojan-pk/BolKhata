import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { ELEV, RADIUS, SPACE, TYPE } from '../theme/tokens';
import { AnimatedMoney, Badge, Money, Press } from '../ui';

/** On-ink money tints. The palette's `credit`/`debit` are tuned for paper and
 *  go muddy against `COLORS.ink`, so the card carries its own lifted pair. */
const ON_INK_CREDIT = '#34D399';
const ON_INK_DEBIT = '#FB7185';

/**
 * The one number that answers "how am I doing?" — net position, stated in words
 * as well as digits, with the two figures it's made of directly underneath.
 *
 * Rendered on ink so it reads as the anchor of the screen without needing a
 * shadow or a gradient to claim importance.
 */
export const BalanceCard: React.FC<{
  toCollect: number;
  toPay: number;
  accounts: number;
  currency: string;
  onPressCollect?: () => void;
  onPressPay?: () => void;
}> = ({ toCollect, toPay, accounts, currency, onPressCollect, onPressPay }) => {
  const net = toCollect - toPay;
  const caption =
    net > 0
      ? COPY.ledger.youAreOwed
      : net < 0
      ? COPY.ledger.youOwe
      : COPY.ledger.allSquare;

  /*
    Owed and owing used to render as the same white figure, distinguished only
    by a muted caption below it — the one number on the screen you cannot afford
    to read backwards. It now carries three reinforcing cues: a minus sign, a
    directional arrow, and a tinted caption.
  */
  const CaptionIcon = net > 0 ? ArrowDownLeft : net < 0 ? ArrowUpRight : Minus;
  const captionTint =
    net > 0 ? ON_INK_CREDIT : net < 0 ? ON_INK_DEBIT : COLORS.textOnInkMuted;

  return (
    <View style={[styles.card, ELEV.card]}>
      <View style={styles.head}>
        <Text style={[TYPE.overline, styles.eyebrow]}>
          {COPY.ledger.netPosition}
        </Text>
        {accounts > 0 ? (
          <Badge
            label={COPY.reports.partiesLabel(accounts)}
            tone="onInk"
          />
        ) : null}
      </View>

      <AnimatedMoney
        value={net}
        currency={currency}
        size="display"
        tone="onInk"
        signed
        style={styles.net}
      />

      <View style={styles.captionRow}>
        <CaptionIcon size={13} color={captionTint} strokeWidth={2.8} />
        <Text style={[TYPE.bodySm, styles.caption, { color: captionTint }]}>
          {caption}
        </Text>
      </View>

      <View style={styles.split}>
        <SplitStat
          label={COPY.ledger.toCollect}
          value={toCollect}
          currency={currency}
          tone="credit"
          onPress={onPressCollect}
        />
        <View style={styles.splitRule} />
        <SplitStat
          label={COPY.ledger.toPay}
          value={toPay}
          currency={currency}
          tone="debit"
          onPress={onPressPay}
        />
      </View>
    </View>
  );
};

const SplitStat: React.FC<{
  label: string;
  value: number;
  currency: string;
  tone: 'credit' | 'debit';
  onPress?: () => void;
}> = ({ label, value, currency, tone, onPress }) => {
  const isCredit = tone === 'credit';
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
  const tint = isCredit ? '#10B981' : '#F43F5E';
  const badgeBg = isCredit ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';

  return (
    <Press
      onPress={onPress}
      disabled={!onPress}
      scale={0.98}
      dim={0.75}
      // Sitting on ink, so the hover wash has to lighten rather than darken.
      hoverTone="light"
      accessibilityLabel={`${label}, ${currency} ${Math.abs(value)}`}
      style={styles.stat}
    >
      <View style={styles.statHead}>
        <View style={[styles.statIconBadge, { backgroundColor: badgeBg }]}>
          <Icon size={12} color={tint} strokeWidth={2.8} />
        </View>
        <Text style={[TYPE.caption, styles.statLabel]}>{label}</Text>
      </View>
      <Money
        value={value}
        currency={currency}
        size="title3"
        tone="onInk"
        style={styles.statValue}
      />
    </Press>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.ink,
    borderRadius: RADIUS.xl,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.xs,
    paddingHorizontal: SPACE.xl,
    borderWidth: 1,
    borderColor: COLORS.inkSoft,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
  },
  eyebrow: {
    color: COLORS.textOnInkMuted,
  },
  net: {
    marginTop: SPACE.md,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  caption: {
    fontWeight: '600',
  },
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: SPACE.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.inkSoft,
    marginHorizontal: -SPACE.xl,
    paddingHorizontal: SPACE.xs,
  },
  splitRule: {
    width: 1,
    backgroundColor: COLORS.inkSoft,
    marginVertical: SPACE.md,
  },
  stat: {
    flex: 1,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg - 4,
    gap: 4,
  },
  statHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: COLORS.textOnInkMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 17,
  },
});
