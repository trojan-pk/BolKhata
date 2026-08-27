import React, { useRef, useState } from 'react';
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
} from 'lucide-react-native';

import { supabase } from '../services/supabase';
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

// Ensure WebBrowser is initialized for OAuth flows
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onBackToWelcome?: () => void;
}

const C = COPY.onboarding.auth;

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login', onBackToWelcome }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const { toast } = useFeedback();

  const handleEmailAuth = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast(C.needBoth);
      return;
    }

    if (password.length < 6) {
      toast(C.shortPassword);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      } else {
        const redirectUrl =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? window.location.origin
            : Linking.createURL('/');

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setNeedsEmailConfirmation(true);
          toast(C.verificationSent);
        } else {
          toast(C.accountCreated);
        }
      }
    } catch (err: any) {
      toast(err.message || C.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const redirectUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('not enabled') ||
          (error as any).code === 400 ||
          (error as any).status === 400
        ) {
          throw new Error(
            'Google Sign-In is not enabled in your Supabase project. Please enable Google in Supabase Dashboard > Authentication > Providers or use Email login.'
          );
        }
        throw error;
      }

      if (Platform.OS !== 'web' && data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (res.type === 'success' && res.url) {
          let accessToken: string | undefined;
          let refreshToken: string | undefined;

          // 1. Try parsing from hash fragment (#access_token=...)
          const hashIdx = res.url.indexOf('#');
          if (hashIdx !== -1) {
            const hashStr = res.url.substring(hashIdx + 1);
            const hashParams = new URLSearchParams(hashStr);
            accessToken = hashParams.get('access_token') ?? undefined;
            refreshToken = hashParams.get('refresh_token') ?? undefined;
          }

          // 2. Fallback to query params (?access_token=...)
          if (!accessToken || !refreshToken) {
            const parsed = Linking.parse(res.url);
            accessToken = (parsed.queryParams?.access_token as string) || accessToken;
            refreshToken = (parsed.queryParams?.refresh_token as string) || refreshToken;
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (err: any) {
      toast(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
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
                <Text style={styles.confirmEmail}>{email}</Text>
              </Text>
              <Button
                label={C.backToLogin}
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  setNeedsEmailConfirmation(false);
                  setMode('login');
                }}
              />
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
                />
              </Enter>

              <Enter index={3} {...beat}>
                <Field
                  icon={Lock}
                  placeholder={C.password}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
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
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
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
    marginBottom: SPACE.xs,
  },
  confirmEmail: {
    ...TYPE.label,
    color: COLORS.textPrimary,
  },
});
