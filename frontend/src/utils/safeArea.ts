import { Platform, Dimensions } from 'react-native';

/**
 * Calculates safe bottom hardware insets for Android system navigation bars,
 * iOS gesture home indicators, and Web views with zero external dependency overhead.
 */
export function getBottomInset(): number {
  if (Platform.OS === 'android') {
    // Android 3-Button Navigation Bar / Gesture bar offset
    return 28;
  }
  if (Platform.OS === 'ios') {
    const dim = Dimensions.get('window');
    const isIPhoneWithNotch = dim.height >= 812 || dim.width >= 812;
    return isIPhoneWithNotch ? 24 : 16;
  }
  return 16;
}
