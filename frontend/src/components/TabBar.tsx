import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Home,
  Mic,
  PieChart,
  Square,
  Users,
  Wallet,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import {
  CURSOR,
  ELEV,
  MAX_CONTENT_WIDTH,
  MOTION,
  NO_OUTLINE,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { IconComponent } from '../ui/icon';
import { VoiceState } from '../hooks/useVoiceRecording';

export type TabKey = 'home' | 'customers' | 'cashbook' | 'reports' | 'settings';

interface NavTab {
  key: TabKey;
  label: string;
  icon: IconComponent;
  colIndex: number;
}

const LEFT_TABS: NavTab[] = [
  { key: 'home', label: COPY.nav.home, icon: Home, colIndex: 0 },
  { key: 'customers', label: COPY.nav.customers, icon: Users, colIndex: 1 },
];

const RIGHT_TABS: NavTab[] = [
  { key: 'cashbook', label: COPY.nav.cashbook, icon: Wallet, colIndex: 3 },
  { key: 'reports', label: COPY.nav.reports, icon: PieChart, colIndex: 4 },
];

const TAB_COL_MAP: Record<TabKey, number> = {
  home: 0,
  customers: 1,
  cashbook: 3,
  reports: 4,
  settings: -1,
};

const TOTAL_COLS = 5;
const DOCK_HEIGHT = 64;
const PAD = 5;

export interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
  onPressVoice?: () => void;
  onPressInVoice?: () => void;
  onPressOutVoice?: () => void;
  voiceState?: VoiceState;
}

/**
 * Floating dock navigation with a prominent, tactile Center Mic action button.
 */
export const TabBar: React.FC<TabBarProps> = ({
  active,
  onChange,
  onPressVoice,
  onPressInVoice,
  onPressOutVoice,
  voiceState = 'idle',
}) => {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);

  const colIndex = TAB_COL_MAP[active] ?? 0;
  const isTabVisible = colIndex >= 0;

  const position = useRef(new Animated.Value(Math.max(0, colIndex))).current;
  const indicatorOpacity = useRef(new Animated.Value(isTabVisible ? 1 : 0)).current;

  useEffect(() => {
    if (isTabVisible) {
      Animated.parallel([
        Animated.spring(position, {
          toValue: colIndex,
          ...MOTION.spring,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [colIndex, isTabVisible, position, indicatorOpacity]);

  const itemWidth = trackWidth > 0 ? (trackWidth - PAD * 2) / TOTAL_COLS : 0;

  const translateX = position.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [
      PAD + 0 * itemWidth,
      PAD + 1 * itemWidth,
      PAD + 2 * itemWidth,
      PAD + 3 * itemWidth,
      PAD + 4 * itemWidth,
    ],
  });

  return (
    <View
      style={[styles.layer, { paddingBottom: Math.max(insets.bottom, SPACE.md) }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.dock, ELEV.raised]}
        onLayout={(e: LayoutChangeEvent) =>
          setTrackWidth(e.nativeEvent.layout.width)
        }
        accessibilityRole="tablist"
      >
        {itemWidth > 0 ? (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: itemWidth,
                opacity: indicatorOpacity,
                transform: [{ translateX }],
              },
            ]}
          />
        ) : null}

        {/* Left Tabs: Home, Customers */}
        {LEFT_TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={tab.key === active}
            onPress={() => onChange(tab.key)}
          />
        ))}

        {/* Center: Distinct Voice Mic Action Button */}
        <CenterMicButton
          voiceState={voiceState}
          onPress={onPressVoice}
          onPressIn={onPressInVoice}
          onPressOut={onPressOutVoice}
        />

        {/* Right Tabs: Cashbook, Reports */}
        {RIGHT_TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={tab.key === active}
            onPress={() => onChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
};

/** Standard Nav Tab item */
const TabItem: React.FC<{
  tab: NavTab;
  active: boolean;
  onPress: () => void;
}> = ({ tab, active, onPress }) => {
  const emphasis = useRef(new Animated.Value(active ? 1 : 0)).current;
  /** Press feedback. The dock was the one surface in the app that responded to
   *  a tap with nothing at all until the screen behind it had already changed. */
  const sink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(emphasis, {
      toValue: active ? 1 : 0,
      friction: 14,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [active, emphasis]);

  const press = (to: number) =>
    Animated.spring(sink, {
      toValue: to,
      friction: 12,
      tension: 260,
      useNativeDriver: true,
    }).start();

  const Icon = tab.icon;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press(1)}
      onPressOut={() => press(0)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      style={[styles.item, NO_OUTLINE, CURSOR.pointer]}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: sink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
          transform: [
            {
              translateY: emphasis.interpolate({
                inputRange: [0, 1],
                outputRange: [1, -1],
              }),
            },
            {
              scale: sink.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.9],
              }),
            },
          ],
        }}
      >
        <Icon
          size={19}
          color={active ? COLORS.accent : COLORS.textMuted}
          strokeWidth={active ? 2.5 : 2}
        />
        <Text
          style={[
            styles.label,
            { color: active ? COLORS.accent : COLORS.textMuted },
            active && styles.labelActive,
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

/** Center Prominent Mic Action Button */
const CenterMicButton: React.FC<{
  voiceState: VoiceState;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}> = ({ voiceState, onPress, onPressIn, onPressOut }) => {
  const isRecording = voiceState === 'recording';
  const isProcessing = voiceState === 'processing';

  const scale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while actively recording
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.28,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
    onPressIn?.();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
    onPressOut?.();
  };

  /**
   * Releases the press-sink if the state changes while the finger is still
   * down. A hold that hits the recording time limit flips straight to
   * `processing`, which disables the Pressable — so `onPressOut` never fires and
   * the button was left visually squashed for the whole processing pass.
   */
  useEffect(() => {
    if (isProcessing) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isProcessing, scale]);

  return (
    <View style={styles.centerItem}>
      <Pressable
        onPress={isProcessing ? undefined : onPress}
        onPressIn={isProcessing ? undefined : handlePressIn}
        onPressOut={isProcessing ? undefined : handlePressOut}
        disabled={isProcessing}
        accessibilityRole="button"
        accessibilityState={{ busy: isProcessing }}
        accessibilityLabel={
          isProcessing
            ? 'Processing voice entry'
            : isRecording
            ? 'Stop recording voice entry'
            : 'Record transaction with voice'
        }
        style={[NO_OUTLINE, isProcessing ? CURSOR.disabled : CURSOR.pointer]}
      >
        <Animated.View
          style={[
            styles.micContainer,
            isRecording && styles.micRecording,
            isProcessing && styles.micProcessing,
            { transform: [{ scale }] },
          ]}
        >
          {/* Breathing halo ring while recording */}
          {isRecording ? (
            <Animated.View
              style={[
                styles.micHalo,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
          ) : null}

          {/*
            Processing used to render a static mic at 85% opacity, which is
            indistinguishable from the button having simply stopped working.
            A spinner says the app is still on it.
          */}
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isRecording ? (
            <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Mic size={22} color="#FFFFFF" strokeWidth={2.4} />
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH - SPACE.sm,
    height: DOCK_HEIGHT,
    paddingHorizontal: PAD,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairlineStrong,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    left: 0,
    height: DOCK_HEIGHT - PAD * 2 - 2,
    borderRadius: RADIUS.md,
    // Accent-tinted rather than grey: the active icon and label are already
    // accent, so a neutral pill behind them read as an unrelated highlight.
    backgroundColor: COLORS.accentSoft,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  micContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent, // Deep vibrant violet
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(91, 70, 246, 0.40)',
      } as any,
    }),
  },
  micRecording: {
    backgroundColor: '#EF4444', // Vivid recording red
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#EF4444',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 18px rgba(239, 68, 68, 0.60)',
      } as any,
    }),
  },
  micProcessing: {
    backgroundColor: '#8B5CF6',
  },
  micHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.30)',
  },
  label: {
    ...TYPE.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  labelActive: {
    fontWeight: '700',
  },
});
