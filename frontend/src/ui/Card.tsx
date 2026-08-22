import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { ELEV, RADIUS, SPACE } from '../theme/tokens';

interface CardProps {
  children?: React.ReactNode;
  /** `flat` is the default: hairline border, no shadow. */
  elevation?: 'flat' | 'card' | 'raised';
  padding?: number;
  tone?: 'surface' | 'muted' | 'ink' | 'accent' | 'credit' | 'debit' | 'warning';
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<string, ViewStyle> = {
  surface: { backgroundColor: COLORS.surface, borderColor: COLORS.hairline },
  muted: { backgroundColor: COLORS.surfaceMuted, borderColor: 'transparent' },
  ink: { backgroundColor: COLORS.ink, borderColor: COLORS.inkSoft },
  accent: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentBorder },
  credit: { backgroundColor: COLORS.creditSoft, borderColor: COLORS.creditBorder },
  debit: { backgroundColor: COLORS.debitSoft, borderColor: COLORS.debitBorder },
  warning: { backgroundColor: COLORS.warningSoft, borderColor: COLORS.warningBorder },
};

/**
 * The container everything sits in. Depth is carried by a 1px hairline rather
 * than a shadow, which keeps a screen full of cards from looking quilted.
 */
export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'flat',
  padding = SPACE.lg,
  tone = 'surface',
  radius = RADIUS.lg,
  style,
}) => (
  <View
    style={[
      styles.card,
      TONES[tone],
      ELEV[elevation],
      { padding, borderRadius: radius },
      style,
    ]}
  >
    {children}
  </View>
);

/** Hairline rule. `inset` pulls it clear of a card's padding. */
export const Divider: React.FC<{ inset?: number; style?: StyleProp<ViewStyle> }> = ({
  inset = 0,
  style,
}) => <View style={[styles.divider, { marginLeft: inset }, style]} />;

/** Vertical rule for split stat rows. */
export const VDivider: React.FC<{ height?: number; tone?: 'light' | 'ink' }> = ({
  height = 28,
  tone = 'light',
}) => (
  <View
    style={{
      width: StyleSheet.hairlineWidth * 2,
      height,
      backgroundColor: tone === 'ink' ? COLORS.inkLift : COLORS.hairline,
    }}
  />
);

/** Fixed-height spacer, for when margin would collapse awkwardly. */
export const Gap: React.FC<{ size?: number }> = ({ size = SPACE.lg }) => (
  <View style={{ height: size }} />
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.hairline,
  },
});
