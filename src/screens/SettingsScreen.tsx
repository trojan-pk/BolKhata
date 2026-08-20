import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Store, Globe, DollarSign, Server, Smartphone, ShieldCheck } from 'lucide-react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.pageTitle}>Shop Settings</Text>

      {/* Express API Connector Banner */}
      <TouchableOpacity
        style={styles.apiBanner}
        onPress={onOpenApiConfig}
        activeOpacity={0.85}
      >
        <Server size={22} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.apiTitle}>Node.js Express API Connection</Text>
          <Text style={styles.apiSub}>
            Status: {storeProfile.isBackendConnected ? 'Connected to Express API' : 'Offline Mobile UI Mode'}
          </Text>
        </View>
        <Text style={styles.configureText}>Configure</Text>
      </TouchableOpacity>

      {/* Store Profile Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Store size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Store Details</Text>
        </View>

        <Text style={styles.label}>Shop / Business Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={[styles.label, { marginTop: 12 }]}>Owner Name</Text>
        <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />

        <Text style={[styles.label, { marginTop: 12 }]}>Contact Number</Text>
        <TextInput style={styles.input} value={mobile} onChangeText={setMobile} />
      </View>

      {/* Currency & Localization */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Globe size={18} color={COLORS.primary} />
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
              <Text style={[styles.currText, currency === c && styles.currTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>App Language</Text>
        <View style={styles.langGrid}>
          {languages.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[styles.langCard, language === l.key && styles.langCardActive]}
              onPress={() => setLanguage(l.key)}
            >
              <Text style={[styles.langText, language === l.key && styles.langTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
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
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  apiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  apiSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  configureText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  currPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  currTextActive: {
    color: '#ffffff',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langCard: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  langText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  langTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
