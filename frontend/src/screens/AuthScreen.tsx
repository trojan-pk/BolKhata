import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react-native';

import { supabase } from '../services/supabase';
import {
  describeAuthError,
  isExistingAccountSignup,
  isValidEmail,
} from '../services/authErrors';
import { COLORS } from '../theme/colors';
import {
  CONTROL_HEIGHT,
  GUTTER,
  MOTION,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { COPY } from '../i18n/copy';
import { Button, CrossFade, Enter, Press, useFeedback } from '../ui';
import type { IconComponent } from '../ui';
import { VoiceLogo } from '../components/VoiceLogo';
import { GoogleIcon } from '../components/GoogleIcon';

/**
 * Closes the OAuth popup on web when the provider redirects back into it.
 *
 * This is a web-only concern — on native it is a no-op. It used to sit behind
 * `Platform.OS !== 'web'`, i.e. it only ran where it does nothing.
 */
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onBackToWelcome?: () => void;
}

const C = COPY.onboarding.auth;

/** Seconds to block the resend button for after a mail is dispatched. */
const RESEND_COOLDOWN = 45;

/**
 * Where the provider (or the confirmation mail) should send the user back to.
 *
 * The web branch keeps `pathname`, not just `origin` — the app is served from a
 * subpath in the static export, and dropping it landed the callback on a 404
 * instead of the app.
 */
const getAuthRedirectUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return Linking.createURL('auth/callback');
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login', onBackToWelcome }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  /**
   * Frozen copy of the address the confirmation mail went to. The live `email`
   * field is still editable behind the card, so reading it there would let the
   * card describe an address we never actually mailed.
   */
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const { toast } = useFeedback();

  /**
   * Guards every `setState` that lands after an `await`. Without it, a sign-in
   * that resolves once the session has already swapped this screen out warns
   * about updating an unmounted component.
   */
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  /* Ticks the resend cooldown down to zero. */
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const passwordRef = useRef<TextInput>(null);

  /** Moves the user into the "check your inbox" state for a known address. */
  const enterConfirmation = useCallback((address: string, startCooldown: boolean) => {
    setPendingEmail(address);
    setNeedsEmailConfirmation(true);
    if (startCooldown) setResendIn(RESEND_COOLDOWN);
  }, []);

  const leaveConfirmation = useCallback(() => {
    setNeedsEmailConfirmation(false);
    setResendIn(0);
    setMode('login');
  }, []);

  /** Shared validation so login and signup reject the same bad input. */
  const validate = (cleanEmail: string): boolean => {
    if (!cleanEmail || !password) {
      toast(C.needBoth);
      return false;
    }
    if (!isValidEmail(cleanEmail)) {
      toast(C.invalidEmail);
      return false;
    }
    // Only signup owns the length rule — on login the server is the authority,
    // and rejecting locally would lock out any account created before it.
    if (mode === 'signup' && password.length < 6) {
      toast(C.shortPassword);
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!validate(cleanEmail)) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        // Success needs no toast: onAuthStateChange swaps the whole screen for
        // the ledger, which is a clearer confirmation than any message.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        });
        if (error) throw error;

        if (isExistingAccountSignup(data.user)) {
          // Supabase reports this as a success to avoid leaking which addresses
          // are registered. Claiming "verification sent" left the user waiting
          // for a mail that was never going to arrive.
          if (!alive.current) return;
          setMode('login');
          toast(C.accountExists);
          return;
        }

        if (data.user && !data.session) {
          if (!alive.current) return;
          enterConfirmation(cleanEmail, true);
          toast(C.verificationSent);
        } else if (data.session) {
          // Confirmations are off on this project — the user is already in.
          toast(C.accountCreated);
        }
      }
    } catch (err) {
      const failure = describeAuthError(err);
      if (!alive.current) return;

      // An unverified address on login is a recoverable state, not a failure:
      // drop into the confirmation card where resend and retry live.
      if (failure.kind === 'unconfirmed') {
        enterConfirmation(cleanEmail, false);
      } else if (failure.kind === 'exists') {
        setMode('login');
      }
      toast(failure.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  /** Re-sends the signup confirmation mail, rate-limited on our side too. */
  const handleResend = async () => {
    if (loading || resendIn > 0 || !pendingEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
      if (!alive.current) return;
      setResendIn(RESEND_COOLDOWN);
      toast(C.resendSent);
    } catch (err) {
      const failure = describeAuthError(err);
      if (!alive.current) return;
      // The server's own cooldown is authoritative; mirror it in the button.
      if (failure.kind === 'rateLimit') setResendIn(RESEND_COOLDOWN);
      toast(failure.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  /**
   * "I've confirmed — continue".
   *
   * Confirming in a browser on the same device deep-links back and signs the
   * user in on its own. This covers the other case — confirming on a laptop, or
   * in a browser that never returned to the app — by retrying the sign-in with
   * the credentials already in hand instead of making them type them again.
   */
  const handleConfirmedContinue = async () => {
    if (loading) return;

    // A session may already exist if the deep link landed while this card was up.
    const { data: existing } = await supabase.auth.getSession();
    if (existing?.session) return;

    if (!password) {
      leaveConfirmation();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: pendingEmail,
        password,
      });
      if (error) throw error;
    } catch (err) {
      const failure = describeAuthError(err);
      if (!alive.current) return;
      toast(failure.kind === 'unconfirmed' ? C.stillUnconfirmed : failure.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const redirectUrl = getAuthRedirectUrl();
      const isNative = Platform.OS !== 'web';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative,
        },
      });
      if (error) throw error;

      // Web: supabase-js has already navigated the tab to Google. Nothing left
      // to do here, and the spinner stays up until the page unloads.
      if (!isNative) return;

      if (!data?.url) throw new Error(C.googleNoSession);

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      // Closing the sheet is a deliberate choice, not a fault — say so quietly
      // instead of leaving the button to spin back with no explanation.
      if (res.type !== 'success' || !res.url) {
        if (alive.current) toast(C.googleCancelled);
        return;
      }

      const parsed = Linking.parse(res.url);

      // Google reports refusals in the callback rather than by failing the request.
      const denied =
        (parsed.queryParams?.error_description as string) ||
        (parsed.queryParams?.error as string);
      if (denied) throw new Error(String(denied));

      // 1. PKCE: the normal path for `flowType: 'pkce'`.
      if (parsed.queryParams?.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          String(parsed.queryParams.code)
        );
        if (exchangeError) throw exchangeError;
        return;
      }

      // 2. Implicit fallback: tokens in the hash, then in the query string.
      let accessToken: string | undefined;
      let refreshToken: string | undefined;

      const hashIdx = res.url.indexOf('#');
      if (hashIdx !== -1) {
        const hashParams = new URLSearchParams(res.url.substring(hashIdx + 1));
        accessToken = hashParams.get('access_token') ?? undefined;
        refreshToken = hashParams.get('refresh_token') ?? undefined;
      }
      if (!accessToken || !refreshToken) {
        accessToken = (parsed.queryParams?.access_token as string) || accessToken;
        refreshToken = (parsed.queryParams?.refresh_token as string) || refreshToken;
      }

      if (!accessToken || !refreshToken) {
        // Previously this fell through silently: the sheet closed, the spinner
        // stopped, and the user was left on the login form with no session and
        // no idea why.
        throw new Error(C.googleNoSession);
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
    } catch (err) {
      if (alive.current) toast(describeAuthError(err).message);
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  /*
   * Login and signup share an identical form — only the subtitle, the primary
   * label and the switch link differ. So the cross-fades are scoped to exactly
   * those three, rather than dissolving the whole body and re-fading fields that
   * look the same either way. The body-level fade is reserved for the one real
   * change of content: form ↔ confirmation card.
   */
  const bodyPhase = needsEmailConfirmation ? 'confirm' : 'form';
  const textPhase = needsEmailConfirmation ? 'confirm' : mode;
  /** Signup and the confirmation card are steps forward; login is a step back. */
  const sense: 1 | -1 = needsEmailConfirmation || mode === 'signup' ? 1 : -1;

  const beat = { stagger: MOTION.stagger, duration: MOTION.editorial } as const;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onBackToWelcome && (
          <Enter index={0} {...beat} style={styles.backSlot}>
            <Press
              onPress={onBackToWelcome}
              accessibilityLabel={C.back}
              style={styles.back}
            >
              <ArrowLeft size={17} color={COLORS.textPrimary} strokeWidth={2.2} />
              <Text style={styles.backText}>{C.back}</Text>
            </Press>
          </Enter>
        )}

        <Enter index={1} {...beat} style={styles.header}>
          <VoiceLogo size={48} animated={false} />
          <Text style={styles.title}>{COPY.brand}</Text>
          <CrossFade phase={textPhase} direction={sense} distance={12}>
            <Text style={styles.subtitle}>
              {needsEmailConfirmation
                ? C.subtitleConfirm
                : mode === 'login'
                ? C.subtitleLogin
                : C.subtitleSignup}
            </Text>
          </CrossFade>
        </Enter>

        <CrossFade phase={bodyPhase} direction={sense}>
          {needsEmailConfirmation ? (
            <View style={styles.confirmCard}>
              <CheckCircle2 size={40} color={COLORS.credit} strokeWidth={1.9} />
              <Text style={styles.confirmHeading}>{C.confirmHeading}</Text>
              <Text style={styles.confirmBody}>
                {C.confirmBody}
                {'\n'}
                <Text style={styles.confirmEmail}>{pendingEmail}</Text>
              </Text>
              <Text style={styles.confirmHint}>{C.confirmHint}</Text>

              <Button
                label={C.continueAfterConfirm}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleConfirmedContinue}
              />
              <Button
                label={resendIn > 0 ? C.resendIn(resendIn) : C.resend}
                variant="secondary"
                size="lg"
                icon={RefreshCw}
                fullWidth
                disabled={loading || resendIn > 0}
                onPress={handleResend}
              />
              <Press
                onPress={leaveConfirmation}
                accessibilityLabel={C.backToLogin}
                scale={1}
                dim={0.6}
                style={styles.confirmBackPress}
              >
                <Text style={styles.switchText}>{C.backToLogin}</Text>
              </Press>
            </View>
          ) : (
            <View style={styles.form}>
              <Enter index={2} {...beat}>
                <Field
                  icon={Mail}
                  placeholder={C.email}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </Enter>

              <Enter index={3} {...beat}>
                <Field
                  inputRef={passwordRef}
                  icon={Lock}
                  placeholder={C.password}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  /* Lets a password manager offer to save a new credential on
                     signup, and to fill an existing one on login. */
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  returnKeyType="go"
                  onSubmitEditing={handleEmailAuth}
                  trailing={
                    <Press
                      onPress={() => setShowPassword((s) => !s)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      scale={1}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={COLORS.textMuted} strokeWidth={2} />
                      ) : (
                        <Eye size={18} color={COLORS.textMuted} strokeWidth={2} />
                      )}
                    </Press>
                  }
                />
              </Enter>

              <Enter index={4} {...beat} style={styles.submitSlot}>
                <CrossFade phase={textPhase} direction={sense} distance={12}>
                  <Button
                    label={mode === 'login' ? C.logIn : C.signUp}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    onPress={handleEmailAuth}
                  />
                </CrossFade>
              </Enter>

              <Enter index={5} {...beat}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{C.or}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Press
                  onPress={handleGoogleAuth}
                  disabled={loading}
                  style={styles.googleButton}
                  scale={0.98}
                >
                  <GoogleIcon size={20} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </Press>
              </Enter>

              <Enter index={6} {...beat} style={styles.switchSlot}>
                <CrossFade phase={textPhase} direction={sense} distance={12}>
                  <Press
                    onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    disabled={loading}
                    scale={1}
                    dim={0.6}
                    style={styles.switchPress}
                  >
                    <Text style={styles.switchText}>
                      {mode === 'login' ? C.toSignup : C.toLogin}
                    </Text>
                  </Press>
                </CrossFade>
              </Enter>
            </View>
          )}
        </CrossFade>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* --------------------------------------------------------------------- field -- */

/**
 * A text field whose hairline warms to the accent border on focus.
 *
 * Border colour can't go on the native driver, so this one timing runs on JS —
 * it's a single short colour ramp on an idle screen, which is exactly the case
 * where that's affordable.
 */
const Field: React.FC<{
  icon: IconComponent;
  placeholder: string;
  value: string;
  onChangeText: (next: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  trailing?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
}> = ({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  editable = true,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  trailing,
  inputRef,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
}) => {
  const focus = useRef(new Animated.Value(0)).current;

  const ramp = (to: number) =>
    Animated.timing(focus, {
      toValue: to,
      duration: MOTION.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

  const borderColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.hairline, COLORS.accentBorder],
  });

  return (
    <Animated.View style={[styles.field, { borderColor }]}>
      <Icon size={18} color={COLORS.textMuted} strokeWidth={2} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        /* Enter submits instead of inserting a newline. */
        blurOnSubmit={false}
        onFocus={() => ramp(1)}
        onBlur={() => ramp(0)}
      />
      {trailing}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACE.xxl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  backSlot: {
    alignSelf: 'flex-start',
    marginBottom: SPACE.lg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surfaceMuted,
  },
  backText: {
    ...TYPE.label,
    color: COLORS.textPrimary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACE.xxxl,
  },
  title: {
    ...TYPE.title1,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.ink,
    marginTop: SPACE.md,
  },
  subtitle: {
    ...TYPE.bodySm,
    color: COLORS.textMuted,
    marginTop: SPACE.xs,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: SPACE.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.lg,
    height: CONTROL_HEIGHT.lg,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    color: COLORS.textPrimary,
    height: '100%',
    // Web-only: the browser's own focus ring would fight the animated border.
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none' } as unknown as object)
      : null),
  },
  submitSlot: {
    marginTop: SPACE.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACE.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.hairline,
  },
  dividerText: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    marginHorizontal: SPACE.md,
    letterSpacing: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    height: CONTROL_HEIGHT.lg,
    borderRadius: RADIUS.md,
    gap: SPACE.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    ...TYPE.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchSlot: {
    marginTop: SPACE.sm,
  },
  switchPress: {
    alignItems: 'center',
    paddingVertical: SPACE.sm,
  },
  switchText: {
    ...TYPE.label,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  confirmCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.lg,
    padding: SPACE.xxl,
    alignItems: 'center',
    gap: SPACE.md,
  },
  confirmHeading: {
    ...TYPE.title2,
    color: COLORS.textPrimary,
  },
  confirmBody: {
    ...TYPE.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  confirmHint: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACE.xs,
  },
  confirmBackPress: {
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  confirmEmail: {
    ...TYPE.label,
    color: COLORS.textPrimary,
  },
});
