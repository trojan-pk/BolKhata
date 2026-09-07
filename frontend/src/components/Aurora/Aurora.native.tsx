import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';

export interface AuroraProps {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  lightMode?: boolean;
}

const DEFAULT_STOPS: [string, string, string] = ['#5227FF', '#7cff67', '#5227FF'];

export default function Aurora({
  colorStops = DEFAULT_STOPS,
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
}: AuroraProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = Math.max(2000, 8000 / speed);

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration * 0.35,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: duration * 0.35,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: duration * 0.25,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: duration * 0.25,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    rotateLoop.start();
    pulseLoop.start();
    waveLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      waveLoop.stop();
    };
  }, [speed, rotateAnim, scaleAnim, waveAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.0 + 0.25 * amplitude],
  });

  const translateY = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25 * amplitude],
  });

  const [color0, color1, color2] = colorStops;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View
        style={[
          styles.glowLayer,
          {
            transform: [
              { rotate: spin },
              { scale },
              { translateY },
            ],
            opacity: 0.65 + 0.35 * blend,
          },
        ]}
      >
        <Svg height="100%" width="100%" viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="auroraCore" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={color1} stopOpacity="0.85" />
              <Stop offset="45%" stopColor={color0} stopOpacity="0.65" />
              <Stop offset="80%" stopColor={color2} stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="auroraHaze" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor={color0} stopOpacity="0.5" />
              <Stop offset="50%" stopColor={color1} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color2} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="400" fill="url(#auroraCore)" />
          <Rect x="0" y="0" width="400" height="400" fill="url(#auroraHaze)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
