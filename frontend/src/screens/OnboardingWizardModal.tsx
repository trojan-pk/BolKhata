import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Phone,
  Sparkles,
  Store,
  User,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { MOTION } from '../theme/tokens';
import { StoreProfile } from '../types';
import { Button, CrossFade, Enter, Press, useFeedback } from '../ui';

interface OnboardingWizardModalProps {
  visible: boolean;
  userEmail?: string;
  onComplete: (profile: StoreProfile) => Promise<void>;
}

const BUSINESS_CATEGORIES = [
  '🛒 Kiryana & Grocery',
  '📱 Mobile & Tech',
  '👗 Garments & Cloth',
  '💊 Medical & Pharmacy',
  '📦 Wholesale & Trade',
  '🍽️ Cafe & Food',
  '🔧 Hardware & Auto',
  '💼 Service & Agency',
  '🏪 General Store',
];

const CURRENCIES = [
  { label: 'Rs (PKR)', value: 'Rs' },
  { label: '₹ (INR)', value: '₹' },
  { label: '$ (USD)', value: '$' },
  { label: 'AED', value: 'AED' },
  { label: 'SAR', value: 'SAR' },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  visible,
  userEmail,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'commercial' | 'personal'>('commercial');
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessCategory, setBusinessCategory] = useState('🛒 Kiryana & Grocery');
  const [currency, setCurrency] = useState('Rs');
  const [saving, setSaving] = useState(false);
  const { toast } = useFeedback();

  const handleNext = () => {
    setStep(2);
  };

  const handleFinish = async () => {
    if (accountType === 'commercial' && !storeName.trim()) {
      toast('Please enter your Shop or Business name.');
      return;
    }
    if (!ownerName.trim()) {
      toast(accountType === 'commercial' ? 'Please enter the Owner/Manager name.' : 'Please enter your Name.');
      return;
    }

    setSaving(true);
    try {
      const profile: StoreProfile = {
        name: accountType === 'commercial' ? storeName.trim() : `${ownerName.trim()}'s Khata`,
        ownerName: ownerName.trim(),
        mobile: phone.trim(),
        currency,
        language: 'roman_ur',
        accountType,
        businessCategory: accountType === 'commercial' ? businessCategory : undefined,
        isOnboarded: true,
        expressApiUrl: 'http://localhost:3000',
        isBackendConnected: true,
      };

      // No success toast: the caller plays a drawn-check beat on the way into the
      // ledger, and a toast on top of it would be saying the same thing twice.
      await onComplete(profile);
    } catch (e: any) {
      toast(e.message || 'Error completing setup.');
    } finally {
      setSaving(false);
    }
  };

  /** Step 2's fields arrive on their own beats once the step has swapped in. */
  const beat = { stagger: MOTION.stagger, duration: MOTION.editorial } as const;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Progress */}
          <View style={styles.header}>
            <View style={styles.badgePill}>
              <Sparkles size={14} color="#4F46E5" />
              <Text style={styles.badgePillText}>Quick 1-Minute Setup</Text>
            </View>

            {/* Only the wording changes between steps, so only it cross-fades. */}
            <CrossFade phase={`h${step}`} distance={14} style={styles.headings}>
              <Text style={styles.headingTitle}>
                {step === 1 ? 'How will you use Veldger?' : 'Personalize Your Experience'}
              </Text>
              <Text style={styles.headingSubtitle}>
                {step === 1
                  ? 'Select your purpose to tailor ledger categories, reminders, and features.'
                  : accountType === 'commercial'
                  ? 'Enter your business details to generate branded WhatsApp receipts.'
                  : 'Enter your name to track personal debts, loans, and daily expenses.'}
              </Text>
            </CrossFade>

            <StepBar step={step} />
          </View>

          <CrossFade phase={`s${step}`}>
            {step === 1 ? (
              /* STEP 1: Account Type Selection */
              <View style={styles.stepOneCards}>
                <Enter index={0} {...beat}>
                  <TypeCard
                    icon={Building2}
                    iconBg="#EEF2FF"
                    iconTint="#4F46E5"
                    title="Commercial & Business"
                    desc="For shopkeepers, dukaandaar, retail stores, wholesalers, agencies, and freelancers."
                    perks={[
                      '• Customer & Supplier Ledger (Udhaar)',
                      '• Daily Cashbook (Rokar In/Out)',
                      '• WhatsApp Balance Reminders',
                    ]}
                    selected={accountType === 'commercial'}
                    onPress={() => setAccountType('commercial')}
                  />
                </Enter>

                <Enter index={1} {...beat}>
                  <TypeCard
                    icon={User}
                    iconBg="#ECFDF5"
                    iconTint="#059669"
                    title="Personal & Daily Use"
                    desc="For individuals, students, roommates, and family finances."
                    perks={[
                      '• Friends & Family loans given / taken',
                      '• Personal daily expense tracking',
                      '• Zero accounting jargon',
                    ]}
                    selected={accountType === 'personal'}
                    onPress={() => setAccountType('personal')}
                  />
                </Enter>

                <Enter index={2} {...beat} style={styles.continueSlot}>
                  <Button
                    label="Continue"
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                    fullWidth
                    onPress={handleNext}
                  />
                </Enter>
              </View>
            ) : (
              /* STEP 2: Detail Form */
              <View style={styles.formContainer}>
                {accountType === 'commercial' ? (
                  <>
                    <Enter index={0} {...beat} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Shop / Business Name <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.inputBox}>
                        <Store size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Al-Madina Superstore"
                          placeholderTextColor={COLORS.textMuted}
                          value={storeName}
                          onChangeText={setStoreName}
                        />
                      </View>
                    </Enter>

                    <Enter index={1} {...beat} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Owner / Manager Name <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.inputBox}>
                        <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Haji Aslam"
                          placeholderTextColor={COLORS.textMuted}
                          value={ownerName}
                          onChangeText={setOwnerName}
                        />
                      </View>
                    </Enter>

                    <Enter index={2} {...beat} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Business Category</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <Press
                            key={cat}
                            onPress={() => setBusinessCategory(cat)}
                            accessibilityLabel={cat}
                            style={[
                              styles.categoryChip,
                              businessCategory === cat && styles.categoryChipSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                businessCategory === cat && styles.categoryChipTextSelected,
                              ]}
                            >
                              {cat}
                            </Text>
                          </Press>
                        ))}
                      </ScrollView>
                    </Enter>
                  </>
                ) : (
                  <Enter index={0} {...beat} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Your Name <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.inputBox}>
                      <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Zain Ali"
                        placeholderTextColor={COLORS.textMuted}
                        value={ownerName}
                        onChangeText={setOwnerName}
                      />
                    </View>
                  </Enter>
                )}

                <Enter index={3} {...beat} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone / WhatsApp Number</Text>
                  <View style={styles.inputBox}>
                    <Phone size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 03001234567"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </Enter>

                <Enter index={4} {...beat} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Currency</Text>
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map((c) => (
                      <Press
                        key={c.value}
                        onPress={() => setCurrency(c.value)}
                        accessibilityLabel={c.label}
                        style={[
                          styles.currencyChip,
                          currency === c.value && styles.currencyChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencyChipText,
                            currency === c.value && styles.currencyChipTextSelected,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </Press>
                    ))}
                  </View>
                </Enter>

                <Enter index={5} {...beat} style={styles.buttonRow}>
                  <Button
                    label="Back"
                    variant="secondary"
                    size="lg"
                    icon={ArrowLeft}
                    disabled={saving}
                    onPress={() => setStep(1)}
                  />
                  <Button
                    label="Complete Setup"
                    variant="primary"
                    size="lg"
                    icon={CheckCircle2}
                    iconPosition="right"
                    loading={saving}
                    onPress={handleFinish}
                    style={styles.finishButton}
                  />
                </Enter>
              </View>
            )}
          </CrossFade>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ------------------------------------------------------------------ step bar -- */

/**
 * Two dots joined by a connector that fills as you advance.
 *
 * The connector uses `scaleX` with a `translateX` correction so it grows from its
 * left edge rather than its centre — animating `width` would be a layout pass per
 * frame and couldn't go on the native driver.
 */
const CONNECTOR = 32;
const DOT = 10;
const SLOT = 24;

const StepBar: React.FC<{ step: 1 | 2 }> = ({ step }) => {
  const progress = useRef(new Animated.Value(step === 2 ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step === 2 ? 1 : 0,
      duration: MOTION.editorial,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, progress]);

  /*
   * Translate-then-scale, in that order, so the translation isn't itself scaled.
   * Half the width at s=0 puts the shrunk line flush against its left edge.
   */
  const fillLine = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-CONNECTOR / 2, 0],
        }),
      },
      {
        scaleX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.0001, 1],
        }),
      },
    ],
  };

  /*
   * The dot grows from its centre instead — 0.42 of the 24px slot is 10px, so it
   * starts exactly the size of the hairline dot underneath and stretches into a
   * pill. Same trick as the intro dots: cross-fade a scaled overlay rather than
   * animate `width` or `backgroundColor`, neither of which is native-driveable.
   */
  const fillDot = {
    opacity: progress,
    transform: [
      {
        scaleX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [DOT / SLOT, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.stepBar}>
      <View style={[styles.stepDot, styles.stepDotActive]} />

      <View style={styles.stepLine}>
        <Animated.View style={[styles.stepLineFill, fillLine]} />
      </View>

      <View style={styles.stepSlot}>
        <View style={styles.stepDot} />
        <Animated.View style={[styles.stepDotFill, fillDot]} />
      </View>
    </View>
  );
};

/* ----------------------------------------------------------------- type card -- */

const TypeCard: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconBg: string;
  iconTint: string;
  title: string;
  desc: string;
  perks: string[];
  selected: boolean;
  onPress: () => void;
}> = ({ icon: Icon, iconBg, iconTint, title, desc, perks, selected, onPress }) => (
  <Press
    onPress={onPress}
    accessibilityLabel={title}
    accessibilityState={{ selected }}
    style={[styles.typeCard, selected && styles.typeCardSelected]}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={26} color={iconTint} />
      </View>
      {selected && <CheckCircle2 size={22} color={iconTint} />}
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
    <View style={styles.perksList}>
      {perks.map((perk) => (
        <Text key={perk} style={styles.perkItem}>
          {perk}
        </Text>
      ))}
    </View>
  </Press>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  badgePillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#4F46E5',
  },
  headings: {
    alignItems: 'center',
  },
  headingTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  headingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  stepDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: COLORS.hairline,
  },
  stepDotActive: {
    backgroundColor: COLORS.ink,
    width: SLOT,
  },
  /** Slot for step 2's dot: a hairline circle with an ink pill layered over it. */
  stepSlot: {
    width: SLOT,
    height: DOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: COLORS.ink,
  },
  stepLine: {
    width: CONNECTOR,
    height: 2,
    backgroundColor: COLORS.hairline,
    overflow: 'hidden',
  },
  stepLineFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.ink,
  },
  stepOneCards: {
    gap: 16,
  },
  continueSlot: {
    marginTop: 8,
  },
  typeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.hairline,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: COLORS.ink,
    backgroundColor: '#FAFAFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  perksList: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    paddingTop: 10,
  },
  perkItem: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputBox: {
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
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  categoryChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 10,
    paddingVertical: 10,
  },
  currencyChipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  currencyChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  currencyChipTextSelected: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  finishButton: {
    flex: 1,
  },
});
