import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Globe,
  Info,
  Server,
  Store,
  Trash2,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { GUTTER, SPACE, TYPE } from '../theme/tokens';
import { StoreProfile } from '../types';
import { LanguageCode } from '../i18n/translations';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  GroupLabel,
  IconWell,
  Row,
  ScreenHeader,
  TextField,
  useFeedback,
} from '../ui';

const CURRENCIES = ['Rs', 'PKR', '₨', '₹', '$', '৳', '€', '£'];

const VOICE_LANGUAGES: { key: LanguageCode; label: string }[] = [
  { key: 'roman_ur', label: 'Roman Urdu' },
  { key: 'ur', label: 'اردو' },
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिंदी' },
  { key: 'bn', label: 'বাংলা' },
  { key: 'es', label: 'Español' },
];

const APP_VERSION = '1.0.0';

/**
 * Grouped settings. Edits are held locally and committed with an explicit Save
 * that only appears once something has actually changed — no silent writes, no
 * button that does nothing.
 */
export const SettingsScreen: React.FC<{
  storeProfile: StoreProfile;
  onUpdateStore: (updated: StoreProfile) => void;
  onOpenApiConfig: () => void;
  onEraseAll: () => void;
}> = ({ storeProfile, onUpdateStore, onOpenApiConfig, onEraseAll }) => {
  const { toast, confirm } = useFeedback();

  const [name, setName] = useState(storeProfile.name);
  const [ownerName, setOwnerName] = useState(storeProfile.ownerName);
  const [mobile, setMobile] = useState(storeProfile.mobile);
  const [currency, setCurrency] = useState(storeProfile.currency);
  const [language, setLanguage] = useState<LanguageCode>(storeProfile.language);

  // Keep the form in step when the profile changes elsewhere (e.g. after erase).
  useEffect(() => {
    setName(storeProfile.name);
    setOwnerName(storeProfile.ownerName);
    setMobile(storeProfile.mobile);
    setCurrency(storeProfile.currency);
    setLanguage(storeProfile.language);
  }, [storeProfile]);

  const dirty = useMemo(
    () =>
      name !== storeProfile.name ||
      ownerName !== storeProfile.ownerName ||
      mobile !== storeProfile.mobile ||
      currency !== storeProfile.currency ||
      language !== storeProfile.language,
    [name, ownerName, mobile, currency, language, storeProfile]
  );

  const save = () => {
    onUpdateStore({
      ...storeProfile,
      name: name.trim() || 'My Store',
      ownerName: ownerName.trim(),
      mobile: mobile.trim(),
      currency,
      language,
    });
    toast(COPY.settings.savedToast);
  };

  const eraseAll = async () => {
    const ok = await confirm({
      title: COPY.settings.clearConfirmTitle,
      body: COPY.settings.clearConfirmBody,
      confirmLabel: COPY.settings.clearConfirmCta,
      destructive: true,
    });
    if (ok) onEraseAll();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={COPY.settings.title}
        subtitle={COPY.settings.subtitle}
        action={
          dirty ? (
            <Button label={COPY.common.save} variant="primary" size="sm" onPress={save} />
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ----------------------------------------------------------- shop -- */}
        <View>
          <GroupLabel text={COPY.settings.shopSection} />
          <Card padding={SPACE.lg} style={styles.formCard}>
            <TextField
              label={COPY.settings.shopName}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Bismillah General Store"
              icon={Store}
            />
            <TextField
              label={COPY.settings.ownerName}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="e.g. Muhammad Salman"
            />
            <TextField
              label={COPY.settings.phone}
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 0300 1234567"
              keyboardType="phone-pad"
            />
          </Card>
        </View>

        {/* ---------------------------------------------------- preferences -- */}
        <View>
          <GroupLabel text={COPY.settings.prefsSection} />
          <Card padding={SPACE.lg} style={styles.formCard}>
            <View>
              <Text style={[TYPE.label, styles.fieldLabel]}>
                {COPY.settings.currency}
              </Text>
              <View style={styles.chipGrid}>
                {CURRENCIES.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    size="sm"
                    selected={currency === code}
                    onPress={() => setCurrency(code)}
                  />
                ))}
              </View>
            </View>

            <Divider />

            <View>
              <View style={styles.labelRow}>
                <Globe size={15} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={[TYPE.label, styles.fieldLabel]}>
                  {COPY.settings.voiceLanguage}
                </Text>
              </View>
              <Text style={[TYPE.caption, styles.fieldHint]}>
                {COPY.settings.voiceLanguageHint}
              </Text>
              <View style={styles.chipGrid}>
                {VOICE_LANGUAGES.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    size="sm"
                    selected={language === item.key}
                    onPress={() => setLanguage(item.key)}
                  />
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* ----------------------------------------------------------- data -- */}
        <View>
          <GroupLabel text={COPY.settings.dataSection} />
          <Card padding={0}>
            <Row
              variant="plain"
              style={styles.listRow}
              onPress={onOpenApiConfig}
              leading={<IconWell icon={Server} tone="accent" />}
              title={COPY.settings.connection}
              subtitle={
                storeProfile.isBackendConnected
                  ? COPY.settings.connectionOn
                  : COPY.settings.connectionOff
              }
              trailing={
                <Badge
                  label={storeProfile.isBackendConnected ? 'On' : 'Off'}
                  tone={storeProfile.isBackendConnected ? 'credit' : 'neutral'}
                />
              }
              chevron
            />
            <Divider inset={SPACE.lg} />
            <Row
              variant="plain"
              style={styles.listRow}
              onPress={eraseAll}
              leading={<IconWell icon={Trash2} tone="debit" />}
              title={COPY.settings.clearData}
              subtitle={COPY.settings.clearDataHint}
            />
          </Card>
        </View>

        {/* ---------------------------------------------------------- about -- */}
        <View>
          <GroupLabel text={COPY.settings.aboutSection} />
          <Card padding={0}>
            <Row
              variant="plain"
              style={styles.listRow}
              leading={<IconWell icon={Info} tone="neutral" />}
              title={COPY.brand}
              subtitle="Voice-first ledger for shopkeepers"
              trailing={
                <Text style={[TYPE.caption, { color: COLORS.textMuted }]}>
                  {COPY.settings.version} {APP_VERSION}
                </Text>
              }
            />
          </Card>
        </View>

        {dirty ? (
          <Button
            label={COPY.common.save}
            variant="primary"
            size="lg"
            onPress={save}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: 132,
    gap: SPACE.xxl,
  },
  formCard: {
    gap: SPACE.lg,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldHint: {
    color: COLORS.textFaint,
    marginTop: 3,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    marginTop: SPACE.sm,
  },
  listRow: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md + 2,
  },
});
