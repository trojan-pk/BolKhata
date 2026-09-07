import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, MapPin, Phone, Trash2, User } from 'lucide-react-native';
import { COPY } from '../i18n/copy';
import { SPACE } from '../theme/tokens';
import { Party, PartyType } from '../types';
import {
  Button,
  Segmented,
  Sheet,
  TextField,
  useFeedback,
} from '../ui';

interface EditCustomerModalProps {
  visible: boolean;
  party: Party | null;
  onClose: () => void;
  onSave: (updated: Party) => void;
  onDelete?: (partyId: string) => void;
}

/**
 * Edit existing customer or supplier: Name, Phone number, Address, and Account type.
 */
export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  party,
  onClose,
  onSave,
  onDelete,
}) => {
  const { confirm, toast } = useFeedback();

  const [type, setType] = useState<PartyType>('customer');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (party && visible) {
      setType(party.type || 'customer');
      setName(party.name || '');
      setMobile(party.mobile || '');
      setAddress(party.address || '');
      setError(null);
    }
  }, [party, visible]);

  if (!party) return null;

  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError(COPY.txn.invalidName);
      return;
    }

    onSave({
      ...party,
      name: cleanName,
      mobile: mobile.trim(),
      address: address.trim(),
      type,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: COPY.party.deleteTitle,
      body: COPY.party.deleteBody(party.name),
      confirmLabel: COPY.common.delete,
      destructive: true,
    });
    if (ok) {
      onDelete(party.id);
      onClose();
      toast(COPY.party.deletedToast(party.name));
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Edit Customer"
      subtitle={party.name}
      footer={
        onDelete ? (
          <View style={styles.actions}>
            <Button
              label={COPY.common.delete}
              icon={Trash2}
              variant="danger"
              onPress={handleDelete}
            />
            <Button
              label="Save Changes"
              icon={Check}
              variant="primary"
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        ) : (
          <Button
            label="Save Changes"
            icon={Check}
            variant="primary"
            size="lg"
            onPress={handleSave}
            fullWidth
          />
        )
      }
    >
      <Segmented
        segments={[
          { value: 'customer', label: COPY.party.typeCustomer },
          { value: 'supplier', label: COPY.party.typeSupplier },
        ]}
        value={type}
        onChange={(next) => setType(next as PartyType)}
      />

      <TextField
        label={COPY.party.nameLabel}
        value={name}
        onChangeText={(next) => {
          setName(next);
          if (error) setError(null);
        }}
        placeholder={COPY.party.namePlaceholder}
        error={error}
        icon={User}
        autoCapitalize="words"
        autoFocus
      />

      <TextField
        label={COPY.party.phoneLabel}
        optional
        value={mobile}
        onChangeText={setMobile}
        placeholder={COPY.party.phonePlaceholder}
        icon={Phone}
        keyboardType="phone-pad"
      />

      <TextField
        label={COPY.party.addressLabel}
        optional
        value={address}
        onChangeText={setAddress}
        placeholder={COPY.party.addressPlaceholder}
        icon={MapPin}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    width: '100%',
  },
  saveBtn: {
    flex: 1,
  },
});
