import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { BookOpen, Mic, ShieldCheck, Zap, Store, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
  storeName?: string;
  ownerName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  storeName = 'Sharma General Store',
  ownerName = 'Rajesh Sharma',
}) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  const steps = [
    'Initializing local shop database...',
    'Loading customer credit & debit ledgers...',
    'Setting up voice assistant BolKhata...',
    'Express API connector ready for future backend...',
    `Welcome, ${ownerName}!`,
  ];

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulsing animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Step progress timeline
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Decor Ambient Circles */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Animated Brand Logo Icon */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.logoBadge}>
            <BookOpen size={48} color="#ffffff" strokeWidth={2.5} />
            <View style={styles.micOverlay}>
              <Mic size={20} color="#ffffff" strokeWidth={3} />
            </View>
          </View>
        </Animated.View>

        {/* Title & Taglines */}
        <Text style={styles.brandTitle}>BolKhata</Text>
        <Text style={styles.localizedTitle}>বল খাতা  •  बोल खाता</Text>

        <View style={styles.taglineBadge}>
          <Store size={14} color={COLORS.primary} />
          <Text style={styles.taglineText}>Store Owner Ledger & Udhaar Manager</Text>
        </View>

        <Text style={styles.storeWelcome}>{storeName}</Text>

        {/* Progress & Loading Status */}
        <View style={styles.progressCard}>
          {loadingStep < steps.length - 1 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.stepText}>{steps[loadingStep]}</Text>
            </View>
          ) : (
            <View style={styles.readyRow}>
              <ShieldCheck size={20} color={COLORS.gotGreen} />
              <Text style={styles.readyText}>{steps[loadingStep]}</Text>
            </View>
          )}

          {/* Progress Bar Indicator */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((loadingStep + 1) / steps.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Action Button to enter app */}
        <TouchableOpacity
          style={styles.enterButton}
          activeOpacity={0.85}
          onPress={onFinish}
        >
          <Text style={styles.enterButtonText}>Open Shop Khata</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Footer Badges */}
        <View style={styles.footerRow}>
          <View style={styles.footerBadge}>
            <Zap size={12} color={COLORS.gotGreen} />
            <Text style={styles.footerBadgeText}>100% Offline Ready</Text>
          </View>

          <Text style={styles.footerDivider}>•</Text>

          <View style={styles.footerBadge}>
            <Text style={styles.footerBadgeText}>Express API Ready</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Sleek Navy dark theme
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bgGlowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  micOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.gotGreen,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  localizedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 13,
    color: '#60a5fa',
    fontWeight: '600',
  },
  storeWelcome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 8,
    marginBottom: 32,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    flex: 1,
  },
  readyText: {
    fontSize: 14,
    color: COLORS.gotGreen,
    fontWeight: '700',
    flex: 1,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  enterButton: {
    width: '100%',
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 24,
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  footerDivider: {
    color: '#475569',
  },
});
