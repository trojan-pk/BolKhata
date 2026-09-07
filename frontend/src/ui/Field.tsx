import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../theme/colors';
import {
  CONTROL_HEIGHT,
  CURSOR,
  NO_OUTLINE,
  RADIUS,
  SPACE,
  TABULAR,
  TYPE,
} from '../theme/tokens';
import { IconComponent } from './icon';

/** Field label, with an unobtrusive "Optional" marker when relevant. */
export const Label: React.FC<{ text: string; optional?: boolean; hint?: string }> = ({
  text,
  optional,
  hint,
}) => (
  <View style={styles.labelBlock}>
    <View style={styles.labelRow}>
      <Text style={[TYPE.label, styles.labelText]}>{text}</Text>
      {optional ? (
        <Text style={[TYPE.caption, { color: COLORS.textFaint }]}>Optional</Text>
      ) : null}
    </View>
    {hint ? <Text style={[TYPE.caption, styles.hint]}>{hint}</Text> : null}
  </View>
);

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  icon?: IconComponent;
  /** Trailing element — a clear button, a unit, a picker trigger. */
  accessory?: React.ReactNode;
  multiline?: boolean;
  /** Shows `12/60` beside the label. Requires `maxLength`. */
  counter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The one text input. Focus is shown by an accent border rather than a glow, and
 * validation messages take the place of the hint so the layout never jumps.
 *
 * The border keeps a constant width across every state and only changes colour.
 * Thickening it on focus nudged the icon and the caret half a pixel sideways,
 * which showed up as the text flinching the instant you tapped in.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  optional,
  hint,
  error,
  icon: Icon,
  accessory,
  multiline,
  counter,
  containerStyle,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);

  const borderColor = error
    ? COLORS.debit
    : focused
    ? COLORS.accent
    : COLORS.hairlineStrong;

  const used = String(inputProps.value ?? '').length;
  const showCounter = counter && typeof inputProps.maxLength === 'number';
  // Only worth reading once you are close to the ceiling.
  const counterNear = showCounter && used / (inputProps.maxLength as number) > 0.7;

  return (
    <View style={containerStyle}>
      {label ? (
        <View style={styles.labelHeadRow}>
          <Label text={label} optional={optional && !showCounter} />
          {showCounter ? (
            <Text
              style={[
                TYPE.caption,
                styles.counter,
                counterNear && { color: COLORS.textMuted },
                used >= (inputProps.maxLength as number) && { color: COLORS.warning },
              ]}
            >
              {used}/{inputProps.maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/*
        The whole shell is the target, not just the input inside it. Tapping the
        padding or the leading icon used to do nothing while the cursor said
        otherwise — a miss on the two strips of a field most likely to be hit
        by a thumb. Marked inaccessible so the TextInput remains the single
        node a screen reader sees.
      */}
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          { borderColor },
          CURSOR.text,
        ]}
      >
        {Icon ? (
          <Icon
            size={16}
            color={focused ? COLORS.accent : COLORS.textFaint}
            strokeWidth={2}
          />
        ) : null}

        <TextInput
          ref={input}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            NO_OUTLINE as any,
          ]}
          placeholderTextColor={COLORS.textFaint}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...inputProps}
        />

        {accessory}
      </Pressable>

      {error ? (
        <Text
          style={[TYPE.caption, styles.error]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text style={[TYPE.caption, styles.hintBelow]}>{hint}</Text>
      ) : null}
    </View>
  );
};

/* ------------------------------------------------------- amount formatting -- */

/**
 * Keeps a typed amount to one decimal point and at most two decimals, and drops
 * leading zeros so `007` can't be entered as an amount.
 */
function sanitiseAmount(raw: string): string {
  let next = (raw || '').replace(/[^\d.]/g, '');

  // Everything after the first decimal point loses its own points.
  const firstDot = next.indexOf('.');
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
  }

  const [whole = '', decimals] = next.split('.');
  const trimmed = whole.replace(/^0+(?=\d)/, '');

  if (decimals === undefined) return trimmed;
  return `${trimmed || '0'}.${decimals.slice(0, 2)}`;
}

/**
 * Groups the digits as they're typed, subcontinent style (`1,20,000`).
 *
 * Operates on the digit string rather than a parsed number so the field shows
 * back exactly what was entered — a partial `1,20,` mid-type included.
 */
function groupAmount(value: string): string {
  if (!value) return '';
  const [whole, decimals] = value.split('.');
  const digits = whole || '';
  const grouped =
    digits.length <= 3
      ? digits
      : `${digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${digits.slice(-3)}`;
  return value.includes('.') ? `${grouped}.${decimals ?? ''}` : grouped;
}

/**
 * The amount input, deliberately oversized. It is the field that matters most
 * in a ledger app, so it gets display-scale type, a fixed currency prefix and
 * numeric-only entry rather than being one row in a form.
 */
export const AmountField: React.FC<{
  value: string;
  onChangeText: (value: string) => void;
  currency?: string;
  tone?: 'ink' | 'credit' | 'debit';
  autoFocus?: boolean;
  error?: string | null;
  label?: string;
}> = ({
  value,
  onChangeText,
  currency = 'Rs',
  tone = 'ink',
  autoFocus,
  error,
  label,
}) => {
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const tint =
    tone === 'credit' ? COLORS.credit : tone === 'debit' ? COLORS.debit : COLORS.textPrimary;

  return (
    <View>
      {label ? <Label text={label} /> : null}
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={[
          styles.amountShell,
          {
            borderColor: error
              ? COLORS.debit
              : focused
              ? COLORS.accent
              : COLORS.hairlineStrong,
          },
          CURSOR.text,
        ]}
      >
        <Text style={[styles.amountPrefix, { color: COLORS.textMuted }]}>
          {currency}
        </Text>
        <TextInput
          ref={input}
          // Separators are display-only; the parent always receives raw digits.
          value={groupAmount(value)}
          onChangeText={(next) => onChangeText(sanitiseAmount(next))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
          placeholderTextColor={COLORS.textFaint}
          autoFocus={autoFocus}
          selectTextOnFocus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label || 'Amount'}
          style={[styles.amountInput, TABULAR, { color: tint }, NO_OUTLINE as any]}
        />
      </Pressable>
      {error ? (
        <Text
          style={[TYPE.caption, styles.error]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  labelBlock: {
    marginBottom: SPACE.sm,
  },
  labelHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.sm,
  },
  counter: {
    ...TABULAR,
    color: COLORS.textFaint,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.textFaint,
    marginTop: 2,
  },
  hintBelow: {
    color: COLORS.textFaint,
    marginTop: 6,
  },
  error: {
    color: COLORS.debit,
    marginTop: 6,
    fontWeight: '600',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    // Constant across every state — only the colour changes, so focusing a field
    // never reflows what's inside it.
    borderWidth: 1.5,
    paddingHorizontal: SPACE.lg - 2.5,
    height: CONTROL_HEIGHT.lg,
  },
  inputShellMultiline: {
    height: undefined,
    minHeight: 86,
    alignItems: 'flex-start',
    paddingVertical: SPACE.md,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    color: COLORS.textPrimary,
    padding: 0,
    height: '100%',
  },
  inputMultiline: {
    height: undefined,
    textAlignVertical: 'top',
    minHeight: 62,
  },
  amountShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: SPACE.xl,
    height: 76,
  },
  amountPrefix: {
    ...TYPE.title2,
    fontWeight: '600',
  },
  amountInput: {
    ...TYPE.display,
    minWidth: 90,
    maxWidth: '80%',
    textAlign: 'center',
    padding: 0,
  },
});
