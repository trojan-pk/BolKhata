import { Platform } from 'react-native';
import { COLORS } from './colors';

/**
 * Web-only stylesheet for the handful of things React Native Web can't express
 * as inline styles.
 *
 * Mount once at startup, next to `injectWebGoogleFonts`. Everything here is
 * additive polish — the app renders correctly without it, it just feels less
 * finished in a browser.
 */
export const injectWebStyles = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const id = 'bolkhata-web-polish';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
  /*
    Focus rings, restored.

    Pressables carry \`outline-style: none\` so a tap doesn't leave a halo behind
    it — but that also removed the only affordance a keyboard user has for
    knowing where they are. :focus-visible gives it back to exactly the people
    who need it: the pseudo-class matches keyboard focus and not pointer focus,
    so the tap stays clean and Tab stays navigable.
  */
  *:focus-visible {
    outline: 2px solid ${COLORS.accent} !important;
    outline-offset: 2px !important;
    border-radius: 4px;
  }

  /* The grey flash Chrome paints over a tapped element, which fights the
     app's own press animation. */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Stops the browser's own rubber-band from firing underneath a
     RefreshControl pull, which otherwise moves the whole page. */
  html, body {
    overscroll-behavior-y: none;
  }

  ::selection {
    background: ${COLORS.accentSoft};
    color: ${COLORS.textPrimary};
  }

  /* A hairline scrollbar. The default is 15px of chrome-grey down the side of a
     near-monochrome app. */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${COLORS.hairlineStrong} transparent;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${COLORS.hairlineStrong};
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${COLORS.textFaint};
  }

  /* Number inputs shouldn't offer spinners for a currency amount. */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

  document.head.appendChild(style);
};
