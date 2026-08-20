import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Search, UserPlus, Users, Filter } from 'lucide-react-native';
import { CustomerCard } from '../components/CustomerCard';
import { Party } from '../types';
import { COLORS } from '../theme/colors';

interface CustomersScreenProps {
  parties: Party[];
  currency?: string;
  onSelectParty: (party: Party) => void;
  onAddParty: () => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  parties,
  currency = '₹',
  onSelectParty,
  onAddParty,
}) => {
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
          <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name or phone..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddParty} activeOpacity={0.85}>
          <UserPlus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterStrip}>
        {[
          { key: 'all', label: 'All Customers' },
          { key: 'get', label: "You'll Get (Udhaar)" },
          { key: 'give', label: "You'll Give (Jama)" },
          { key: 'settled', label: 'Settled' },
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
      </View>

      {/* List */}
      <ScrollView style={styles.listArea} contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredParties.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={36} color="#475569" />
            <Text style={styles.emptyTitle}>No matching customers found</Text>
            <Text style={styles.emptySub}>
              Tap '+ Add' to register a new customer or supplier
            </Text>
          </View>
        ) : (
          filteredParties.map((party) => (
            <CustomerCard
              key={party.id}
              party={party}
              currency={currency}
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
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  filterStrip: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11,
    color: '#94a3b8',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
