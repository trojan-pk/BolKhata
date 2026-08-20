import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface VoiceLogoProps {
  size?: number; // overall height in px (e.g. 56)
  color?: string; // bar color (default #000000)
  animated?: boolean;
}

export const VoiceLogo: React.FC<VoiceLogoProps> = ({
  size = 56,
  color = '#000000',
  animated = false,
}) => {
  // Symmetrical voice wave animators (Center -> Mid -> Outer)
  const scaleCenter = useRef(new Animated.Value(1)).current;
  const scaleMidLeft = useRef(new Animated.Value(1)).current;
  const scaleMidRight = useRef(new Animated.Value(1)).current;
  const scaleOuterLeft = useRef(new Animated.Value(1)).current;
  const scaleOuterRight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      scaleCenter.setValue(1);
      scaleMidLeft.setValue(1);
      scaleMidRight.setValue(1);
      scaleOuterLeft.setValue(1);
      scaleOuterRight.setValue(1);
      return;
    }

    // Natural voice signal equalizer waveform animation
    // Animates with harmonic audio rhythm while strictly preserving the iconic 5-bar structure
    const createVoicePulse = () => {
      const pulseBar = (
        anim: Animated.Value,
        minScale: number,
        maxScale: number,
        speed: number,
        delay: number
      ) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: maxScale,
              duration: speed,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: minScale,
              duration: speed * 0.9,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1.0,
              duration: speed * 0.8,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: true,
            }),
          ])
        );
      };

      // Voice signal harmonic sequence: center voice bursts outward through the channels
      const anims = [
        pulseBar(scaleCenter, 0.65, 1.75, 280, 0),
        pulseBar(scaleMidLeft, 0.75, 1.35, 320, 70),
        pulseBar(scaleMidRight, 0.75, 1.35, 320, 70),
        pulseBar(scaleOuterLeft, 0.85, 1.25, 360, 140),
        pulseBar(scaleOuterRight, 0.85, 1.25, 360, 140),
      ];

      anims.forEach((a) => a.start());

      return () => anims.forEach((a) => a.stop());
    };

    const cleanup = createVoicePulse();
    return cleanup;
  }, [animated]);

  // Exact geometric proportions matching the logo image:
  const barWidth = Math.max(3.5, size * 0.11);
  const gap = Math.max(3.5, size * 0.09);
  const borderRadius = 2; // Exact subtle radius from reference image

  const outerHeight = size * 1.0;  // 100%
  const midHeight = size * 0.72;   // 72%
  const centerHeight = size * 0.38; // 38%

  return (
    <View style={[styles.container, { height: size, gap }]}>
      {/* 1. Outer Left Bar (Tallest) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: outerHeight,
            backgroundColor: color,
            borderRadius,
            transform: [{ scaleY: scaleOuterLeft }],
          },
        ]}
      />

      {/* 2. Mid Left Bar (Medium) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: midHeight,
            backgroundColor: color,
            borderRadius,
            transform: [{ scaleY: scaleMidLeft }],
          },
        ]}
      />

      {/* 3. Center Bar (Short / Pulse core) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: centerHeight,
            backgroundColor: color,
            borderRadius,
            transform: [{ scaleY: scaleCenter }],
          },
        ]}
      />

      {/* 4. Mid Right Bar (Medium) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: midHeight,
            backgroundColor: color,
            borderRadius,
            transform: [{ scaleY: scaleMidRight }],
          },
        ]}
      />

      {/* 5. Outer Right Bar (Tallest) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: outerHeight,
            backgroundColor: color,
            borderRadius,
            transform: [{ scaleY: scaleOuterRight }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    // Symmetrical vertical origin
  },
});
