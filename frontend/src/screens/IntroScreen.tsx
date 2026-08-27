import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Cloud, Mic, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../theme/colors';
import {
  GUTTER,
  MAX_CONTENT_WIDTH,
  MOTION,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { COPY } from '../i18n/copy';
import { Button, Enter, LinkButton, Press } from '../ui';
import { IconComponent } from '../ui/icon';

interface IntroScreenProps {
  /** Called when the user finishes or skips. The caller persists the flag. */
  onDone: () => void;
}

const SLIDE_ICONS: IconComponent[] = [Mic, Send, Cloud];

/**
 * The three-slide value intro, shown once per device before the welcome screen.
 *
 * Paging is driven two ways on purpose: `pagingEnabled` for a native swipe, plus
 * an explicit Next button and tappable dots that call `scrollTo`. Under
 * `react-native-web` paging becomes CSS scroll snapping, which is close but not
 * guaranteed to land cleanly — the buttons make progress deterministic there.
 */
export const IntroScreen: React.FC<IntroScreenProps> = ({ onDone }) => {
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);

  /**
   * Measured rather than taken from the window: content is capped at
   * `MAX_CONTENT_WIDTH` and centred, so on web and tablets the window is wider
   * than a slide and every offset would be wrong.
   */
  const [slideWidth, setSlideWidth] = useState(0);
  /** Mirror of the above, so the scroll listener stays a stable closure. */
  const widthRef = useRef(0);
  const [index, setIndex] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;

  const slides = COPY.onboarding.slides;
  const isLast = index === slides.length - 1;

  const measure = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next === widthRef.current) return;
    widthRef.current = next;
    setSlideWidth(next);
  }, []);

  const goTo = useCallback((next: number) => {
    scroller.current?.scrollTo({ x: next * widthRef.current, animated: true });
    // Tracked here as well: the scroll listener trails a programmatic scroll,
    // and the button label shouldn't wait for it.
    setIndex(next);
  }, []);

  const onScroll = useMemo(
    () =>
      Animated.event<NativeScrollEvent>(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          // The rest of the app native-drives everything. Scroll-linked
          // interpolation is the one case react-native-web handles differently,
          // so there it stays on the JS driver.
          useNativeDriver: Platform.OS !== 'web',
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const w = widthRef.current;
            if (!w) return;
            const next = Math.round(e.nativeEvent.contentOffset.x / w);
            setIndex((current) => (current === next ? current : next));
          },
        }
      ),
    [scrollX]
  );

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.shell}>
        {/* Skip stops existing on the last slide, where the primary button
            already says what happens next. */}
        <Enter
          index={0}
          stagger={MOTION.stagger}
          duration={MOTION.editorial}
          style={styles.topBar}
        >
          {isLast ? null : (
            <LinkButton label={COPY.onboarding.skip} onPress={onDone} tone="muted" />
          )}
        </Enter>

        <View style={styles.stage} onLayout={measure}>
          {slideWidth > 0 ? (
            <Animated.ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              /** Overscroll would drag a slide's own opacity toward zero. */
              bounces={false}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onScroll}
              style={styles.scroller}
            >
              {slides.map((slide, i) => (
                <Slide
                  key={slide.title}
                  icon={SLIDE_ICONS[i]}
                  title={slide.title}
                  body={slide.body}
                  index={i}
                  width={slideWidth}
                  scrollX={scrollX}
                />
              ))}
            </Animated.ScrollView>
          ) : null}
        </View>

        <Enter
          index={1}
          stagger={MOTION.stagger}
          duration={MOTION.editorial}
          style={styles.footer}
        >
          <View style={styles.dots}>
            {slides.map((slide, i) => (
              <Dot
                key={slide.title}
                index={i}
                width={slideWidth}
                scrollX={scrollX}
                label={slide.title}
                onPress={() => goTo(i)}
              />
            ))}
          </View>

          <Button
            label={isLast ? COPY.onboarding.getStarted : COPY.onboarding.next}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => (isLast ? onDone() : goTo(index + 1))}
          />
        </Enter>
      </View>
    </View>
  );
};

/* --------------------------------------------------------------------- slide -- */

const Slide: React.FC<{
  icon: IconComponent;
  title: string;
  body: string;
  index: number;
  width: number;
  scrollX: Animated.Value;
}> = ({ icon: Icon, title, body, index, width, scrollX }) => {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  const opacity = scrollX.interpolate({
    inputRange: range,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  /** Copy trails the swipe, so the slide reads as layered over the paper. */
  const translateY = scrollX.interpolate({
    inputRange: range,
    outputRange: [SPACE.xxl, 0, SPACE.xxl],
    extrapolate: 'clamp',
  });

  const markScale = scrollX.interpolate({
    inputRange: range,
    outputRange: [0.88, 1, 0.88],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View
        style={[styles.mark, { opacity, transform: [{ scale: markScale }] }]}
      >
        <Icon size={26} color={COLORS.ink} strokeWidth={1.9} />
      </Animated.View>

      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideBody}>{body}</Text>
      </Animated.View>
    </View>
  );
};

/* ---------------------------------------------------------------------- dots -- */

/**
 * A hairline dot with an ink pill layered over it. The pill's opacity and
 * `scaleX` are interpolated rather than animating `width` or `backgroundColor`,
 * neither of which the native driver can take.
 */
const Dot: React.FC<{
  index: number;
  width: number;
  scrollX: Animated.Value;
  label: string;
  onPress: () => void;
}> = ({ index, width, scrollX, label, onPress }) => {
  // Guards the very first render, before the stage has been measured: an
  // inputRange has to be strictly increasing.
  const w = width || 1;
  const range = [(index - 1) * w, index * w, (index + 1) * w];

  const opacity = scrollX.interpolate({
    inputRange: range,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const scaleX = scrollX.interpolate({
    inputRange: range,
    outputRange: [0.25, 1, 0.25],
    extrapolate: 'clamp',
  });

  return (
    <Press
      onPress={onPress}
      scale={1}
      dim={0.6}
      accessibilityLabel={`Go to ${label}`}
      hitSlop={{ top: 16, bottom: 16, left: 6, right: 6 }}
      style={styles.dotSlot}
    >
      <View style={styles.dotTrack} />
      <Animated.View
        style={[styles.dotPill, { opacity, transform: [{ scaleX }] }]}
      />
    </Press>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  topBar: {
    height: 44,
    paddingHorizontal: GUTTER,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
  },
  scroller: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxxl,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hairlineStrong,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xxl,
  },
  slideTitle: {
    ...TYPE.title1,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACE.sm,
  },
  slideBody: {
    ...TYPE.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.xxl,
    gap: SPACE.xxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  dotSlot: {
    width: 24,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTrack: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.hairlineStrong,
  },
  dotPill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ink,
  },
});
