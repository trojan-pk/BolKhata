import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapPin, Phone, UserPlus } from 'lucide-react-native';
import { COPY } from '../i18n/copy';
import { SPACE } from '../theme/tokens';
import { PartyType } from '../types';
import {
  AmountField,
  Button,
  Segmented,
  Sheet,
  TextField,
} from '../ui';
import { parseAmount } from '../utils/format';

/**
 * Creates a customer or supplier. Only the name is required — asking for a
 * phone number up front is the reason half-finished records get abandoned, and
 * voice-created customers arrive with nothing but a name anyway.
 */
export const AddCustomerModal: React.FC<{
  visible: boolean;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    mobile: string;
    address: string;
    type: PartyType;
    openingBalance: number;
  }) => void;
}> = ({ visible, currency = 'Rs', onClose, onSubmit }) => {
  const [type, setType] = useState<PartyType>('customer');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [opening, setOpening] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setType('customer');
      setName('');
      setMobile('');
      setAddress('');
      setOpening('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    if (!name.trim()) {
      setError(COPY.txn.invalidName);
      return;
    }
    onSubmit({
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      type,
      openingBalance: parseAmount(opening),
    });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={COPY.party.addTitle}
      subtitle={COPY.party.addSubtitle}
      footer={
        <Button
          label={COPY.party.createCta}
          icon={UserPlus}
          variant="primary"
          size="lg"
          onPress={submit}
          fullWidth
        />
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
        autoFocus
        autoCapitalize="words"
      />

      <TextField
        label={COPY.party.phoneLabel}
        optional
        value={mobile}
        onChangeText={setMobile}
        placeholder={COPY.party.phonePlaceholder}
        keyboardType="phone-pad"
        icon={Phone}
      />

      <TextField
        label={COPY.party.addressLabel}
        optional
        value={address}
        onChangeText={setAddress}
        placeholder={COPY.party.addressPlaceholder}
        icon={MapPin}
      />

      <View style={styles.opening}>
        <AmountField
          label={COPY.party.openingLabel}
          value={opening}
          onChangeText={setOpening}
          currency={currency}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  opening: {
    marginBottom: SPACE.xs,
  },
});
