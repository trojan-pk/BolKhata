import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS has been asked to reduce motion.
 *
 * The app leans on entrance staggers, count-up figures and a pulsing skeleton.
 * All of it is decorative, and for someone with vestibular sensitivity — or
 * anyone who has simply turned the setting on — it is exactly the kind of motion
 * they asked the system to stop. Honouring the flag costs nothing: the same
 * layout renders, just already at rest.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduced(enabled);
      })
      .catch(() => {
        // Older Androids and some web engines don't expose it. Motion stays on.
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduced(enabled)
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
