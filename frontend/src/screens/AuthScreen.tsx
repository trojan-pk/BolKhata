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
} from 'react-native';
import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Sparkles, Mail, Lock } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';

const GoogleIcon = ({ size = 18, style }: { size?: number, style?: any }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </Svg>
);

// Ensure the browser closes when the auth session completes
WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = () => {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  
  const { startSSOFlow: startGoogleFlow } = useSSO({ strategy: 'oauth_google' });
  const { startSSOFlow: startGithubFlow } = useSSO({ strategy: 'oauth_github' });

  const onOAuthPress = async (strategy: 'oauth_google' | 'oauth_github') => {
    try {
      const flow = strategy === 'oauth_google' ? startGoogleFlow : startGithubFlow;
      const { createdSessionId, setActive } = await flow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'bolkhata' })
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || `${strategy} login failed`);
    }
  };

  const [isLogin, setIsLogin] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onSignInPress = async () => {
    if (!signIn) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await signIn.create({
        strategy: 'password',
        identifier: emailAddress,
        password,
      });

      if (error) {
        setErrorMsg('Login failed.');
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => {} });
      } else {
        console.error(signIn.status);
        setErrorMsg('Sign-in requires further action (e.g. MFA).');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!signUp) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error: createError } = await signUp.create({
        emailAddress,
        password,
      });
      if (createError) {
        setErrorMsg('Sign-up failed.');
        return;
      }

      const { error: prepError } = await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      if (prepError) {
        setErrorMsg('Failed to prepare verification.');
        return;
      }
      setPendingVerification(true);
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || 'Sign-up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!signUp) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (error) {
        setErrorMsg('Verification failed.');
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({ navigate: () => {} });
      } else {
        setErrorMsg('Verification incomplete.');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Sparkles size={32} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.title}>BolKhata</Text>
          <Text style={styles.subtitle}>
            {pendingVerification
              ? 'Verify your email'
              : isLogin
              ? 'Welcome back!'
              : 'Create your account'}
          </Text>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {!pendingVerification && (
          <>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                onChangeText={setEmailAddress}
                style={styles.input}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={password}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                onChangeText={setPassword}
                onSubmitEditing={isLogin ? onSignInPress : onSignUpPress}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={isLogin ? onSignInPress : onSignUpPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>
                  {isLogin ? 'Log In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
            >
              <Text style={styles.switchBtnText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Log In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => onOAuthPress('oauth_google')}
            >
              <GoogleIcon size={18} style={styles.oauthIcon} />
              <Text style={styles.oauthBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => onOAuthPress('oauth_github')}
            >
              <FontAwesome name="github" size={18} color="#333" style={styles.oauthIcon} />
              <Text style={styles.oauthBtnText}>Continue with GitHub</Text>
            </TouchableOpacity>
          </>
        )}

        {pendingVerification && (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                value={code}
                placeholder="Enter Verification Code"
                placeholderTextColor="#94a3b8"
                onChangeText={setCode}
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={onPressVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>Verify Email</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        
        {/* Required for Clerk bot protection during sign-up */}
        <View nativeID="clerk-captcha" />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    color: COLORS.gaveRed,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
  },
  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  mainBtnText: {
    fontFamily: FONTS.bodyBold,
    color: '#ffffff',
    fontSize: 15,
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchBtnText: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.primary,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontFamily: FONTS.bodyMedium,
    color: '#94a3b8',
    marginHorizontal: 10,
    fontSize: 13,
  },
  oauthBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  oauthIcon: {
    marginRight: 10,
  },
  oauthBtnText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#0f172a',
    fontSize: 14,
  },
});
