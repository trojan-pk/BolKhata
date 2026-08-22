import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { MOTION, NO_OUTLINE, RADIUS, TYPE } from '../theme/tokens';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Tints the thumb when this segment is active — used for gave/got. */
  tone?: 'ink' | 'credit' | 'debit' | 'accent';
}

/**
 * Two-to-four mutually exclusive options with a thumb that springs between
 * them. Width is measured rather than guessed, so the thumb lands exactly on
 * the label at any container size or font scale.
 */
export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  style,
  height = 44,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.value === value)
  );
  const position = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: activeIndex,
      ...MOTION.springSoft,
    }).start();
  }, [activeIndex, position]);

  const onLayout = (e: LayoutChangeEvent) =>
    setTrackWidth(e.nativeEvent.layout.width);

  const padding = 3;
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - padding * 2) / segments.length : 0;

  // `interpolate` needs at least two stops, so a single-segment control (which
  // shouldn't happen, but shouldn't crash either) gets a static range.
  const stops = segments.length > 1 ? segments.map((_, i) => i) : [0, 1];
  const offsets = stops.map((i) => padding + i * segmentWidth);

  const translateX = position.interpolate({
    inputRange: stops,
    outputRange: offsets,
  });

  const activeTone = segments[activeIndex]?.tone ?? 'ink';
  const thumbColor =
    activeTone === 'credit'
      ? COLORS.credit
      : activeTone === 'debit'
      ? COLORS.debit
      : activeTone === 'accent'
      ? COLORS.accent
      : COLORS.ink;

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, { height, padding, borderRadius: RADIUS.md }, style]}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              height: height - padding * 2,
              borderRadius: RADIUS.md - 3,
              backgroundColor: thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      {segments.map((segment) => {
        const isActive = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={segment.label}
            style={[styles.segment, NO_OUTLINE]}
          >
            <Text
              style={[
                TYPE.label,
                {
                  color: isActive ? COLORS.textOnInk : COLORS.textSecondary,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 0,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
