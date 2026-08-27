import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MOTION } from '../theme/tokens';

type Layer = { phase: string; node: React.ReactNode };

interface CrossFadeProps {
  /**
   * Identity of what's currently rendered. When this changes, the previous
   * subtree is held on screen and dissolved out while the new one comes in.
   */
  phase: string;
  /** `1` for forward navigation, `-1` for going back. Sets which way things slide. */
  direction?: 1 | -1;
  /** Travel distance in px. A hint, not a full push — see the note below. */
  distance?: number;
  duration?: number;
  /**
   * Set when this fills a screen: both the stage and the incoming layer get
   * `flex: 1` so a `flex: 1` child actually stretches. Leave off to size to the
   * content, which is what the in-page uses (auth form, wizard steps) need.
   */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Dissolves between two subtrees that would otherwise swap instantly.
 *
 * Both layers stay mounted for the length of the transition: the incoming one
 * sits in normal flow (so it defines the height, and this works inside a
 * `ScrollView` as well as full-screen), and the outgoing one is lifted into an
 * absolute overlay so it can fade out without holding space open.
 *
 * The slide is a 20px directional hint rather than a full-width push. A real
 * push would mean laying out both screens side by side at full width, which
 * fights the `ScrollView`-based screens this wraps — and at this pace the hint
 * reads as intentional where a full slide reads as a stock page transition.
 */
export const CrossFade: React.FC<CrossFadeProps> = ({
  phase,
  direction = 1,
  distance = 20,
  duration = MOTION.editorial,
  fill = false,
  style,
  children,
}) => {
  /** The subtree on its way out, held until the dissolve finishes. */
  const [outgoing, setOutgoing] = useState<Layer | null>(null);

  /** What the last commit actually put on screen. */
  const rendered = useRef<Layer | null>(null);

  /** 0 → outgoing fully visible, 1 → incoming fully visible. */
  const progress = useRef(new Animated.Value(1)).current;

  /*
   * Declared before the recorder below, so within a single commit this runs
   * first and still sees the *previous* commit's subtree — that's the thing we
   * need to dissolve away from.
   *
   * `children` is deliberately not a dependency. It's a fresh element on every
   * parent render, so depending on it would fire this effect's cleanup — and
   * stop the animation — partway through every transition.
   */
  useEffect(() => {
    const previous = rendered.current;

    // Nothing to dissolve from on first mount; screens animate themselves in.
    if (!previous || previous.phase === phase) return;

    setOutgoing(previous);
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      // Only drop the old layer on a clean finish. If a third phase interrupted
      // us, that effect run has already installed its own outgoing layer and
      // clearing here would yank it back out.
      if (finished) setOutgoing(null);
    });

    return () => animation.stop();
  }, [phase, duration, progress]);

  useEffect(() => {
    rendered.current = { phase, node: children };
  });

  const incomingStyle = {
    opacity: progress,
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance * direction, 0],
        }),
      },
    ],
  };

  const outgoingStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -distance * direction],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[fill && styles.fill, style]}>
      <Animated.View key={phase} style={[fill && styles.fill, incomingStyle]}>
        {children}
      </Animated.View>

      {outgoing ? (
        <Animated.View
          key={outgoing.phase}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, outgoingStyle]}
        >
          {outgoing.node}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
