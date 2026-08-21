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
import { useSignIn, useSignUp, useOAuth } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Sparkles, Mail, Lock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Ensure the browser closes when the auth session completes
WebBrowser.maybeCompleteAuthSession();
import { FONTS } from '../theme/typography';

export const AuthScreen = () => {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGithubFlow } = useOAuth({ strategy: 'oauth_github' });

  const onOAuthPress = async (strategy: 'oauth_google' | 'oauth_github') => {
    try {
      const flow = strategy === 'oauth_google' ? startGoogleFlow : startGithubFlow;
      const { createdSessionId, setActive } = await flow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'myapp' })
      });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
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
    if (!isSignInLoaded) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setSignInActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setErrorMsg('Sign-in requires further action (e.g. MFA).');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!isSignUpLoaded) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || 'Sign-up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isSignUpLoaded) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
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
              <Text style={styles.oauthBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => onOAuthPress('oauth_github')}
            >
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  oauthBtnText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#0f172a',
    fontSize: 14,
  },
});
