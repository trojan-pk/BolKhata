import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Mic, Cloud, Send, ShieldCheck, ArrowRight, LogIn, UserPlus } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { VoiceLogo } from '../components/VoiceLogo';

interface WelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignUp, onLogin }) => {
  const contentFade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: contentFade,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Minimalist Solid Black Voice Logo */}
        <View style={styles.logoSection}>
          <VoiceLogo size={56} color={COLORS.ink} animated={true} multiColor={false} />
        </View>

        {/* Clean English Heading */}
        <Text style={styles.headingTitle}>Welcome</Text>
        <Text style={styles.brandSubtitle}>BolKhata · Digital Voice Ledger</Text>

        <Text style={styles.tagline}>
          Track customer udhaar, cashbook, and personal expenses with smart voice commands.
        </Text>

        {/* Concise Feature Badges */}
        <View style={styles.featureRow}>
          <View style={styles.featurePill}>
            <Mic size={14} color={COLORS.ink} />
            <Text style={styles.featurePillText}>Speak to Record</Text>
          </View>

          <View style={styles.featurePill}>
            <Send size={14} color="#16a34a" />
            <Text style={styles.featurePillText}>WhatsApp Receipts</Text>
          </View>

          <View style={styles.featurePill}>
            <Cloud size={14} color="#0284c7" />
            <Text style={styles.featurePillText}>Cloud Synced</Text>
          </View>
        </View>

        {/* Action Buttons: Sign Up & Log In */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSignUp}
            activeOpacity={0.88}
          >
            <UserPlus size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Create Free Account</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <LogIn size={18} color={COLORS.ink} />
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Trust Badge */}
        <View style={styles.trustBadge}>
          <ShieldCheck size={13} color={COLORS.textMuted} />
          <Text style={styles.trustText}>Private & Secure • Multi-Tenant Cloud</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
  },
  logoSection: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  featurePillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  actionSection: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    height: 48,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: '600',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  trustText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
