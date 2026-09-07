import React from 'react';
import { Platform } from 'react-native';
import AuroraWeb from './AuroraWeb';
import AuroraNative from './AuroraNative';

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  lightMode?: boolean;
}

export const Aurora: React.FC<AuroraProps> = (props) => {
  if (Platform.OS === 'web') {
    return <AuroraWeb {...props} />;
  }
  return <AuroraNative {...props} />;
};

export default Aurora;
