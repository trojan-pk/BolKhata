import { Platform, TextStyle, ViewStyle } from 'react-native';
import { FONTS } from './typography';

/**
 * BolKhata design tokens.
 *
 * Everything visual in the app resolves to a value in this file: spacing sits on
 * a 4pt grid, radii come from a fixed ladder, and every piece of text uses one
 * of the ramp entries below. The font stacks themselves live in `typography.ts`
 * and are intentionally untouched (Plus Jakarta Sans for headings, Inter body).
 */

/* ---------------------------------------------------------------- spacing -- */

export const SPACE = {
  /** 2 */ hair: 2,
  /** 4 */ xs: 4,
  /** 8 */ sm: 8,
  /** 12 */ md: 12,
  /** 16 */ lg: 16,
  /** 20 — the standard screen gutter */ xl: 20,
  /** 24 */ xxl: 24,
  /** 32 */ xxxl: 32,
  /** 40 */ huge: 40,
} as const;

/** Horizontal page gutter. Every screen aligns to this. */
export const GUTTER = SPACE.xl;

export const RADIUS = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/* ------------------------------------------------------------- type ramp -- */

const heading = FONTS.headingBold;
const body = FONTS.body;

/**
 * Ten text styles, and no ad-hoc font sizes anywhere else. Sizes step on a
 * ~1.2 ratio so headings stay distinct without shouting.
 */
export const TYPE = {
  /** Balance figures, the one number per screen that matters most. */
  display: {
    fontFamily: heading,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  /** Screen titles. */
  title1: {
    fontFamily: heading,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  /** Card headlines, sheet titles. */
  title2: {
    fontFamily: heading,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  /** Row headlines, section titles. */
  title3: {
    fontFamily: heading,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  /** Default reading size. */
  body: {
    fontFamily: body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  /** Secondary reading size — row subtitles, helper copy. */
  bodySm: {
    fontFamily: body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  /** Form labels, buttons, chips. */
  label: {
    fontFamily: body,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  /** Metadata: dates, counts, hints. */
  caption: {
    fontFamily: body,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  /** Small all-caps section eyebrow. Use sparingly. */
  overline: {
    fontFamily: body,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

/** Lines up digits in columns so amounts never jitter as they change. */
export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/* ------------------------------------------------------------- elevation -- */

const shadow = (
  y: number,
  blur: number,
  opacity: number,
  elevation: number
): ViewStyle => ({
  shadowColor: '#0B0F1A',
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation,
});

/**
 * Three elevation levels only. Resting surfaces get `flat` (a hairline border
 * and no shadow at all) — depth is reserved for things that genuinely float.
 */
export const ELEV = {
  flat: {} as ViewStyle,
  card: shadow(1, 3, 0.03, 1),
  raised: shadow(8, 20, 0.09, 8),
  overlay: shadow(16, 36, 0.18, 20),
} as const;

/* ---------------------------------------------------------------- motion -- */

export const MOTION = {
  /** Taps, toggles, colour changes. */
  fast: 140,
  /** The default: sheets, fades, list entrances. */
  base: 240,
  /** Screen-level transitions. */
  slow: 380,
  /** Spring for anything the finger drives. */
  spring: { friction: 9, tension: 90, useNativeDriver: true } as const,
  /** Softer spring for indicators that trail behind a tap. */
  springSoft: { friction: 11, tension: 70, useNativeDriver: true } as const,
} as const;

/* --------------------------------------------------------------- controls -- */

/** Minimum comfortable touch target. Anything smaller needs `hitSlop`. */
export const TOUCH = 44;

export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

export const CONTROL_HEIGHT = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

/** Content never stretches past this — keeps the app readable on tablets/web. */
export const MAX_CONTENT_WIDTH = 560;

/** Web-only outline reset for pressables and inputs. */
export const NO_OUTLINE = Platform.select({
  web: { outlineStyle: 'none' } as unknown as ViewStyle,
  default: {} as ViewStyle,
}) as ViewStyle;
