import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import { Mic, Cloud, Send, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { VoiceLogo } from '../components/VoiceLogo';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const GREETINGS = [
  { text: 'خوش آمدید', font: FONTS.headingBold, size: 44, lang: 'Urdu' },
  { text: 'Welcome', font: FONTS.headingBold, size: 44, lang: 'English' },
  { text: 'جی آیاں نوں', font: FONTS.headingBold, size: 44, lang: 'Punjabi' },
  { text: 'BolKhata', font: FONTS.headingBold, size: 46, isBrand: true },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // Animate greeting cycle
  useEffect(() => {
    // Initial content entrance
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const animateGreeting = () => {
      // Fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold for 1.8s
        setTimeout(() => {
          // Fade out
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -15,
              duration: 350,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            slideAnim.setValue(15);
            setIndex((prev) => (prev + 1) % GREETINGS.length);
          });
        }, 1800);
      });
    };

    animateGreeting();
    const interval = setInterval(animateGreeting, 2700);
    return () => clearInterval(interval);
  }, []);

  const currentGreeting = GREETINGS[index];

  return (
    <View style={styles.container}>
      {/* Soft background aura circles */}
      <View style={styles.auraTop} pointerEvents="none" />
      <View style={styles.auraBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Logo and Multilingual Greeting (Apple "Hello" Style) */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <VoiceLogo size={64} animated={true} multiColor={true} />
          </View>

          <View style={styles.greetingBox}>
            <Animated.Text
              style={[
                styles.greetingText,
                {
                  fontFamily: currentGreeting.font,
                  fontSize: currentGreeting.size,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  color: currentGreeting.isBrand ? COLORS.primary : COLORS.ink,
                },
              ]}
            >
              {currentGreeting.text}
            </Animated.Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Voice-First Digital Ledger & Khata for Smart Merchants & Daily Life.
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <Animated.View style={[styles.featuresContainer, { opacity: contentFade }]}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Mic size={22} color="#4F46E5" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Speak in Urdu or English</Text>
              <Text style={styles.featureDesc}>
                Just speak your transactions: "Aslam bhai ko 500 udhaar diye". Instant voice parsing.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Send size={22} color="#059669" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>1-Tap WhatsApp Receipts</Text>
              <Text style={styles.featureDesc}>
                Send balance reminders, payment confirmations, and PDF ledgers straight to WhatsApp.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Cloud size={22} color="#0284C7" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>100% Cloud Synced & Offline</Text>
              <Text style={styles.featureDesc}>
                Access your khata from any phone or computer with real-time Supabase cloud backup.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionSection, { opacity: contentFade }]}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onGetStarted}
            activeOpacity={0.88}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.75}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={COLORS.textMuted} />
            <Text style={styles.securityText}>End-to-End Secure • Multi-Tenant Cloud</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  auraTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
  },
  auraBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  greetingBox: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingText: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
    marginTop: 4,
  },
  featuresContainer: {
    gap: 14,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  featureDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  actionSection: {
    gap: 12,
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    width: '100%',
    height: 52,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  getStartedText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
