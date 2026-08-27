import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';

import { COLORS } from '../theme/colors';
import { GUTTER, MAX_CONTENT_WIDTH, MOTION, SPACE, TYPE } from '../theme/tokens';
import { COPY } from '../i18n/copy';
import { Button, Enter } from '../ui';
import { VoiceLogo } from '../components/VoiceLogo';

interface WelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

const C = COPY.onboarding.welcome;

/**
 * The sign-in fork.
 *
 * Everything here arrives on its own beat rather than as one block — the mark
 * first, then the words, then what to do about them. The three product
 * propositions that used to sit here as pills are now the intro slides, which
 * leaves this screen doing one job.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignUp,
  onLogin,
}) => {
  const beat = { stagger: MOTION.stagger, duration: MOTION.editorial } as const;

  return (
    <View style={styles.container}>
      <View style={styles.shell}>
        <Enter index={0} {...beat} style={styles.mark}>
          <VoiceLogo size={56} color={COLORS.ink} animated multiColor={false} />
        </Enter>

        <Enter index={1} {...beat}>
          <Text style={styles.title}>{C.title}</Text>
        </Enter>

        <Enter index={2} {...beat}>
          <Text style={styles.subtitle}>{C.subtitle}</Text>
        </Enter>

        <Enter index={3} {...beat}>
          <Text style={styles.tagline}>{C.tagline}</Text>
        </Enter>

        <Enter index={4} {...beat} style={styles.actions}>
          <Button
            label={C.createAccount}
            onPress={onSignUp}
            variant="primary"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            fullWidth
          />
          <Button
            label={C.logIn}
            onPress={onLogin}
            variant="secondary"
            size="lg"
            fullWidth
          />
        </Enter>

        <Enter index={5} {...beat} style={styles.trust}>
          <ShieldCheck size={13} color={COLORS.textMuted} strokeWidth={2} />
          <Text style={styles.trustText}>{C.trust}</Text>
        </Enter>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
  },
  shell: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignItems: 'stretch',
  },
  mark: {
    alignItems: 'center',
    marginBottom: SPACE.lg,
  },
  title: {
    ...TYPE.display,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACE.xs,
  },
  subtitle: {
    ...TYPE.label,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: SPACE.md,
  },
  tagline: {
    ...TYPE.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACE.xxxl,
    paddingHorizontal: SPACE.sm,
  },
  actions: {
    gap: SPACE.md,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACE.xxl,
  },
  trustText: {
    ...TYPE.caption,
    color: COLORS.textMuted,
  },
});
