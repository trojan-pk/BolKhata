/**
 * Minimal WebCrypto for React Native, backed by expo-crypto.
 *
 * Hermes has no `crypto.subtle`, so supabase-js fell back to the `plain` PKCE
 * method ("WebCrypto API is not supported…"): the code challenge sent to the
 * OAuth provider was the verifier itself, so anyone who saw the redirect URL
 * could redeem the code. With `subtle.digest` available it uses S256.
 *
 * Only what supabase-js needs is provided — `getRandomValues` and
 * `subtle.digest`. Existing implementations are never overwritten, and web
 * (which has real WebCrypto) is left alone. Import this first, before any
 * module that touches `crypto`.
 */
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  // expo-crypto is native. A dev build compiled before it was added doesn't
  // contain the module, and a static import would crash the app on launch —
  // so load it defensively and keep today's behaviour until the next rebuild.
  let ExpoCrypto: typeof import('expo-crypto') | null = null;
  try {
    ExpoCrypto = require('expo-crypto');
  } catch (err) {
    console.warn('[webcrypto] expo-crypto native module missing; rebuild the dev client to enable SHA-256 PKCE.', err);
  }

  if (ExpoCrypto) {
    const { CryptoDigestAlgorithm, digest, getRandomValues } = ExpoCrypto;
    const DIGESTS: Record<string, import('expo-crypto').CryptoDigestAlgorithm> = {
      'SHA-1': CryptoDigestAlgorithm.SHA1,
      'SHA-256': CryptoDigestAlgorithm.SHA256,
      'SHA-384': CryptoDigestAlgorithm.SHA384,
      'SHA-512': CryptoDigestAlgorithm.SHA512,
    };

    const g = globalThis as any;
    if (!g.crypto) g.crypto = {};
    const c = g.crypto;

    if (typeof c.getRandomValues !== 'function') {
      c.getRandomValues = getRandomValues;
    }

    if (!c.subtle) {
      c.subtle = {
        digest: (algorithm: string | { name: string }, data: BufferSource): Promise<ArrayBuffer> => {
          const name = (typeof algorithm === 'string' ? algorithm : algorithm?.name || '').toUpperCase();
          const alg = DIGESTS[name];
          if (!alg) return Promise.reject(new Error(`Unsupported digest algorithm: ${name}`));
          return digest(alg, data);
        },
      };
    }
  }
}
