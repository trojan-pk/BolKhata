import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Sparkles, Square } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';

interface AuroraVoiceOverlayProps {
  visible: boolean;
  state: 'recording' | 'processing';
  durationSeconds: number;
  promptText: string;
  onStop: () => void;
  onCancel: () => void;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * Full-screen 60% black overlay with a vibrant, flowing Aurora gradient glow
 * reminiscent of Apple Intelligence / luxury ambient AI interfaces.
 */
export const AuroraVoiceOverlay: React.FC<AuroraVoiceOverlayProps> = ({
  visible,
  state,
  durationSeconds,
  promptText,
  onStop,
  onCancel,
}) => {
  const { width, height } = useWindowDimensions();

  // Overlay fade & scale
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Aurora organic movement animators
  const auroraRotate = useRef(new Animated.Value(0)).current;
  const auroraPulse = useRef(new Animated.Value(0)).current;
  const auroraWave = useRef(new Animated.Value(0)).current;
  const auroraEdgeGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Continuous Aurora Rotation
      const rotateLoop = Animated.loop(
        Animated.timing(auroraRotate, {
          toValue: 1,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Continuous Breathing Pulse
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auroraPulse, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(auroraPulse, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      // Undulating Wave
      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auroraWave, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(auroraWave, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      // Screen edge glow pulse
      const edgeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auroraEdgeGlow, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(auroraEdgeGlow, {
            toValue: 0.4,
            duration: 1600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );

      rotateLoop.start();
      pulseLoop.start();
      waveLoop.start();
      edgeLoop.start();

      return () => {
        rotateLoop.stop();
        pulseLoop.stop();
        waveLoop.stop();
        edgeLoop.stop();
      };
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, auroraRotate, auroraPulse, auroraWave, auroraEdgeGlow]);

  if (!visible) return null;

  const spinInterpolation = auroraRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scaleInterpolation = auroraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.15],
  });

  const waveTranslateY = auroraWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const formattedTime = `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        { opacity: fadeAnim },
      ]}
      pointerEvents="box-none"
    >
      {/* 60% Black Tint Backdrop */}
      <Pressable
        style={styles.backdropTouch}
        onPress={onStop}
        accessibilityRole="button"
        accessibilityLabel="Stop recording"
      />

      {/* Screen Edge Aurora Glow (Bottom and lateral edges) */}
      <Animated.View
        style={[
          styles.screenEdgeAura,
          {
            opacity: auroraEdgeGlow,
            transform: [{ translateY: waveTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg height={260} width="100%" style={styles.edgeSvg}>
          <Defs>
            <LinearGradient id="edgeGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
              <Stop offset="40%" stopColor="#06B6D4" stopOpacity="0.25" />
              <Stop offset="80%" stopColor="#A855F7" stopOpacity="0.10" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="260" fill="url(#edgeGrad)" />
        </Svg>
      </Animated.View>

      {/* Floating Center Aurora Orb / Ribbons */}
      <View style={styles.auroraCenterContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.auroraGlowWrap,
            {
              transform: [
                { rotate: spinInterpolation },
                { scale: scaleInterpolation },
              ],
            },
          ]}
        >
          <Svg height={380} width={380} viewBox="0 0 380 380">
            <Defs>
              {/* Vibrant Multi-tone Aurora Gradients */}
              <RadialGradient
                id="auroraCore"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.85" />
                <Stop offset="30%" stopColor="#06B6D4" stopOpacity="0.75" />
                <Stop offset="60%" stopColor="#A855F7" stopOpacity="0.55" />
                <Stop offset="85%" stopColor="#EC4899" stopOpacity="0.30" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient
                id="auroraSecondary"
                cx="35%"
                cy="65%"
                rx="45%"
                ry="45%"
              >
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.70" />
                <Stop offset="50%" stopColor="#3B82F6" stopOpacity="0.40" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="380" height="380" fill="url(#auroraCore)" />
            <Rect x="0" y="0" width="380" height="380" fill="url(#auroraSecondary)" />
          </Svg>
        </Animated.View>

        {/* Counter-rotating secondary aurora wave for ethereal depth */}
        <Animated.View
          style={[
            styles.auroraGlowWrapSecondary,
            {
              transform: [
                {
                  rotate: auroraRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  }),
                },
                {
                  scale: auroraPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.1, 0.9],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg height={300} width={300} viewBox="0 0 300 300">
            <Defs>
              <RadialGradient id="auroraInner" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#F43F5E" stopOpacity="0.55" />
                <Stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.45" />
                <Stop offset="80%" stopColor="#06B6D4" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="300" height="300" fill="url(#auroraInner)" />
          </Svg>
        </Animated.View>
      </View>

      {/* Dynamic Content Display (Centered Above the Dock) */}
      <View style={styles.hudContainer} pointerEvents="box-none">
        {/* State Title with soft glowing indicator */}
        <View style={styles.statusPill}>
          <View
            style={[
              styles.pulseDot,
              {
                backgroundColor:
                  state === 'recording' ? '#22C55E' : '#38BDF8',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {state === 'recording'
              ? 'Listening...'
              : 'Understanding your entry...'}
          </Text>
        </View>

        {/* Dynamic Voice Prompt */}
        <Text style={styles.promptText} numberOfLines={2}>
          {state === 'recording'
            ? promptText
            : 'Analyzing Urdu & English audio...'}
        </Text>

        {/* Time counter or Processing indicator */}
        {state === 'recording' ? (
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>
              {formattedTime} <Text style={styles.timeTotal}>/ 0:30</Text>
            </Text>
          </View>
        ) : null}

        {/* Minimal Tap to Finish Prompt */}
        <Pressable
          style={({ pressed }) => [
            styles.finishBtn,
            pressed && styles.finishBtnPressed,
          ]}
          onPress={onStop}
        >
          <Square size={13} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.finishBtnText}>
            {state === 'recording' ? 'Tap mic or here to finish' : 'Processing...'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.60)', // Requested 60% black fade
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  screenEdgeAura: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
  },
  edgeSvg: {
    width: '100%',
    height: 260,
  },
  auroraCenterContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 380,
    height: 380,
  },
  auroraGlowWrap: {
    position: 'absolute',
    width: 380,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auroraGlowWrapSecondary: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudContainer: {
    alignItems: 'center',
    paddingBottom: 130, // Elevated above bottom navigation bar
    paddingHorizontal: SPACE.xl,
    gap: SPACE.sm + 2,
    zIndex: 1000,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' } as any,
    }),
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  statusText: {
    ...TYPE.label,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  promptText: {
    ...TYPE.title2,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 320,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontWeight: '700',
  },
  timeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  timeText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeTotal: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: SPACE.xs,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  finishBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
