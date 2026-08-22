import type { ComponentType } from 'react';

/**
 * Props every icon in the app is driven by. Matches the shape `lucide-react-native`
 * exposes, narrowed to what we actually set — components take an `IconComponent`
 * rather than a rendered element so they stay in control of size and colour.
 */
export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export type IconComponent = ComponentType<IconProps>;
