import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, UserPlus, Phone, MapPin, UserCheck } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { PartyType } from '../types';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    mobile: string;
    address: string;
    type: PartyType;
    openingBalance: number;
  }) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<PartyType>('customer');
  const [openingBalance, setOpeningBalance] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter customer/supplier name');
      return;
    }
    if (!mobile.trim()) {
      alert('Please enter contact mobile number');
      return;
    }

    onSubmit({
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      type,
      openingBalance: parseFloat(openingBalance) || 0,
    });

    setName('');
    setMobile('');
    setAddress('');
    setOpeningBalance('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <UserPlus size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Add New Grahak / Party</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {/* Party Type Selector */}
            <Text style={styles.fieldLabel}>Party Role</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[styles.roleCard, type === 'customer' && styles.roleSelected]}
                onPress={() => setType('customer')}
              >
                <UserCheck size={18} color={type === 'customer' ? COLORS.primary : '#94a3b8'} />
                <Text style={[styles.roleText, type === 'customer' && styles.roleTextSelected]}>
                  Grahak (Customer)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, type === 'supplier' && styles.roleSelected]}
                onPress={() => setType('supplier')}
              >
                <UserCheck size={18} color={type === 'supplier' ? COLORS.primary : '#94a3b8'} />
                <Text style={[styles.roleText, type === 'supplier' && styles.roleTextSelected]}>
                  Supplier (Wholesaler)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            {/* Mobile Input */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Mobile Phone Number *</Text>
            <View style={styles.inputRow}>
              <Phone size={16} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="e.g. 9812345678"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </View>

            {/* Address */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Shop / Home Address (Optional)</Text>
            <View style={styles.inputRow}>
              <MapPin size={16} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="e.g. Shop #12, Main Market"
                placeholderTextColor="#64748b"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Opening Balance */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Opening Balance (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0 (Positive = You will collect)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Party to Khata</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  roleText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#334155',
  },
  flexInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
