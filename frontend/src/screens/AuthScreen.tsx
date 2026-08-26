import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../services/supabase';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { useFeedback } from '../ui';
import { VoiceLogo } from '../components/VoiceLogo';

// Ensure WebBrowser is initialized for OAuth flows
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  onBackToWelcome?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBackToWelcome }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const { toast } = useFeedback();

  const handleEmailAuth = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      toast('Password must be at least 6 characters.');
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
          toast('Verification email sent! Please check your inbox.');
        } else {
          toast('Account created successfully!');
        }
      }
    } catch (err: any) {
      toast(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (res.type === 'success' && res.url) {
          const parsed = Linking.parse(res.url);
          const params = parsed.queryParams;
          if (params?.access_token && params?.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token as string,
              refresh_token: params.refresh_token as string,
            });
          }
        }
      }
    } catch (err: any) {
      toast(err.message || `${provider} authentication failed.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onBackToWelcome && (
          <TouchableOpacity
            style={styles.topBackButton}
            onPress={onBackToWelcome}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
            <Text style={styles.topBackButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <VoiceLogo size={48} animated={false} />
          <Text style={styles.title}>BolKhata</Text>
          <Text style={styles.subtitle}>
            {needsEmailConfirmation
              ? 'Check your inbox'
              : mode === 'login'
              ? 'Welcome back to your digital ledger'
              : 'Create your digital ledger'}
          </Text>
        </View>

        {needsEmailConfirmation ? (
          <View style={styles.confirmCard}>
            <CheckCircle2 size={44} color="#16a34a" />
            <Text style={styles.confirmHeading}>Verify your email</Text>
            <Text style={styles.confirmBody}>
              We sent a confirmation link to <Text style={styles.boldText}>{email}</Text>. Please
              click the link in your email to activate your account.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setNeedsEmailConfirmation(false);
                setMode('login');
              }}
            >
              <Text style={styles.primaryButtonText}>Back to Log In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.textMuted} />
                ) : (
                  <Eye size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'login' ? 'Log In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.oauthContainer}>
              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleOAuth('google')}
                disabled={loading}
              >
                <Chrome size={20} color={COLORS.textPrimary} />
                <Text style={styles.oauthButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleOAuth('github')}
                disabled={loading}
              >
                <Github size={20} color={COLORS.textPrimary} />
                <Text style={styles.oauthButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
              disabled={loading}
            >
              <Text style={styles.switchModeText}>
                {mode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.ink,
    marginTop: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.ink,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.hairline,
  },
  dividerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 12,
    height: 44,
    gap: 8,
  },
  oauthButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  switchModeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  confirmCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  confirmHeading: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  confirmBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceMuted,
  },
  topBackButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
