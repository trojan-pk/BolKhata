import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Press } from './Press';

/**
 * Selectable pill. Used for filters, currencies, categories — anywhere a small
 * set of options should stay visible rather than hide behind a picker.
 */
export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Trailing count, e.g. the number of customers matching a filter. */
  count?: number;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}> = ({ label, selected = false, onPress, count, icon: Icon, size = 'md', style }) => {
  const tint = selected ? COLORS.textOnInk : COLORS.textSecondary;
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      scale={0.96}
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : styles.chipMd,
        selected ? styles.chipOn : styles.chipOff,
        style,
      ]}
    >
      {Icon ? <Icon size={13} color={tint} strokeWidth={2.2} /> : null}
      <Text style={[TYPE.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined ? (
        <View
          style={[
            styles.count,
            {
              backgroundColor: selected ? COLORS.inkLift : COLORS.surfaceSunken,
            },
          ]}
        >
          <Text
            style={[
              TYPE.caption,
              styles.countText,
              { color: selected ? COLORS.textOnInk : COLORS.textMuted },
            ]}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Press>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipSm: {
    paddingHorizontal: SPACE.md,
    height: 30,
  },
  chipMd: {
    paddingHorizontal: SPACE.lg - 2,
    height: 36,
  },
  chipOn: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  chipOff: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.hairlineStrong,
  },
  count: {
    minWidth: 18,
    paddingHorizontal: 4,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
