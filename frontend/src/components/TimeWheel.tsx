import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityActionEvent,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';

export const WHEEL_ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 3; // selected row plus one neighbour above and below
const PAD = WHEEL_ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
/** Settle delay after the last scroll event; covers web, which has no momentum events. */
const SETTLE_MS = 110;

interface Props {
  /** Ordered values, e.g. 1–12 or 0–59. */
  values: number[];
  value: number;
  onChange: (next: number) => void;
  /** Spoken unit for screen readers, e.g. "hours". */
  label: string;
  width?: number;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/**
 * A scroll-to-pick number column. Rows fade and shrink with distance from the
 * centre; those transforms run on the native driver, so dragging costs no JS
 * work per frame. A plain ScrollView is enough for ≤60 rows, so there's no
 * list virtualisation to pay for.
 */
export const TimeWheel: React.FC<Props> = ({ values, value, onChange, label, width = 60 }) => {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Index the wheel is resting on; lets us tell our own scrolls from prop changes. */
  const restingIndex = useRef(Math.max(0, values.indexOf(value)));
  /** False until the first layout — native ScrollViews ignore scrollTo before then. */
  const positioned = useRef(false);

  const index = Math.max(0, values.indexOf(value));

  // Follow external changes (▲/▼, preset pills, reset on open) with a visible roll.
  useEffect(() => {
    if (!positioned.current || index === restingIndex.current) return;
    restingIndex.current = index;
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
  }, [index]);

  const onLayout = () => {
    if (positioned.current) return;
    positioned.current = true;
    restingIndex.current = index;
    const y = index * WHEEL_ITEM_HEIGHT;
    offsetRef.current = y;
    scrollY.setValue(y); // fade/scale are correct before the first scroll event
    scrollRef.current?.scrollTo({ y, animated: false });
  };

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    []
  );

  const settle = () => {
    const nextIndex = Math.min(
      values.length - 1,
      Math.max(0, Math.round(offsetRef.current / WHEEL_ITEM_HEIGHT))
    );
    const aligned = nextIndex * WHEEL_ITEM_HEIGHT;
    // Web may stop between rows; nudge onto the nearest one.
    if (Math.abs(offsetRef.current - aligned) > 1) {
      scrollRef.current?.scrollTo({ y: aligned, animated: true });
    }
    if (nextIndex !== restingIndex.current) {
      restingIndex.current = nextIndex;
      onChange(values[nextIndex]);
    }
  };

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          offsetRef.current = e.nativeEvent.contentOffset.y;
          if (settleTimer.current) clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(settle, SETTLE_MS);
        },
      }),
    // `settle` reads refs plus `values`/`onChange`; rebuild when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, onChange]
  );

  const step = (delta: number) => {
    const next = (index + delta + values.length) % values.length;
    onChange(values[next]);
  };

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') step(1);
    if (e.nativeEvent.actionName === 'decrement') step(-1);
  };

  return (
    <View
      style={[styles.frame, { width }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${values[index]} ${label}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
    >
      {/* Centre band — same look as the old static digit box. */}
      <View pointerEvents="none" style={styles.band} />

      <Animated.ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onLayout}
        contentContainerStyle={{ paddingVertical: PAD }}
        // Web: CSS scroll snapping, since snapToInterval is native-only.
        style={Platform.OS === 'web' ? ({ scrollSnapType: 'y mandatory' } as any) : undefined}
      >
        {values.map((v, i) => {
          const center = i * WHEEL_ITEM_HEIGHT;
          const range = [center - 2 * WHEEL_ITEM_HEIGHT, center - WHEEL_ITEM_HEIGHT, center, center + WHEEL_ITEM_HEIGHT, center + 2 * WHEEL_ITEM_HEIGHT];
          const opacity = scrollY.interpolate({
            inputRange: range,
            outputRange: [0.15, 0.4, 1, 0.4, 0.15],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange: range,
            outputRange: [0.7, 0.8, 1, 0.8, 0.7],
            extrapolate: 'clamp',
          });
          return (
            <View
              key={v}
              style={[
                styles.item,
                Platform.OS === 'web' ? ({ scrollSnapAlign: 'center' } as any) : null,
              ]}
            >
              <Animated.Text
                style={[styles.itemText, { opacity, transform: [{ scale }] }]}
                importantForAccessibility="no"
              >
                {pad2(v)}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
    overflow: 'hidden',
    borderRadius: 14,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#E8F9F0',
    borderWidth: 1.5,
    borderColor: '#128C7E',
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#075E54',
    fontVariant: ['tabular-nums'],
  },
});
