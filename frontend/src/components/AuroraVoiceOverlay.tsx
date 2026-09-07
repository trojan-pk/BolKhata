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
import { Square } from 'lucide-react-native';
import Aurora from './Aurora';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';

interface AuroraVoiceOverlayProps {
  visible: boolean;
  state: 'recording' | 'processing';
  durationSeconds: number;
  promptText: string;
  onStop: () => void;
  onCancel: () => void;
}

/**
 * 60% black screen overlay featuring the React Bits <Aurora /> WebGL component.
 */
export const AuroraVoiceOverlay: React.FC<AuroraVoiceOverlayProps> = ({
  visible,
  state,
  durationSeconds,
  promptText,
  onStop,
  onCancel,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

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

      {/* React Bits Aurora Component (Fills the entire screen) */}
      <View style={styles.auroraContainer} pointerEvents="none">
        <Aurora
          colorStops={['#7cff67', '#B497CF', '#5227FF']}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </View>

      {/* Ambient Text / HUD Display (Above bottom dock) */}
      <View style={styles.hudContainer} pointerEvents="box-none">
        {/* State Title with glowing indicator */}
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

        {/* Live Elapsed Time */}
        {state === 'recording' ? (
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>
              {formattedTime} <Text style={styles.timeTotal}>/ 0:30</Text>
            </Text>
          </View>
        ) : null}

        {/* Minimal Tap to Finish */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.60)', // 60% black fade
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  auroraContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  hudContainer: {
    alignItems: 'center',
    paddingBottom: 130, // Positioned right above the bottom dock
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
