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
import { getTranslation, LanguageCode } from '../i18n/translations';

interface AddCustomerModalProps {
  visible: boolean;
  language?: LanguageCode;
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
  language = 'ur',
  onClose,
  onSubmit,
}) => {
  const t = getTranslation(language);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<PartyType>('customer');
  const [openingBalance, setOpeningBalance] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter name');
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
              <UserPlus size={20} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{t.addNewParty}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {/* Party Type Selector */}
            <Text style={styles.fieldLabel}>{t.partyType}</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[styles.roleCard, type === 'customer' && styles.roleSelected]}
                onPress={() => setType('customer')}
              >
                <UserCheck
                  size={16}
                  color={type === 'customer' ? COLORS.primary : '#64748b'}
                />
                <Text
                  style={[
                    styles.roleText,
                    type === 'customer' && styles.roleTextSelected,
                  ]}
                >
                  {t.customer}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, type === 'supplier' && styles.roleSelected]}
                onPress={() => setType('supplier')}
              >
                <UserCheck
                  size={16}
                  color={type === 'supplier' ? COLORS.primary : '#64748b'}
                />
                <Text
                  style={[
                    styles.roleText,
                    type === 'supplier' && styles.roleTextSelected,
                  ]}
                >
                  {t.supplier}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t.ownerName} / {t.customer} *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Kumar, Ali Raza"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            {/* Mobile Input */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              {t.contactNumber} *
            </Text>
            <View style={styles.inputRow}>
              <Phone size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="e.g. 03001234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </View>

            {/* Address */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              {t.addressOptional}
            </Text>
            <View style={styles.inputRow}>
              <MapPin size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="e.g. Shop #12, Main Bazar"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Opening Balance */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              {t.openingBalance}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{t.addNewParty}</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: '#0f172a',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flexInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    height: '100%',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
