import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { GUTTER, SPACE, TYPE } from '../theme/tokens';
import { LinkButton } from './Button';

/**
 * Standard screen title block. Every tab uses it, which is what makes the app
 * feel like one product rather than five screens that happen to ship together.
 */
export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  /** Trailing action — an icon button or a small button. */
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ title, subtitle, action, style }) => (
  <View style={[styles.screenHeader, style]}>
    <View style={styles.screenTitleCol}>
      <Text style={TYPE.title1} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[TYPE.bodySm, styles.screenSubtitle]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {action}
  </View>
);

/**
 * Divides content within a screen. Optional trailing link keeps "View all"
 * affordances in a predictable place.
 */
export const SectionHeader: React.FC<{
  title: string;
  /** Right-hand count or status, shown before the action. */
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ title, meta, actionLabel, onAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={TYPE.title3} numberOfLines={1}>
      {title}
    </Text>
    <View style={styles.sectionRight}>
      {meta ? (
        <Text style={[TYPE.caption, { color: COLORS.textMuted }]}>{meta}</Text>
      ) : null}
      {actionLabel ? <LinkButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  </View>
);

/** Quiet all-caps eyebrow, for grouping rows inside a card or a settings list. */
export const GroupLabel: React.FC<{ text: string; style?: StyleProp<ViewStyle> }> = ({
  text,
  style,
}) => (
  <View style={[styles.groupLabel, style]}>
    <Text style={[TYPE.overline, { color: COLORS.textFaint }]}>{text}</Text>
  </View>
);

/** Sticky date heading above a group of ledger or cash rows. */
export const DayHeading: React.FC<{ label: string; meta?: string }> = ({
  label,
  meta,
}) => (
  <View style={styles.dayHeading}>
    <Text style={[TYPE.label, { color: COLORS.textSecondary }]}>{label}</Text>
    {meta ? (
      <Text style={[TYPE.caption, { color: COLORS.textFaint }]}>{meta}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.lg,
  },
  screenTitleCol: {
    flex: 1,
    gap: 2,
  },
  screenSubtitle: {
    color: COLORS.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  groupLabel: {
    marginBottom: SPACE.sm,
  },
  dayHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.sm,
  },
});
