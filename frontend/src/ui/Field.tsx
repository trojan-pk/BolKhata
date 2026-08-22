import React, { useState } from 'react';
import {
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
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The one text input. Focus is shown by an accent border rather than a glow, and
 * validation messages take the place of the hint so the layout never jumps.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  optional,
  hint,
  error,
  icon: Icon,
  accessory,
  multiline,
  containerStyle,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.debit
    : focused
    ? COLORS.accent
    : COLORS.hairlineStrong;

  return (
    <View style={containerStyle}>
      {label ? <Label text={label} optional={optional} /> : null}

      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          { borderColor, borderWidth: focused || error ? 1.5 : 1 },
          focused && !error && styles.inputShellFocused,
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
      </View>

      {error ? (
        <Text style={[TYPE.caption, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={[TYPE.caption, styles.hintBelow]}>{hint}</Text>
      ) : null}
    </View>
  );
};

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
  const tint =
    tone === 'credit' ? COLORS.credit : tone === 'debit' ? COLORS.debit : COLORS.textPrimary;

  return (
    <View>
      {label ? <Label text={label} /> : null}
      <View
        style={[
          styles.amountShell,
          {
            borderColor: error
              ? COLORS.debit
              : focused
              ? COLORS.accent
              : COLORS.hairlineStrong,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        <Text style={[styles.amountPrefix, { color: COLORS.textMuted }]}>
          {currency}
        </Text>
        <TextInput
          value={value}
          onChangeText={(next) => onChangeText(next.replace(/[^\d.]/g, ''))}
          keyboardType="numeric"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textFaint}
          autoFocus={autoFocus}
          selectTextOnFocus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label || 'Amount'}
          style={[styles.amountInput, TABULAR, { color: tint }, NO_OUTLINE as any]}
        />
      </View>
      {error ? <Text style={[TYPE.caption, styles.error]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  labelBlock: {
    marginBottom: SPACE.sm,
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
    paddingHorizontal: SPACE.lg - 2,
    height: CONTROL_HEIGHT.lg,
  },
  inputShellMultiline: {
    height: undefined,
    minHeight: 86,
    alignItems: 'flex-start',
    paddingVertical: SPACE.md,
  },
  inputShellFocused: {
    backgroundColor: COLORS.surface,
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
