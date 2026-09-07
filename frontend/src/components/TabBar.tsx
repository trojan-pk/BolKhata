import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Home,
  Mic,
  PieChart,
  Users,
  Wallet,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import {
  ELEV,
  MAX_CONTENT_WIDTH,
  MOTION,
  NO_OUTLINE,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { IconComponent } from '../ui/icon';

export type TabKey = 'home' | 'customers' | 'cashbook' | 'reports' | 'settings';

interface NavTabItem {
  key: TabKey;
  label: string;
  icon: IconComponent;
}

const LEFT_TABS: NavTabItem[] = [
  { key: 'home', label: COPY.nav.home, icon: Home },
  { key: 'customers', label: COPY.nav.customers, icon: Users },
];

const RIGHT_TABS: NavTabItem[] = [
  { key: 'cashbook', label: COPY.nav.cashbook, icon: Wallet },
  { key: 'reports', label: COPY.nav.reports, icon: PieChart },
];

const TOTAL_SLOTS = 5;

const TAB_SLOT_MAP: Record<string, number> = {
  home: 0,
  customers: 1,
  cashbook: 3,
  reports: 4,
};

const DOCK_HEIGHT = 62;
const PAD = 5;

/**
 * Floating dock with centered Voice action button.
 * Layout: [Home] [Customers]  ( 🎙️ Voice )  [Cashbook] [Reports]
 */
export const TabBar: React.FC<{
  active: TabKey;
  onChange: (key: TabKey) => void;
  onPressVoice?: () => void;
}> = ({ active, onChange, onPressVoice }) => {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);

  const activeSlot = TAB_SLOT_MAP[active] ?? -1;
  const position = useRef(new Animated.Value(Math.max(0, activeSlot))).current;
  const indicatorOpacity = useRef(new Animated.Value(activeSlot >= 0 ? 1 : 0)).current;

  useEffect(() => {
    if (activeSlot >= 0) {
      Animated.parallel([
        Animated.spring(position, {
          toValue: activeSlot,
          ...MOTION.spring,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: MOTION.fast,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: MOTION.fast,
        useNativeDriver: false,
      }).start();
    }
  }, [activeSlot, position, indicatorOpacity]);

  const itemWidth = trackWidth > 0 ? (trackWidth - PAD * 2) / TOTAL_SLOTS : 0;

  const translateX = position.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, 1, 2, 3, 4].map((i) => PAD + i * itemWidth),
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

        {/* Middle Voice Button */}
        <View style={styles.voiceSlot}>
          <Pressable
            onPress={onPressVoice}
            accessibilityRole="button"
            accessibilityLabel="Voice Assistant"
            style={({ pressed }) => [
              styles.voiceBtn,
              pressed && styles.voiceBtnPressed,
            ]}
          >
            <Mic size={22} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>

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

const TabItem: React.FC<{
  tab: NavTabItem;
  active: boolean;
  onPress: () => void;
}> = ({ tab, active, onPress }) => {
  const emphasis = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(emphasis, {
      toValue: active ? 1 : 0,
      friction: 14,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [active, emphasis]);

  const Icon = tab.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      style={[styles.item, NO_OUTLINE]}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          transform: [
            {
              translateY: emphasis.interpolate({
                inputRange: [0, 1],
                outputRange: [1, -1],
              }),
            },
          ],
        }}
      >
        <Icon
          size={20}
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
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairlineStrong,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    left: 0,
    height: DOCK_HEIGHT - PAD * 2 - 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSunken,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceBtnPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: COLORS.accentPressed,
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
