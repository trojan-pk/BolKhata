import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, TYPE } from '../theme/tokens';
import { initialsOf, tintFor } from '../utils/format';

/**
 * Initials on a tint derived from the name, so the same customer always looks
 * the same without anyone having to pick a colour. Squircle rather than circle —
 * it reads as a record, not a social profile.
 */
export const Avatar: React.FC<{
  name: string;
  size?: number;
  /** Overrides the derived tint (used for the shop's own identity). */
  tone?: 'auto' | 'ink';
  style?: StyleProp<ViewStyle>;
}> = ({ name, size = 44, tone = 'auto', style }) => {
  const tint = tintFor(name);
  const bg = tone === 'ink' ? COLORS.ink : tint.bg;
  const fg = tone === 'ink' ? COLORS.textOnInk : tint.fg;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.34),
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={[
          TYPE.title3,
          {
            color: fg,
            fontSize: Math.round(size * 0.34),
            lineHeight: Math.round(size * 0.4),
          },
        ]}
        allowFontScaling={false}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
};

export type BadgeTone =
  | 'neutral'
  | 'credit'
  | 'debit'
  | 'accent'
  | 'warning'
  | 'ink'
  | 'onInk';

/** Small non-interactive label. Status, counts, account type. */
export const Badge: React.FC<{
  label: string;
  tone?: BadgeTone;
  /** Adds a leading dot — useful for live/offline status. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ label, tone = 'neutral', dot = false, style }) => {
  const skin = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, skin.box, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: skin.text }]} /> : null}
      <Text style={[TYPE.caption, styles.badgeText, { color: skin.text }]}>
        {label}
      </Text>
    </View>
  );
};

const BADGE_TONES: Record<BadgeTone, { box: ViewStyle; text: string }> = {
  neutral: {
    box: { backgroundColor: COLORS.surfaceMuted },
    text: COLORS.textSecondary,
  },
  credit: {
    box: { backgroundColor: COLORS.creditSoft },
    text: COLORS.creditStrong,
  },
  debit: {
    box: { backgroundColor: COLORS.debitSoft },
    text: COLORS.debitStrong,
  },
  accent: {
    box: { backgroundColor: COLORS.accentSoft },
    text: COLORS.accent,
  },
  warning: {
    box: { backgroundColor: COLORS.warningSoft },
    text: COLORS.warning,
  },
  ink: {
    box: { backgroundColor: COLORS.ink },
    text: COLORS.textOnInk,
  },
  onInk: {
    box: { backgroundColor: COLORS.inkLift },
    text: COLORS.textOnInk,
  },
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 11,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
