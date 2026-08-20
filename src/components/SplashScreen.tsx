import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { FONTS } from '../theme/typography';
import { VoiceLogo } from './VoiceLogo';

interface SplashScreenProps {
  onFinish: () => void;
  storeName?: string;
  ownerName?: string;
}

const LETTERS = ['B', 'o', 'l', 'K', 'h', 'a', 't', 'a'];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  // Animation values for each letter
  const letterAnims = useRef(
    LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  useEffect(() => {
    // 1. Logo fades and gently scales in
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Staggered letter-by-letter text reveal after logo appears
    const letterStaggerAnimations = letterAnims.map((anim) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    const revealTimer = setTimeout(() => {
      Animated.stagger(65, letterStaggerAnimations).start();
    }, 350);

    // 3. Auto-transition to main screen
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={onFinish}
    >
      <View style={styles.content}>
        {/* Animated 5-Bar Black Voice Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFade,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <VoiceLogo size={64} color="#000000" animated={true} />
        </Animated.View>

        {/* Dynamic Revealing Typography */}
        <View style={styles.textRow}>
          {LETTERS.map((char, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.brandLetter,
                {
                  opacity: letterAnims[index].opacity,
                  transform: [
                    { translateY: letterAnims[index].translateY },
                    { scale: letterAnims[index].scale },
                  ],
                },
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 18,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 30,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
});
