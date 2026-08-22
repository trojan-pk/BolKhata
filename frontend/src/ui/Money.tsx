import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { TABULAR, TYPE } from '../theme/tokens';
import { formatMoney, groupDigits } from '../utils/format';

export type MoneySize = 'display' | 'title1' | 'title2' | 'title3' | 'body' | 'caption';
export type MoneyTone = 'ink' | 'onInk' | 'credit' | 'debit' | 'muted' | 'auto';

interface MoneyProps {
  value: number;
  currency?: string;
  size?: MoneySize;
  tone?: MoneyTone;
  /** `auto` prints `+`/`-`; pass an explicit mark to override. */
  sign?: '+' | '-' | 'auto' | 'none';
  /** Always render the absolute value (the sign, if any, carries direction). */
  absolute?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const SIZES: Record<MoneySize, TextStyle> = {
  display: TYPE.display,
  title1: TYPE.title1,
  title2: TYPE.title2,
  title3: TYPE.title3,
  body: { ...TYPE.body, fontWeight: '700' },
  caption: { ...TYPE.caption, fontWeight: '700' },
};

const TONES: Record<Exclude<MoneyTone, 'auto'>, string> = {
  ink: COLORS.textPrimary,
  onInk: COLORS.textOnInk,
  credit: COLORS.credit,
  debit: COLORS.debit,
  muted: COLORS.textMuted,
};

/**
 * Every amount in the app renders through this, so currency placement, digit
 * grouping and tabular alignment are decided once. `tone="auto"` colours by
 * direction: green when money is coming to you, red when it is going out.
 */
export const Money: React.FC<MoneyProps> = ({
  value,
  currency = 'Rs',
  size = 'body',
  tone = 'ink',
  sign = 'none',
  absolute = true,
  style,
  numberOfLines = 1,
}) => {
  const resolvedTone =
    tone === 'auto' ? (value < 0 ? 'debit' : 'credit') : tone;

  const shown = absolute ? Math.abs(value) : value;
  const mark =
    sign === 'none' ? '' : sign === 'auto' ? (value < 0 ? '− ' : '+ ') : `${sign} `;

  return (
    <Text
      style={[SIZES[size], TABULAR, { color: TONES[resolvedTone] }, style]}
      numberOfLines={numberOfLines}
      allowFontScaling
    >
      {mark}
      {formatMoney(shown, currency)}
    </Text>
  );
};

/**
 * Money that counts to its new value instead of jumping. Used for the balance
 * figures that change while you watch — recording an entry should visibly move
 * the number it affects.
 */
export const AnimatedMoney: React.FC<MoneyProps & { duration?: number }> = ({
  value,
  currency = 'Rs',
  size = 'display',
  tone = 'ink',
  style,
  duration = 520,
  numberOfLines = 1,
}) => {
  const [shown, setShown] = useState(Math.abs(value));
  const fromRef = useRef(Math.abs(value));
  const frameRef = useRef<number | null>(null);
  const target = Math.abs(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic — fast off the mark, settles gently on the final figure.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  const resolvedTone = tone === 'auto' ? (value < 0 ? 'debit' : 'credit') : tone;

  return (
    <Text
      style={[SIZES[size], TABULAR, { color: TONES[resolvedTone] }, style]}
      numberOfLines={numberOfLines}
    >
      {currency} {groupDigits(shown)}
    </Text>
  );
};
