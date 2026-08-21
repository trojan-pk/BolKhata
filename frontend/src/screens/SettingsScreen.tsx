import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Store, Globe, Server } from 'lucide-react-native';
import { StoreProfile } from '../types';
import { COLORS } from '../theme/colors';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface SettingsScreenProps {
  storeProfile: StoreProfile;
  onUpdateStore: (updated: StoreProfile) => void;
  onOpenApiConfig: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  storeProfile,
  onUpdateStore,
  onOpenApiConfig,
}) => {
  const [name, setName] = useState(storeProfile.name);
  const [ownerName, setOwnerName] = useState(storeProfile.ownerName);
  const [mobile, setMobile] = useState(storeProfile.mobile);
  const [currency, setCurrency] = useState(storeProfile.currency);
  const [language, setLanguage] = useState<LanguageCode>(storeProfile.language);

  const t = getTranslation(language);

  const currencies = ['Rs', 'PKR', '₨', '₹', '$', '৳', '€', '£'];
  const languages: { key: LanguageCode; label: string }[] = [
    { key: 'roman_ur', label: 'Roman Urdu (رومن اردو)' },
    { key: 'ur', label: 'اردو (Urdu)' },
    { key: 'en', label: 'English' },
    { key: 'hi', label: 'हिंदी (Hindi)' },
    { key: 'bn', label: 'বাংলা (Bengali)' },
    { key: 'es', label: 'Español' },
  ];

  const handleSave = () => {
    onUpdateStore({
      ...storeProfile,
      name,
      ownerName,
      mobile,
      currency,
      language,
    });
    alert(t.settingsSavedSuccess);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={styles.pageTitle}>{t.shopSettings}</Text>

      {/* Express API Connector Banner */}
      <TouchableOpacity
        style={styles.apiBanner}
        onPress={onOpenApiConfig}
        activeOpacity={0.85}
      >
        <Server size={20} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.apiTitle}>{t.apiConnection}</Text>
          <Text style={styles.apiSub} numberOfLines={1}>
            Status:{' '}
            {storeProfile.isBackendConnected
              ? t.apiConnected
              : t.apiOffline}
          </Text>
        </View>
        <Text style={styles.configureText}>{t.configure}</Text>
      </TouchableOpacity>

      {/* Store Profile Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Store size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{t.storeDetails}</Text>
        </View>

        <Text style={styles.label}>{t.shopName}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bismillah General Store"
        />

        <Text style={styles.label}>{t.ownerName}</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="e.g. Muhammad Salman"
        />

        <Text style={styles.label}>{t.contactNumber}</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholder="e.g. +92 300 1234567"
          keyboardType="phone-pad"
        />
      </View>

      {/* Regional & Language Settings */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Globe size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{t.currencyAndRegional}</Text>
        </View>

        {/* Currency Picker */}
        <Text style={styles.label}>{t.shopCurrency}</Text>
        <View style={styles.chipsRow}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                currency === c && styles.chipActive,
              ]}
              onPress={() => setCurrency(c)}
            >
              <Text
                style={[
                  styles.chipText,
                  currency === c && styles.chipTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Picker */}
        <Text style={[styles.label, { marginTop: 12 }]}>{t.appLanguage}</Text>
        <View style={styles.chipsRow}>
          {languages.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[
                styles.chip,
                language === l.key && styles.chipActive,
              ]}
              onPress={() => setLanguage(l.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  language === l.key && styles.chipTextActive,
                ]}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>{t.saveSettings}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  apiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  apiSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  configureText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
