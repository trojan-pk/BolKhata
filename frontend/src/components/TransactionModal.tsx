import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { COPY } from '../i18n/copy';
import { SPACE } from '../theme/tokens';
import { PaymentMode, TransactionType } from '../types';
import {
  AmountField,
  Button,
  Chip,
  Label,
  Sheet,
  TextField,
} from '../ui';
import { parseAmount } from '../utils/format';

const QUICK_ADD = [100, 500, 1000, 2000, 5000];

const METHODS: { key: PaymentMode; label: string }[] = [
  { key: 'cash', label: COPY.txn.methods.cash },
  { key: 'upi', label: COPY.txn.methods.upi },
  { key: 'card', label: COPY.txn.methods.card },
  { key: 'credit', label: COPY.txn.methods.credit },
];

/**
 * Records one ledger entry against a customer. Amount first and oversized —
 * everything else on this sheet is optional, and the layout says so.
 */
export const TransactionModal: React.FC<{
  visible: boolean;
  type: TransactionType;
  partyName: string;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: { amount: number; note: string; paymentMode: PaymentMode }) => void;
}> = ({ visible, type, partyName, currency = 'Rs', onClose, onSubmit }) => {
  const isGave = type === 'gave';

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMode>('cash');
  const [error, setError] = useState<string | null>(null);

  // Fresh sheet every time it opens — a stale amount is a dangerous default.
  useEffect(() => {
    if (visible) {
      setAmount('');
      setNote('');
      setMethod('cash');
      setError(null);
    }
  }, [visible]);

  const bump = (delta: number) => {
    setAmount(String(parseAmount(amount) + delta));
    setError(null);
  };

  const amountValue = parseAmount(amount);
  /**
   * The save button stays inert until there is something to save.
   *
   * It used to be tappable on an empty sheet, so the first thing a new user did
   * was press the big green button and get an error back. Preventing the
   * mistake beats reporting it.
   */
  const canSave = amountValue > 0;

  const submit = () => {
    if (!canSave) {
      setError(COPY.txn.invalidAmount);
      return;
    }
    onSubmit({ amount: amountValue, note: note.trim(), paymentMode: method });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isGave ? COPY.txn.gaveTitle : COPY.txn.gotTitle}
      subtitle={`${partyName} · ${isGave ? COPY.txn.gaveSubtitle : COPY.txn.gotSubtitle}`}
      footer={
        <Button
          label={COPY.txn.saveCta}
          icon={Check}
          variant={isGave ? 'debit' : 'credit'}
          size="lg"
          onPress={submit}
          disabled={!canSave}
          fullWidth
        />
      }
    >
      <AmountField
        value={amount}
        onChangeText={(next) => {
          setAmount(next);
          if (error) setError(null);
        }}
        currency={currency}
        tone={isGave ? 'debit' : 'credit'}
        autoFocus
        error={error}
      />

      <View style={styles.quickRow}>
        {QUICK_ADD.map((value) => (
          <Chip
            key={value}
            label={`+${value >= 1000 ? `${value / 1000}k` : value}`}
            size="sm"
            onPress={() => bump(value)}
          />
        ))}
      </View>

      <View>
        <Label text={COPY.txn.methodLabel} />
        <View style={styles.methodRow}>
          {METHODS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              size="sm"
              selected={method === item.key}
              onPress={() => setMethod(item.key)}
            />
          ))}
        </View>
      </View>

      <TextField
        label={COPY.txn.noteLabel}
        optional
        value={note}
        onChangeText={setNote}
        placeholder={COPY.txn.notePlaceholder}
        // A note is a memory aid, not a paragraph, and it has to stay readable
        // inside a one-line row on the statement.
        maxLength={80}
        counter
        returnKeyType="done"
        onSubmitEditing={submit}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    marginTop: -SPACE.sm,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
});
