import { Platform } from 'react-native';

// Helper to inject Google Fonts with preconnect for instant web loading
export const injectWebGoogleFonts = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const fontId = 'google-fonts-jakarta-inter';
    if (!document.getElementById(fontId)) {
      // Preconnect to Google Fonts CDN for zero-delay fetch
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);

      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }
};

const URDU_SANS =
  "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SYSTEM_SANS =
  "'Inter', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const FONTS = {
  // Headings, Brand Title, Big Numeric Ledger Figures
  heading: Platform.select({
    web: URDU_SANS,
    default: 'System',
  }),
  headingBold: Platform.select({
    web: `'Plus Jakarta Sans', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  headingExtraBold: Platform.select({
    web: `'Plus Jakarta Sans', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  headingSemiBold: Platform.select({
    web: `'Plus Jakarta Sans', ${SYSTEM_SANS}`,
    default: 'System',
  }),

  // Inter: For Body text, Subtitles, Phone numbers, Notes, Tags, Form Inputs
  body: Platform.select({
    web: `'Inter', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  bodyRegular: Platform.select({
    web: `'Inter', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  bodyMedium: Platform.select({
    web: `'Inter', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  bodySemiBold: Platform.select({
    web: `'Inter', ${SYSTEM_SANS}`,
    default: 'System',
  }),
  bodyBold: Platform.select({
    web: `'Inter', ${SYSTEM_SANS}`,
    default: 'System',
  }),
};
