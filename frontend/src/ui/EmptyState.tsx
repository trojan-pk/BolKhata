import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, ButtonVariant } from './Button';

/**
 * Empty states are the app's first impression, so they carry an explanation and
 * a way forward rather than just an apology.
 */
export const EmptyState: React.FC<{
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  actionIcon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** `compact` fits inside a card; `full` fills a screen. */
  size?: 'compact' | 'full';
  style?: StyleProp<ViewStyle>;
}> = ({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  actionIcon,
  size = 'compact',
  style,
}) => (
  <View
    style={[
      styles.wrap,
      size === 'full' ? styles.wrapFull : styles.wrapCompact,
      style,
    ]}
  >
    {Icon ? (
      <View style={styles.iconWell}>
        <Icon size={22} color={COLORS.textFaint} strokeWidth={1.8} />
      </View>
    ) : null}

    <Text style={[TYPE.title3, styles.title]}>{title}</Text>

    {body ? <Text style={[TYPE.bodySm, styles.body]}>{body}</Text> : null}

    {actionLabel ? (
      <Button
        label={actionLabel}
        onPress={onAction}
        variant={actionVariant}
        icon={actionIcon}
        size="md"
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapCompact: {
    paddingVertical: SPACE.xxl,
    paddingHorizontal: SPACE.lg,
  },
  wrapFull: {
    paddingVertical: SPACE.huge + SPACE.lg,
    paddingHorizontal: SPACE.xxl,
  },
  iconWell: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  title: {
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  body: {
    ...TYPE.bodySm,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: SPACE.xs + 2,
    maxWidth: 320,
  },
  action: {
    marginTop: SPACE.xl,
  },
});
