import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../theme/colors';
import { MOTION, SPACE, TYPE } from '../theme/tokens';
import { COPY } from '../i18n/copy';
import { DrawnCheck, Enter } from '../ui';

/** How long the drawn check sits before the screen dissolves into the ledger. */
const HOLD = 420;

interface SetupCelebrationProps {
  name: string;
  /** Fires once the beat has fully dissolved. */
  onDone: () => void;
}

/**
 * The one flourish in the app: the moment setup completes.
 *
 * It lives here rather than inside the wizard because the wizard is already gone
 * by this point — saving the profile flips `isOnboarded`, which unmounts it. This
 * beat belongs to the boundary between the wizard and the ledger, so it's owned
 * by whoever renders both.
 */
export const SetupCelebration: React.FC<SetupCelebrationProps> = ({
  name,
  onDone,
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: MOTION.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    if (!drawn) return;

    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: MOTION.editorial,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone();
      });
    }, HOLD);

    return () => clearTimeout(timer);
    // `onDone` omitted: a fresh callback identity from the parent would restart
    // the hold and the beat would never end.
  }, [drawn, fade]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.stage, { opacity: fade }]}
    >
      <DrawnCheck size={76} onDone={() => setDrawn(true)} />

      <Enter
        index={1}
        stagger={MOTION.stagger}
        duration={MOTION.editorial}
        delay={MOTION.base}
        style={styles.copy}
      >
        <Text style={styles.title}>{COPY.onboarding.setupDone.greeting(name)}</Text>
        <Text style={styles.body}>{COPY.onboarding.setupDone.body}</Text>
      </Enter>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stage: {
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    marginTop: SPACE.xxl,
  },
  title: {
    ...TYPE.title1,
    color: COLORS.ink,
    textAlign: 'center',
  },
  body: {
    ...TYPE.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACE.xs,
  },
});
