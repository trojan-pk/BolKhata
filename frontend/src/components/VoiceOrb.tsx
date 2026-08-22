import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { NO_OUTLINE } from '../theme/tokens';
import { VoiceLogo } from './VoiceLogo';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type OrbState = 'idle' | 'recording' | 'processing';

interface VoiceOrbProps {
  size?: number;
  state: OrbState;
  /** Recording auto-stops at this point; the ring shows time remaining. */
  maxDurationMs?: number;
  onPress: () => void;
  onLongPress: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}

/**
 * The app's centrepiece. Three states, each legible at a glance from across a
 * shop counter:
 *
 *   idle        a single hairline ring around the brand mark
 *   recording   an accent ring that drains as the 30s window elapses, with the
 *               waveform mark alive in the middle and halos breathing outward
 *   processing   an indeterminate accent arc spinning while the audio is read
 *
 * The draining ring is doing real work — the capture window is finite, and this
 * is the only place that budget is visible.
 */
export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  size = 232,
  state,
  maxDurationMs = 30000,
  onPress,
  onLongPress,
  onPressOut,
  disabled = false,
}) => {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isActive = isRecording || isProcessing;

  /* ------------------------------------------------------------- geometry -- */
  const strokeWidth = isActive ? 3.5 : 1.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const markSize = Math.round(size * 0.4);

  /* ------------------------------------------------------------ animators -- */
  /** Drains the ring across the capture window. Not native-driven: SVG prop. */
  const drain = useRef(new Animated.Value(0)).current;
  /** Continuous rotation for the processing arc. */
  const spin = useRef(new Animated.Value(0)).current;
  /** Outward halo breathing while recording. */
  const halo1 = useRef(new Animated.Value(0)).current;
  const halo2 = useRef(new Animated.Value(0)).current;
  /** Gentle scale so the orb feels responsive the instant capture begins. */
  const lift = useRef(new Animated.Value(0)).current;

  // Ring drain — restarts from full on each new recording.
  useEffect(() => {
    if (isRecording) {
      drain.setValue(0);
      Animated.timing(drain, {
        toValue: 1,
        duration: maxDurationMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      drain.stopAnimation();
      drain.setValue(0);
    }
  }, [isRecording, maxDurationMs, drain]);

  // Processing arc rotation.
  useEffect(() => {
    if (!isProcessing) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [isProcessing, spin]);

  // Halos + lift.
  useEffect(() => {
    Animated.spring(lift, {
      toValue: isActive ? 1 : 0,
      friction: 14,
      tension: 160,
      useNativeDriver: true,
    }).start();

    if (!isRecording) {
      halo1.setValue(0);
      halo2.setValue(0);
      return;
    }

    const wave = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const loops = [wave(halo1, 0), wave(halo2, 900)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [isRecording, isActive, halo1, halo2, lift]);

  /* ------------------------------------------------------ derived styles -- */
  const dashOffset = drain.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const orbScale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const haloStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0.16, 0],
    }),
    transform: [
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1.24],
        }),
      },
    ],
  });

  const ringTint = isActive ? COLORS.accent : COLORS.hairlineStrong;
  const stageSize = Math.round(size * 1.3);

  return (
    <View style={[styles.stage, { width: stageSize, height: stageSize }]}>
      {/* Breathing halos, recording only. */}
      {isRecording ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              { width: size, height: size, borderRadius: size / 2 },
              haloStyle(halo1),
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              { width: size, height: size, borderRadius: size / 2 },
              haloStyle(halo2),
            ]}
          />
        </>
      ) : null}

      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        delayLongPress={320}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          isRecording
            ? 'Recording. Release or tap to finish'
            : isProcessing
            ? 'Understanding your entry'
            : 'Hold to speak a ledger entry'
        }
        accessibilityState={{ busy: isProcessing, disabled }}
        style={[styles.touch, { width: size, height: size }, NO_OUTLINE]}
      >
        <Animated.View
          style={[
            styles.orb,
            { width: size, height: size, transform: [{ scale: orbScale }] },
          ]}
        >
          {/* Track ring — always present, so the orb never looks unfinished. */}
          <View style={StyleSheet.absoluteFill}>
            <Svg width={size} height={size}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isActive ? COLORS.accentBorder : COLORS.hairlineStrong}
                strokeWidth={isActive ? 2 : strokeWidth}
                fill="none"
              />
            </Svg>
          </View>

          {/* Draining time ring — recording only. */}
          {isRecording ? (
            <View style={[StyleSheet.absoluteFill, styles.quarterTurn]}>
              <Svg width={size} height={size}>
                <AnimatedCircle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={ringTint}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={dashOffset as unknown as number}
                />
              </Svg>
            </View>
          ) : null}

          {/* Indeterminate arc — processing only. */}
          {isProcessing ? (
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotation }] }]}
            >
              <Svg width={size} height={size}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={COLORS.accent}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference * 0.28} ${circumference}`}
                />
              </Svg>
            </Animated.View>
          ) : null}

          {/* Brand waveform mark. Same five bars as the splash. */}
          <View style={styles.mark}>
            <VoiceLogo
              size={markSize}
              color={isActive ? COLORS.accent : COLORS.ink}
              animated={isRecording}
            />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
  },
  touch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Puts the arc's start point at 12 o'clock instead of 3. */
  quarterTurn: {
    transform: [{ rotate: '-90deg' }],
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
