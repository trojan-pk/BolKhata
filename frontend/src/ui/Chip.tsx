import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { IconComponent } from './icon';
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
  icon?: IconComponent;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}> = ({ label, selected = false, onPress, count, icon: Icon, size = 'md', style }) => {
  const tint = selected ? COLORS.textOnInk : COLORS.textSecondary;
  /*
    A filter with nothing behind it stays tappable — hiding it would make the
    rail jump around as balances change — but it reads back a step so the eye
    goes to the filters that will actually return something.
  */
  const empty = count === 0 && !selected;

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
        empty && styles.chipEmpty,
        style,
      ]}
    >
      {Icon ? (
        <Icon
          size={13}
          color={empty ? COLORS.textFaint : tint}
          strokeWidth={2.2}
        />
      ) : null}
      <Text
        style={[TYPE.label, { color: empty ? COLORS.textFaint : tint }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <View
          style={[
            styles.count,
            {
              backgroundColor: selected
                ? COLORS.inkLift
                : empty
                ? 'transparent'
                : COLORS.surfaceSunken,
            },
          ]}
        >
          <Text
            style={[
              TYPE.caption,
              styles.countText,
              {
                color: selected
                  ? COLORS.textOnInk
                  : empty
                  ? COLORS.textFaint
                  : COLORS.textMuted,
              },
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
    borderRadius: RADIUS.sm,
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
  chipEmpty: {
    backgroundColor: 'transparent',
    borderColor: COLORS.hairline,
  },
  count: {
    minWidth: 18,
    paddingHorizontal: 4,
    height: 17,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
