import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { CONTROL_HEIGHT, RADIUS, SPACE, TYPE } from '../theme/tokens';
import { IconComponent } from './icon';
import { Press } from './Press';

export type ButtonVariant =
  /** Ink fill. One per screen — the thing you most likely want to do. */
  | 'primary'
  /** Accent fill. Voice / AI actions. */
  | 'accent'
  /** White fill with a hairline. The workhorse. */
  | 'secondary'
  /** No fill, no border. Inline and toolbar actions. */
  | 'ghost'
  /** Money in. */
  | 'credit'
  /** Money out. */
  | 'debit'
  /** Destructive. */
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Lucide icon component, e.g. `Plus`. */
  icon?: IconComponent;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const FILL: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: COLORS.ink },
  accent: { backgroundColor: COLORS.accent },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairlineStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  credit: { backgroundColor: COLORS.credit },
  debit: { backgroundColor: COLORS.debit },
  danger: {
    backgroundColor: COLORS.debitSoft,
    borderWidth: 1,
    borderColor: COLORS.debitBorder,
  },
};

const INK: Record<ButtonVariant, string> = {
  primary: COLORS.textOnInk,
  accent: COLORS.textOnInk,
  secondary: COLORS.textPrimary,
  ghost: COLORS.accent,
  credit: COLORS.textOnInk,
  debit: COLORS.textOnInk,
  danger: COLORS.debit,
};

const SIZING: Record<ButtonSize, { height: number; pad: number; gap: number; icon: number }> = {
  sm: { height: CONTROL_HEIGHT.sm, pad: SPACE.md, gap: 6, icon: 15 },
  md: { height: CONTROL_HEIGHT.md, pad: SPACE.lg, gap: SPACE.sm, icon: 17 },
  lg: { height: CONTROL_HEIGHT.lg, pad: SPACE.xl, gap: SPACE.sm, icon: 19 },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}) => {
  const dims = SIZING[size];
  const tint = INK[variant];
  const isBlocked = disabled || loading;

  const iconNode = Icon ? (
    <Icon size={dims.icon} color={tint} strokeWidth={2.2} />
  ) : null;

  return (
    <Press
      onPress={isBlocked ? undefined : onPress}
      disabled={isBlocked}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={[
        styles.base,
        FILL[variant],
        {
          height: dims.height,
          paddingHorizontal: variant === 'ghost' ? SPACE.sm : dims.pad,
          gap: dims.gap,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <>
          {iconPosition === 'left' ? iconNode : null}
          <Text
            style={[
              size === 'sm' ? TYPE.label : styles.labelMd,
              { color: tint },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconPosition === 'right' ? iconNode : null}
        </>
      )}
    </Press>
  );
};

/** Square icon-only control. Used in headers and toolbars. */
export const IconButton: React.FC<{
  icon: IconComponent;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'surface' | 'ghost' | 'ink' | 'danger' | 'credit';
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({
  icon: Icon,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = CONTROL_HEIGHT.sm,
  disabled,
  style,
}) => {
  const skin: Record<string, { box: ViewStyle; tint: string }> = {
    surface: {
      box: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.hairline,
      },
      tint: COLORS.textSecondary,
    },
    ghost: { box: { backgroundColor: 'transparent' }, tint: COLORS.textSecondary },
    ink: { box: { backgroundColor: COLORS.ink }, tint: COLORS.textOnInk },
    danger: {
      box: {
        backgroundColor: COLORS.debitSoft,
        borderWidth: 1,
        borderColor: COLORS.debitBorder,
      },
      tint: COLORS.debit,
    },
    credit: { box: { backgroundColor: COLORS.credit }, tint: COLORS.textOnInk },
  };

  const { box, tint } = skin[variant];

  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.iconBtn,
        box,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Icon size={Math.round(size * 0.44)} color={tint} strokeWidth={2} />
    </Press>
  );
};

/** Text-only affordance: "View all", "Change", inline links. */
export const LinkButton: React.FC<{
  label: string;
  onPress?: () => void;
  tone?: 'accent' | 'muted' | 'danger';
}> = ({ label, onPress, tone = 'accent' }) => {
  const tint =
    tone === 'accent'
      ? COLORS.accent
      : tone === 'danger'
      ? COLORS.debit
      : COLORS.textMuted;
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      scale={1}
      dim={0.55}
    >
      <Text style={[TYPE.label, { color: tint }]}>{label}</Text>
    </Press>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    width: '100%',
  },
  labelMd: {
    ...TYPE.label,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
