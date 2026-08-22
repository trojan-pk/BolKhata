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
  PieChart,
  Settings as SettingsIcon,
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

export type TabKey = 'home' | 'customers' | 'cashbook' | 'reports' | 'settings';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}[] = [
  { key: 'home', label: COPY.nav.home, icon: Home },
  { key: 'customers', label: COPY.nav.customers, icon: Users },
  { key: 'cashbook', label: COPY.nav.cashbook, icon: Wallet },
  { key: 'reports', label: COPY.nav.reports, icon: PieChart },
  { key: 'settings', label: COPY.nav.settings, icon: SettingsIcon },
];

const DOCK_HEIGHT = 62;
const PAD = 5;

/**
 * Floating ink dock. The indicator position is derived from the measured track
 * width rather than hard-coded percentages, so it lands dead-centre under every
 * tab on any screen size — including the wide web layout.
 */
export const TabBar: React.FC<{
  active: TabKey;
  onChange: (key: TabKey) => void;
}> = ({ active, onChange }) => {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active));
  const position = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: activeIndex,
      ...MOTION.spring,
    }).start();
  }, [activeIndex, position]);

  const itemWidth = trackWidth > 0 ? (trackWidth - PAD * 2) / TABS.length : 0;

  const translateX = position.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => PAD + i * itemWidth),
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
                transform: [{ translateX }],
              },
            ]}
          />
        ) : null}

        {TABS.map((tab) => (
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
  tab: (typeof TABS)[number];
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
          size={19}
          color={active ? COLORS.textOnInk : COLORS.textOnInkMuted}
          strokeWidth={active ? 2.3 : 1.9}
        />
        <Text
          style={[
            styles.label,
            { color: active ? COLORS.textOnInk : COLORS.textOnInkMuted },
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
    backgroundColor: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.inkSoft,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    left: 0,
    height: DOCK_HEIGHT - PAD * 2 - 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.inkLift,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
