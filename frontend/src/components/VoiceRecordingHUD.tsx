import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { VoiceState } from '../hooks/useVoiceRecording';

interface VoiceRecordingHUDProps {
  state: VoiceState;
  durationSeconds: number;
  promptText: string;
  onStop: () => void;
  onCancel: () => void;
}

export const VoiceRecordingHUD: React.FC<VoiceRecordingHUDProps> = ({
  state,
  durationSeconds,
  promptText,
  onStop,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const isRecording = state === 'recording';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Clear dock height (64) + safe area bottom + 16px extra breathing space
  const bottomOffset = Math.max(insets.bottom, SPACE.md) + 64 + 16;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isRecording, pulseAnim]);

  const formattedTime = `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {/* Pulsing indicator / spinner */}
        <View style={styles.indicatorWrap}>
          {isRecording ? (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          ) : null}
          <View
            style={[
              styles.dot,
              {
                backgroundColor: isRecording ? '#EF4444' : COLORS.accent,
              },
            ]}
          />
        </View>

        {/* Content */}
        <Pressable
          style={styles.contentTouch}
          onPress={() => onStop()}
          accessibilityRole="button"
          accessibilityLabel="Stop recording"
        >
          <View style={styles.statusRow}>
            <Text style={styles.titleText}>
              {isRecording ? 'Listening...' : 'AI processing...'}
            </Text>
            {isRecording && (
              <Text style={styles.timeText}>
                {formattedTime} <Text style={styles.timeMax}>/ 0:30</Text>
              </Text>
            )}
          </View>

          <Text style={styles.promptText} numberOfLines={1}>
            {isRecording ? promptText : 'Converting speech into ledger entry...'}
          </Text>
        </Pressable>

        {/* Actions */}
        <View style={styles.actions}>
          {isRecording && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.doneBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onStop()}
              accessibilityRole="button"
              accessibilityLabel="Finish recording"
            >
              <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.cancelBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => onCancel()}
            accessibilityRole="button"
            accessibilityLabel="Cancel recording"
          >
            <X size={14} color="rgba(255, 255, 255, 0.7)" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: '#18181B', // Deep obsidian dark card
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
      } as any,
    }),
  },
  indicatorWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  contentTouch: {
    flex: 1,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    ...TYPE.label,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  timeMax: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '400',
  },
  promptText: {
    ...TYPE.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    backgroundColor: '#22C55E', // Green confirm
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
