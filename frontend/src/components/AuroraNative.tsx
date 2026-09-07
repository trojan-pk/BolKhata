import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export interface AuroraNativeProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  lightMode?: boolean;
}

const DEFAULT_STOPS: string[] = ['#7cff67', '#B497CF', '#5227FF'];

export default function AuroraNative({
  colorStops = DEFAULT_STOPS,
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
}: AuroraNativeProps) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = Math.max(1500, 6000 / speed);

    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 1,
          duration: duration * 0.9,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave1, {
          toValue: 0,
          duration: duration * 0.9,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave2, {
          toValue: 1,
          duration: duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 0,
          duration: duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave3, {
          toValue: 1,
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 0,
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [speed, wave1, wave2, wave3]);

  const color0 = colorStops[0] || DEFAULT_STOPS[0];
  const color1 = colorStops[1] || DEFAULT_STOPS[1];
  const color2 = colorStops[2] || DEFAULT_STOPS[2];

  const tX1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [-35 * amplitude, 35 * amplitude],
  });

  const tY1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30 * amplitude],
  });

  const scaleY1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.25],
  });

  const tX2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [30 * amplitude, -30 * amplitude],
  });

  const scaleY2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [1.2, 0.9],
  });

  const tX3 = wave3.interpolate({
    inputRange: [0, 1],
    outputRange: [-20 * amplitude, 20 * amplitude],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Wave Layer 1 */}
      <Animated.View
        style={[
          styles.curtain,
          {
            opacity: 0.75 * blend + 0.25,
            transform: [
              { translateX: tX1 },
              { translateY: tY1 },
              { scaleY: scaleY1 },
            ],
          },
        ]}
      >
        <Svg height="100%" width="120%" viewBox="0 0 500 800" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="auroraGrad1" x1="0" y1="1" x2="0.3" y2="0">
              <Stop offset="0%" stopColor={color0} stopOpacity="0.85" />
              <Stop offset="40%" stopColor={color1} stopOpacity="0.65" />
              <Stop offset="75%" stopColor={color2} stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 0 800 L 0 350 Q 150 200 280 320 T 500 260 L 500 800 Z"
            fill="url(#auroraGrad1)"
          />
        </Svg>
      </Animated.View>

      {/* Wave Layer 2 */}
      <Animated.View
        style={[
          styles.curtain,
          {
            opacity: 0.7 * blend + 0.3,
            transform: [
              { translateX: tX2 },
              { scaleY: scaleY2 },
            ],
          },
        ]}
      >
        <Svg height="100%" width="120%" viewBox="0 0 500 800" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="auroraGrad2" x1="0.5" y1="1" x2="0.1" y2="0">
              <Stop offset="0%" stopColor={color1} stopOpacity="0.8" />
              <Stop offset="50%" stopColor={color2} stopOpacity="0.6" />
              <Stop offset="80%" stopColor={color0} stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 0 800 L 0 420 Q 180 260 320 380 T 500 300 L 500 800 Z"
            fill="url(#auroraGrad2)"
          />
        </Svg>
      </Animated.View>

      {/* Wave Layer 3 */}
      <Animated.View
        style={[
          styles.curtain,
          {
            opacity: 0.5 * blend + 0.3,
            transform: [{ translateX: tX3 }],
          },
        ]}
      >
        <Svg height="100%" width="120%" viewBox="0 0 500 800" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="auroraGrad3" x1="0.2" y1="1" x2="0.6" y2="0">
              <Stop offset="0%" stopColor={color2} stopOpacity="0.75" />
              <Stop offset="45%" stopColor={color0} stopOpacity="0.55" />
              <Stop offset="85%" stopColor={color1} stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 0 800 L 0 480 Q 220 340 360 450 T 500 380 L 500 800 Z"
            fill="url(#auroraGrad3)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    ...StyleSheet.absoluteFillObject,
    left: '-10%',
    width: '120%',
  },
});
