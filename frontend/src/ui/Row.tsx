import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Press } from './Press';

interface RowProps {
  /** Avatar, icon well, or direction badge. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Renders beneath the subtitle — tags, notes, secondary metadata. */
  meta?: React.ReactNode;
  /** Right-aligned block, usually an amount plus a label. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  /** `card` stands alone; `plain` sits inside a card with dividers between rows. */
  variant?: 'card' | 'plain';
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * One row shape for every list in the app — customers, ledger entries, cash
 * records, settings. Sharing it is what keeps rhythm and touch targets
 * consistent from screen to screen.
 */
export const Row: React.FC<RowProps> = ({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  onPress,
  chevron = false,
  variant = 'card',
  disabled,
  accessibilityLabel,
  style,
}) => {
  const content = (
    <>
      {leading}

      <View style={styles.body}>
        <Text style={[TYPE.title3, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[TYPE.caption, styles.subtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      {chevron ? (
        <ChevronRight size={17} color={COLORS.textFaint} strokeWidth={2} />
      ) : null}
    </>
  );

  const shell = [
    styles.row,
    variant === 'card' ? styles.rowCard : styles.rowPlain,
    style,
  ];

  if (!onPress) {
    return <View style={shell}>{content}</View>;
  }

  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || title}
      scale={0.985}
      dim={0.94}
      style={shell}
    >
      {content}
    </Press>
  );
};

/** Square tinted icon container that pairs with `Row`'s `leading` slot. */
export const IconWell: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tone?: 'neutral' | 'credit' | 'debit' | 'accent' | 'warning';
  size?: number;
}> = ({ icon: Icon, tone = 'neutral', size = 40 }) => {
  const skin = {
    neutral: { bg: COLORS.surfaceMuted, fg: COLORS.textSecondary },
    credit: { bg: COLORS.creditSoft, fg: COLORS.credit },
    debit: { bg: COLORS.debitSoft, fg: COLORS.debit },
    accent: { bg: COLORS.accentSoft, fg: COLORS.accent },
    warning: { bg: COLORS.warningSoft, fg: COLORS.warning },
  }[tone];

  return (
    <View
      style={[
        styles.iconWell,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: skin.bg,
        },
      ]}
    >
      <Icon size={Math.round(size * 0.45)} color={skin.fg} strokeWidth={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    minHeight: 60,
  },
  rowCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md + 2,
  },
  rowPlain: {
    paddingVertical: SPACE.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textMuted,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
