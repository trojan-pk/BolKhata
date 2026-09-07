import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  CURSOR,
  MOTION,
  NO_OUTLINE,
  PRESS_RETENTION,
} from '../theme/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';

const IS_WEB = Platform.OS === 'web';

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. `1` disables the sink. */
  scale?: number;
  /** Opacity at full press. */
  dim?: number;
  /**
   * Web hover wash. `false` opts out — right for bare text links, where a
   * rectangle of wash would appear around the words.
   */
  hover?: boolean;
  /**
   * Which way the hover wash goes. `light` for anything sitting on ink, where a
   * dark wash is invisible.
   */
  hoverTone?: 'dark' | 'light';
  /** Strength of the hover wash. Raise it for large, quiet surfaces. */
  hoverOpacity?: number;
  children?: React.ReactNode;
}

/** Corner radii are copied onto the hover wash so it can't bleed past them. */
const RADIUS_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
] as const;

/**
 * The single tappable primitive. Every touch in the app runs through it, so
 * press feedback is identical everywhere: a spring-driven sink plus a slight
 * dim, native-driven so it never stutters behind a busy JS thread.
 *
 * On web it also supplies the two affordances a pointer user needs and RN
 * doesn't give for free — a pointer cursor and a hover wash.
 */
export const Press: React.FC<PressProps> = ({
  style,
  scale = 0.97,
  dim = 0.9,
  hover = true,
  hoverTone = 'dark',
  hoverOpacity = hoverTone === 'light' ? 0.09 : 0.05,
  disabled,
  children,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const hoverProgress = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (to: number) => {
      Animated.spring(progress, {
        toValue: to,
        friction: 12,
        tension: 240,
        useNativeDriver: true,
      }).start();
    },
    [progress]
  );

  const animateHover = useCallback(
    (to: number) => {
      Animated.timing(hoverProgress, {
        toValue: to,
        duration: MOTION.fast,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [hoverProgress]
  );

  const animatedStyle = {
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, scale],
        }),
      },
    ],
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, dim],
    }),
  };

  const flattened = StyleSheet.flatten(style) || {};
  const {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    width,
    minWidth,
    maxWidth,
    alignSelf,
    ...innerStyle
  } = flattened;

  const outerLayout: ViewStyle = {
    ...(flex !== undefined ? { flex } : null),
    ...(flexGrow !== undefined ? { flexGrow } : null),
    ...(flexShrink !== undefined ? { flexShrink } : null),
    ...(flexBasis !== undefined ? { flexBasis } : null),
    ...(alignSelf ? { alignSelf } : null),
    ...(width !== undefined ? { width } : null),
    ...(minWidth !== undefined ? { minWidth } : null),
    ...(maxWidth !== undefined ? { maxWidth } : null),
    ...(margin !== undefined ? { margin } : null),
    ...(marginHorizontal !== undefined ? { marginHorizontal } : null),
    ...(marginVertical !== undefined ? { marginVertical } : null),
    ...(marginTop !== undefined ? { marginTop } : null),
    ...(marginBottom !== undefined ? { marginBottom } : null),
    ...(marginLeft !== undefined ? { marginLeft } : null),
    ...(marginRight !== undefined ? { marginRight } : null),
  };

  const showHover = IS_WEB && hover && !disabled;

  const washRadii = RADIUS_KEYS.reduce<ViewStyle>((acc, key) => {
    const value = (innerStyle as Record<string, unknown>)[key];
    if (typeof value === 'number') (acc as Record<string, unknown>)[key] = value;
    return acc;
  }, {});

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) animate(1);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(0);
        onPressOut?.(event);
      }}
      onHoverIn={showHover ? () => animateHover(1) : undefined}
      onHoverOut={showHover ? () => animateHover(0) : undefined}
      // A thumb rolls on release; without this the tap is lost to a few pixels.
      pressRetentionOffset={PRESS_RETENTION}
      accessibilityRole="button"
      style={[
        NO_OUTLINE,
        disabled ? CURSOR.disabled : CURSOR.pointer,
        outerLayout,
      ]}
      {...rest}
    >
      <Animated.View
        style={[
          innerStyle,
          animatedStyle,
          disabled && { opacity: 0.45 },
        ]}
      >
        {children}
        {showHover ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              washRadii,
              {
                backgroundColor: hoverTone === 'light' ? '#FFFFFF' : '#0B0F1A',
                opacity: hoverProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, hoverOpacity],
                }),
              },
            ]}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Fade-and-rise entrance used by list rows and cards. Index-staggered so a
 * screen assembles itself instead of snapping in all at once.
 *
 * The defaults are tuned for lists — quick, and capped at eight steps so a long
 * list never leaves the last row waiting. First-run screens override them with
 * `MOTION.stagger` / `MOTION.editorial` for a slower, more deliberate assembly.
 */
export const Enter: React.FC<{
  index?: number;
  distance?: number;
  /** Gap between siblings, in ms. */
  stagger?: number;
  duration?: number;
  /** Extra wait before the stagger clock starts, in ms. */
  delay?: number;
  /**
   * Steps after which the stagger stops accumulating. Lists cap this so row 40
   * doesn't wait a second and a half; a short first-run sequence lifts it so
   * every element gets its own beat.
   */
  maxSteps?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({
  index = 0,
  distance = 8,
  stagger = 35,
  duration = MOTION.base,
  delay = 0,
  maxSteps = 8,
  style,
  children,
}) => {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Reduce-motion asked for no entrance at all, so land at rest immediately
    // rather than playing a shorter version of the same slide.
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay + Math.min(index, maxSteps) * stagger);
    return () => clearTimeout(timer);
  }, [index, progress, stagger, duration, delay, maxSteps, reducedMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
