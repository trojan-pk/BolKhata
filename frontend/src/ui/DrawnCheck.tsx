import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface DrawnCheckProps {
  size?: number;
  color?: string;
  /** Fires once the stroke has finished drawing. */
  onDone?: () => void;
}

/**
 * A checkmark that strokes itself on, for the one moment in the app that earns a
 * flourish: finishing setup.
 *
 * The ring springs in first and the tick draws over it, so the shape resolves in
 * two beats instead of appearing all at once. `strokeDashoffset` is an SVG prop
 * and can't go on the native driver — same constraint the recording ring in
 * `VoiceOrb` works under.
 */
export const DrawnCheck: React.FC<DrawnCheckProps> = ({
  size = 72,
  color = COLORS.credit,
  onDone,
}) => {
  /** Ring scale-in. Native-driven — it's a transform. */
  const ring = useRef(new Animated.Value(0)).current;
  /** Tick draw. Not native-driven: SVG prop. */
  const draw = useRef(new Animated.Value(0)).current;

  const stroke = Math.max(2.5, size * 0.055);
  const radius = (size - stroke) / 2;
  const center = size / 2;

  // The tick path, proportional to `size` so it scales cleanly.
  const tick = `M ${size * 0.28} ${size * 0.52} L ${size * 0.44} ${size * 0.68} L ${size * 0.73} ${size * 0.36}`;
  // Generous over-estimate of the path length — the exact value only needs to be
  // long enough to hide the stroke completely at offset 1.
  const tickLength = size * 0.95;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.spring(ring, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(draw, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (finished) onDone?.();
    });

    return () => sequence.stop();
    // `onDone` intentionally omitted: an unstable callback identity from the
    // parent would restart the whole sequence mid-draw.
  }, [ring, draw]);

  const dashOffset = draw.interpolate({
    inputRange: [0, 1],
    outputRange: [tickLength, 0],
  });

  return (
    <Animated.View
      style={[
        styles.stage,
        {
          width: size,
          height: size,
          opacity: ring,
          transform: [
            {
              scale: ring.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            opacity={0.28}
          />
          <AnimatedPath
            d={tick}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={`${tickLength} ${tickLength}`}
            strokeDashoffset={dashOffset as unknown as number}
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
