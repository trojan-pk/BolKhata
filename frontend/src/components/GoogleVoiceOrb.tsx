import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { VoiceLogo } from './VoiceLogo';

interface GoogleVoiceOrbProps {
  size?: number; // Outer diameter of the orb ring (e.g. 210)
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onPressOut: () => void;
}

export const GoogleVoiceOrb: React.FC<GoogleVoiceOrbProps> = ({
  size = 210,
  isRecording,
  isProcessing,
  onPress,
  onLongPress,
  onPressOut,
}) => {
  // Continuous 360-degree rotation for the gradient glowing orbital ring
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Gentle breathing / pulsing scale for active voice recognition
  const pulseScale = useRef(new Animated.Value(1)).current;
  const outerGlowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let rotateLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isRecording || isProcessing) {
      // 1. Smooth 360-degree orbital rotation (fast when processing, fluid when listening)
      rotateAnim.setValue(0);
      rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: isProcessing ? 1200 : 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();

      // 2. Subtle organic breathing pulse for the orb
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.04,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1.0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // 3. Outer glow expansion
      Animated.loop(
        Animated.sequence([
          Animated.timing(outerGlowScale, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(outerGlowScale, {
            toValue: 1.0,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotateAnim.setValue(0);
      pulseScale.setValue(1);
      outerGlowScale.setValue(1);
    }

    return () => {
      if (rotateLoop) rotateLoop.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isRecording, isProcessing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeWidth = isRecording ? 4.5 : 2.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const logoSize = Math.round(size * 0.44);

  return (
    <View style={[styles.wrapper, { width: size + 36, height: size + 36 }]}>
      {/* Outer Soft Ambient Glow Aura (Visible when listening/processing) */}
      {isRecording && (
        <Animated.View
          style={[
            styles.outerAura,
            {
              width: size + 30,
              height: size + 30,
              borderRadius: (size + 30) / 2,
              transform: [{ scale: outerGlowScale }],
            },
          ]}
        />
      )}

      {/* Main Interactive Button with No Solid Fill (Clean transparent canvas) */}
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        delayLongPress={350}
        delayPressIn={180}
        activeOpacity={0.88}
        style={[styles.touchTarget, { width: size, height: size }]}
      >
        <Animated.View
          style={[
            styles.orbContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pulseScale }],
            },
          ]}
        >
          {/* Orbital Gradient Recognition Ring */}
          <View style={StyleSheet.absoluteFill}>
            {isRecording || isProcessing ? (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <Defs>
                    {/* Google Official 4-Color Gradient: Blue -> Red -> Yellow -> Green -> Blue */}
                    <LinearGradient id="googleOrbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#4285F4" />
                      <Stop offset="25%" stopColor="#EA4335" />
                      <Stop offset="50%" stopColor="#FBBC05" />
                      <Stop offset="75%" stopColor="#34A853" />
                      <Stop offset="100%" stopColor="#4285F4" />
                    </LinearGradient>
                  </Defs>
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#googleOrbGrad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={isProcessing ? `${radius * 1.5} ${radius * 0.8}` : undefined}
                  />
                </Svg>
              </Animated.View>
            ) : (
              /* Idle Minimalist Ring */
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#cbd5e1"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              </Svg>
            )}
          </View>

          {/* Center Logo / Spinner (Clean Transparent Surface) */}
          <View style={styles.centerContent}>
            {isProcessing ? (
              <ActivityIndicator color="#4285F4" size="large" />
            ) : (
              /* 5-Bar BolKhata Voice Logo (Solid crisp black always, animated on active) */
              <VoiceLogo
                size={logoSize}
                color="#0f172a"
                multiColor={false}
                animated={isRecording}
              />
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
    backgroundColor: 'transparent',
  },
  outerAura: {
    position: 'absolute',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  touchTarget: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  orbContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
