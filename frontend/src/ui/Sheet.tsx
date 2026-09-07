import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import {
  ELEV,
  MAX_CONTENT_WIDTH,
  MOTION,
  RADIUS,
  SPACE,
  TYPE,
  CURSOR,
} from '../theme/tokens';
import { IconButton } from './Button';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Replaces the title block entirely. */
  header?: React.ReactNode;
  /** Pinned below the scroll area — where the primary action belongs. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** `bottom` slides up from the edge; `center` scales in. */
  variant?: 'bottom' | 'center';
  /**
   * Fraction of the window the scroll area may occupy. Resolved to pixels
   * against the real window height — a percentage would resolve against the
   * panel's content-sized parent, which Yoga treats as no constraint at all,
   * letting a long sheet run off the top of the screen.
   */
  maxHeightRatio?: number;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  showClose?: boolean;
}

/**
 * The app's only modal surface, in two flavours. Handles its own enter/exit
 * animation (RN's built-in `animationType` can't fade a backdrop independently
 * of the panel), keyboard avoidance, safe-area padding, and Android back.
 *
 * Bottom sheets are draggable: the grabber and the title block are a drag
 * handle, and a downward flick or a drag past a third of the panel dismisses.
 * The grabber was previously decorative, which is worse than not drawing one —
 * it advertises a gesture that then does nothing.
 */
export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  header,
  footer,
  children,
  variant = 'bottom',
  maxHeightRatio = 0.62,
  scrollable = true,
  contentStyle,
  showClose = true,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [panelHeight, setPanelHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  /** Live finger offset, added to the entrance transform. */
  const drag = useRef(new Animated.Value(0)).current;
  const panelHeightRef = useRef(0);

  const scrollMaxHeight = Math.round(windowHeight * maxHeightRatio);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      setScrolled(false);
      Animated.spring(progress, {
        toValue: 1,
        friction: 22,
        tension: 190,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: MOTION.fast + 40,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          // Clear any leftover drag offset so the next open starts square.
          drag.setValue(0);
        }
      });
    }
    // `mounted` intentionally excluded — it would retrigger the exit animation.
  }, [visible, progress, drag]);

  /**
   * Escape closes on web. Browser users reach for it before they look for the
   * close button, and every other dismissal route was already wired up.
   */
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, onClose]);

  // The pan responder is built once, so it reads the latest `onClose` and the
  // measured panel height through refs rather than closing over stale values.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dragResponder = useRef(
    PanResponder.create({
      // Claim the gesture only once it is clearly a downward drag, so a
      // horizontal swipe or a stray tap still reaches the controls underneath.
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_evt, gesture) => {
        // Upward drag is resisted rather than followed — the sheet is already
        // at its resting height, so there is nothing above it to reveal.
        drag.setValue(gesture.dy > 0 ? gesture.dy : gesture.dy / 6);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const height = panelHeightRef.current || 420;
        const flicked = gesture.vy > 0.7;
        const dragged = gesture.dy > Math.min(140, height / 3);

        if (flicked || dragged) {
          onCloseRef.current();
          return;
        }
        Animated.spring(drag, {
          toValue: 0,
          friction: 14,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, {
          toValue: 0,
          friction: 14,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!mounted) return null;

  const onPanelLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (next > 0 && Math.abs(next - panelHeight) > 1) {
      setPanelHeight(next);
      panelHeightRef.current = next;
    }
  };

  const bottomTransform = [
    {
      translateY: Animated.add(
        progress.interpolate({
          inputRange: [0, 1],
          outputRange: [panelHeight || 420, 0],
        }),
        drag
      ),
    },
  ];

  const centerTransform = [
    {
      scale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.94, 1],
      }),
    },
  ];

  /** The backdrop lightens as the sheet is dragged away, so the drag feels live. */
  const scrimOpacity =
    variant === 'bottom'
      ? Animated.multiply(
          progress,
          drag.interpolate({
            inputRange: [0, Math.max(1, panelHeight || 420)],
            outputRange: [1, 0.15],
            extrapolate: 'clamp',
          })
        )
      : progress;

  const titleBlock = header ?? (
    title || subtitle ? (
      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          {title ? (
            <Text style={TYPE.title2} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[TYPE.bodySm, styles.subtitle]} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {showClose ? (
          <IconButton icon={X} onPress={onClose} accessibilityLabel="Close" />
        ) : null}
      </View>
    ) : null
  );

  const body = scrollable ? (
    <ScrollView
      style={{ maxHeight: scrollMaxHeight }}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={32}
      onScroll={(e) => {
        const next = e.nativeEvent.contentOffset.y > 2;
        if (next !== scrolled) setScrolled(next);
      }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, contentStyle]}>{children}</View>
  );

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          variant === 'bottom' ? styles.rootBottom : styles.rootCenter,
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: scrimOpacity }]}
          pointerEvents="none"
        >
          <View style={styles.scrim} />
        </Animated.View>

        {/* Tap-outside-to-dismiss. Sits behind the panel. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={variant === 'bottom' ? styles.kavBottom : styles.kavCenter}
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={variant === 'bottom' ? onPanelLayout : undefined}
            style={[
              styles.panel,
              variant === 'bottom'
                ? [styles.panelBottom, { paddingBottom: Math.max(insets.bottom, SPACE.lg) }]
                : styles.panelCenter,
              ELEV.overlay,
              {
                opacity: variant === 'bottom' && panelHeight === 0 ? 0 : progress,
                transform: variant === 'bottom' ? bottomTransform : centerTransform,
              },
            ]}
          >
            {variant === 'bottom' ? (
              <View
                {...dragResponder.panHandlers}
                style={[styles.handleZone, CURSOR.grab]}
                accessibilityLabel="Drag down to close"
              >
                <View style={styles.grabber} />
                {titleBlock}
              </View>
            ) : (
              titleBlock
            )}

            {/*
              Appears only once the body has scrolled, so a short sheet has no
              rule across it but a long one shows where the content is cut.
            */}
            {scrollable && scrolled ? <View style={styles.scrollEdge} /> : null}

            {body}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootBottom: {
    justifyContent: 'flex-end',
  },
  rootCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
  },
  scrim: {
    flex: 1,
    backgroundColor: COLORS.scrim,
  },
  kavBottom: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  kavCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: COLORS.surface,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  panelBottom: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACE.sm,
  },
  panelCenter: {
    borderRadius: RADIUS.xl,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.xl,
    width: '92%',
    maxWidth: 400,
  },
  handleZone: {
    // The grabber alone is a 44×4 target. Extending the drag zone across the
    // title block makes the gesture findable without a visible change.
    paddingTop: 0,
  },
  grabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.hairlineStrong,
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  scrollEdge: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.hairline,
    marginHorizontal: SPACE.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.md,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
  },
  scrollContent: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.xs,
    gap: SPACE.lg,
  },
  footer: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    gap: SPACE.md,
  },
});
