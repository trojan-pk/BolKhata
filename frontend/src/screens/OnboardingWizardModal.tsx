import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Building2,
  User,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Store,
  Phone,
  Coins,
  Tag,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { StoreProfile } from '../types';
import { useFeedback } from '../ui';

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

      await onComplete(profile);
      toast('Welcome to BolKhata! Setup complete.');
    } catch (e: any) {
      toast(e.message || 'Error completing setup.');
    } finally {
      setSaving(false);
    }
  };

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

            <Text style={styles.headingTitle}>
              {step === 1 ? 'How will you use BolKhata?' : 'Personalize Your Experience'}
            </Text>
            <Text style={styles.headingSubtitle}>
              {step === 1
                ? 'Select your purpose to tailor ledger categories, reminders, and features.'
                : accountType === 'commercial'
                ? 'Enter your business details to generate branded WhatsApp receipts.'
                : 'Enter your name to track personal debts, loans, and daily expenses.'}
            </Text>

            {/* Step Indicators */}
            <View style={styles.stepBar}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
            </View>
          </View>

          {/* STEP 1: Account Type Selection */}
          {step === 1 && (
            <View style={styles.stepOneCards}>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  accountType === 'commercial' && styles.typeCardSelected,
                ]}
                onPress={() => setAccountType('commercial')}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Building2 size={26} color="#4F46E5" />
                  </View>
                  {accountType === 'commercial' && (
                    <CheckCircle2 size={22} color="#4F46E5" />
                  )}
                </View>
                <Text style={styles.cardTitle}>Commercial & Business</Text>
                <Text style={styles.cardDesc}>
                  For shopkeepers, dukaandaar, retail stores, wholesalers, agencies, and freelancers.
                </Text>
                <View style={styles.perksList}>
                  <Text style={styles.perkItem}>• Customer & Supplier Ledger (Udhaar)</Text>
                  <Text style={styles.perkItem}>• Daily Cashbook (Rokar In/Out)</Text>
                  <Text style={styles.perkItem}>• WhatsApp Balance Reminders</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  accountType === 'personal' && styles.typeCardSelected,
                ]}
                onPress={() => setAccountType('personal')}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                    <User size={26} color="#059669" />
                  </View>
                  {accountType === 'personal' && (
                    <CheckCircle2 size={22} color="#059669" />
                  )}
                </View>
                <Text style={styles.cardTitle}>Personal & Daily Use</Text>
                <Text style={styles.cardDesc}>
                  For individuals, students, roommates, and family finances.
                </Text>
                <View style={styles.perksList}>
                  <Text style={styles.perkItem}>• Friends & Family loans given / taken</Text>
                  <Text style={styles.perkItem}>• Personal daily expense tracking</Text>
                  <Text style={styles.perkItem}>• Zero accounting jargon</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.88}>
                <Text style={styles.primaryButtonText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Detail Form */}
          {step === 2 && (
            <View style={styles.formContainer}>
              {accountType === 'commercial' ? (
                <>
                  <View style={styles.inputGroup}>
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
                  </View>

                  <View style={styles.inputGroup}>
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
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Business Category</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryScroll}
                    >
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            businessCategory === cat && styles.categoryChipSelected,
                          ]}
                          onPress={() => setBusinessCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              businessCategory === cat && styles.categoryChipTextSelected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View style={styles.inputGroup}>
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
                </View>
              )}

              <View style={styles.inputGroup}>
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Currency</Text>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[
                        styles.currencyChip,
                        currency === c.value && styles.currencyChipSelected,
                      ]}
                      onPress={() => setCurrency(c.value)}
                    >
                      <Text
                        style={[
                          styles.currencyChipText,
                          currency === c.value && styles.currencyChipTextSelected,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(1)}
                  disabled={saving}
                >
                  <ArrowLeft size={18} color={COLORS.ink} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.finishButton, saving && styles.buttonDisabled]}
                  onPress={handleFinish}
                  disabled={saving}
                  activeOpacity={0.88}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Complete Setup</Text>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.hairline,
  },
  stepDotActive: {
    backgroundColor: COLORS.ink,
    width: 24,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.hairline,
  },
  stepLineActive: {
    backgroundColor: COLORS.ink,
  },
  stepOneCards: {
    gap: 16,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
  },
  backButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.ink,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
