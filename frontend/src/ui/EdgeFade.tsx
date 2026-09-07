import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../theme/colors';

/**
 * A soft dissolve at the edge of a scrolling region.
 *
 * The dock floats over the bottom of every screen, so rows used to travel
 * behind it and then stop dead at the window edge — a hard horizontal cut
 * through half a customer's name. Fading the last stretch into the page colour
 * reads as "there is more below" instead of "the list ends here, mid-row".
 *
 * Purely decorative, so it never takes touches.
 */
export const EdgeFade: React.FC<{
  height?: number;
  /** Should match whatever the fade sits on. */
  color?: string;
  edge?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
}> = ({ height = 96, color = COLORS.paper, edge = 'bottom', style }) => {
  const id = `edge-fade-${edge}`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        edge === 'bottom' ? styles.bottom : styles.top,
        { height },
        style,
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient
            id={id}
            x1="0"
            x2="0"
            y1={edge === 'bottom' ? '0' : '1'}
            y2={edge === 'bottom' ? '1' : '0'}
          >
            {/* Eased in three stops rather than two — a straight linear ramp
                shows a visible band where the transparent end begins. */}
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.72" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bottom: {
    bottom: 0,
  },
  top: {
    top: 0,
  },
});
