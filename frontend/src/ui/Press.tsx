import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MOTION, NO_OUTLINE } from '../theme/tokens';

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. `1` disables the sink. */
  scale?: number;
  /** Opacity at full press. */
  dim?: number;
  children?: React.ReactNode;
}

/**
 * The single tappable primitive. Every touch in the app runs through it, so
 * press feedback is identical everywhere: a spring-driven sink plus a slight
 * dim, native-driven so it never stutters behind a busy JS thread.
 */
export const Press: React.FC<PressProps> = ({
  style,
  scale = 0.97,
  dim = 0.9,
  disabled,
  children,
  ...rest
}) => {
  const progress = useRef(new Animated.Value(0)).current;

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

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => animate(1)}
      onPressOut={() => animate(0)}
      accessibilityRole="button"
      style={[NO_OUTLINE, outerLayout]}
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
      </Animated.View>
    </Pressable>
  );
};

/**
 * Fade-and-rise entrance used by list rows and cards. Index-staggered so a
 * screen assembles itself instead of snapping in all at once.
 */
export const Enter: React.FC<{
  index?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ index = 0, distance = 8, style, children }) => {
  const progress = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: MOTION.base,
        useNativeDriver: true,
      }).start();
    }, Math.min(index, 8) * 35);
    return () => clearTimeout(timer);
  }, [index, progress]);

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
