import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Search, UserPlus, Users } from 'lucide-react-native';
import { CustomerCard } from '../components/CustomerCard';
import { Party } from '../types';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { getTranslation, LanguageCode } from '../i18n/translations';

interface CustomersScreenProps {
  parties: Party[];
  currency?: string;
  language?: LanguageCode;
  onSelectParty: (party: Party) => void;
  onAddParty: () => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  parties,
  currency = 'Rs',
  language = 'ur',
  onSelectParty,
  onAddParty,
}) => {
  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'get' | 'give' | 'settled'>('all');

  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      party.mobile.includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeFilter === 'get') return party.currentBalance > 0;
    if (activeFilter === 'give') return party.currentBalance < 0;
    if (activeFilter === 'settled') return party.currentBalance === 0;

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar & Add Button */}
      <View style={styles.topControlBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddParty} activeOpacity={0.85}>
          <UserPlus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>+ {t.customer}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
        >
          {[
            { key: 'all', label: t.all },
            { key: 'get', label: t.toReceive },
            { key: 'give', label: t.toPay },
            { key: 'settled', label: t.settledZero },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterPill,
                activeFilter === item.key && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(item.key as any)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === item.key && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filteredParties.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>{t.noPartiesYet}</Text>
            <Text style={styles.emptySub}>
              {t.addCustomerSub}
            </Text>
          </View>
        ) : (
          filteredParties.map((party) => (
            <CustomerCard
              key={party.id}
              party={party}
              currency={currency}
              language={language}
              onPress={() => onSelectParty(party)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    width: '100%',
  },
  searchBox: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    fontFamily: FONTS.bodyRegular,
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
  },
  addBtnText: {
    fontFamily: FONTS.headingBold,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listArea: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySub: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});
