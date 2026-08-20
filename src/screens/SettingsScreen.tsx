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
  const [language, setLanguage] = useState(storeProfile.language);

  const currencies = ['₹', '$', '৳', '€', '£'];
  const languages: { key: 'en' | 'hi' | 'bn' | 'es'; label: string }[] = [
    { key: 'hi', label: 'हिंदी (Hindi)' },
    { key: 'bn', label: 'বাংলা (Bengali)' },
    { key: 'en', label: 'English' },
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
    alert('Store profile & settings updated successfully!');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={styles.pageTitle}>Shop Settings</Text>

      {/* Express API Connector Banner */}
      <TouchableOpacity
        style={styles.apiBanner}
        onPress={onOpenApiConfig}
        activeOpacity={0.85}
      >
        <Server size={20} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.apiTitle}>Node.js Express API Connection</Text>
          <Text style={styles.apiSub} numberOfLines={1}>
            Status:{' '}
            {storeProfile.isBackendConnected
              ? 'Connected to Express'
              : 'Offline Mobile UI Mode'}
          </Text>
        </View>
        <Text style={styles.configureText}>Configure</Text>
      </TouchableOpacity>

      {/* Store Profile Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Store size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Store Details</Text>
        </View>

        <Text style={styles.label}>Shop / Business Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={[styles.label, { marginTop: 10 }]}>Owner Name</Text>
        <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />

        <Text style={[styles.label, { marginTop: 10 }]}>Contact Number</Text>
        <TextInput style={styles.input} value={mobile} onChangeText={setMobile} />
      </View>

      {/* Currency & Localization */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Globe size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Currency & Regional Settings</Text>
        </View>

        <Text style={styles.label}>Shop Currency</Text>
        <View style={styles.currencyRow}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.currPill, currency === c && styles.currPillActive]}
              onPress={() => setCurrency(c)}
            >
              <Text
                style={[
                  styles.currText,
                  currency === c && styles.currTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>App Language</Text>
        <View style={styles.langGrid}>
          {languages.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[
                styles.langCard,
                language === l.key && styles.langCardActive,
              ]}
              onPress={() => setLanguage(l.key)}
            >
              <Text
                style={[
                  styles.langText,
                  language === l.key && styles.langTextActive,
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
        <Text style={styles.saveBtnText}>Save Settings</Text>
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
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: '#0f172a',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currPill: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '700',
  },
  currTextActive: {
    color: '#ffffff',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  langCard: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  langText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  langTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
