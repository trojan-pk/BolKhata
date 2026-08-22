import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE } from '../theme/tokens';

/**
 * Pulsing placeholder shown while the ledger loads off disk. Preferred over a
 * spinner because the layout is already known — the screen settles instead of
 * reflowing.
 */
export const Skeleton: React.FC<{
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '100%', height = 14, radius = RADIUS.xs, style }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: COLORS.surfaceSunken,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};

/** Row-shaped skeleton matching `Row`'s metrics, so nothing shifts on load. */
export const SkeletonRow: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.stack}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.row}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={styles.rowBody}>
          <Skeleton width={i % 2 === 0 ? '55%' : '42%'} height={13} />
          <Skeleton width="30%" height={10} />
        </View>
        <Skeleton width={68} height={16} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  stack: {
    gap: SPACE.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md + 2,
    minHeight: 60,
  },
  rowBody: {
    flex: 1,
    gap: 7,
  },
});
