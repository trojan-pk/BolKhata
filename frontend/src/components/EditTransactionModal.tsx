import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { COPY } from '../i18n/copy';
import { SPACE } from '../theme/tokens';
import { Transaction, TransactionType } from '../types';
import {
  AmountField,
  Button,
  Segmented,
  Sheet,
  TextField,
  useFeedback,
} from '../ui';
import { formatRelativeDate, parseAmount } from '../utils/format';

/**
 * Edits or deletes an existing entry. Direction is editable because voice
 * transcription occasionally mistakes "diye" for "liye", and correcting that
 * shouldn't mean deleting and re-recording.
 */
export const EditTransactionModal: React.FC<{
  visible: boolean;
  transaction: Transaction | null;
  currency?: string;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete: (txnId: string) => void;
}> = ({ visible, transaction, currency = 'Rs', onClose, onSave, onDelete }) => {
  const { toast, confirm } = useFeedback();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('gave');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction && visible) {
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setNote(transaction.note || '');
      setError(null);
    }
  }, [transaction, visible]);

  if (!transaction) return null;

  const save = () => {
    const value = parseAmount(amount);
    if (value <= 0) {
      setError(COPY.txn.invalidAmount);
      return;
    }
    onSave({ ...transaction, amount: value, type, note: note.trim() });
    // Close first: a toast raised while the sheet is still on screen would sit
    // behind it on native, where a Modal owns its own window.
    onClose();
    toast(COPY.txn.updatedToast);
  };

  const remove = async () => {
    const ok = await confirm({
      title: COPY.txn.deleteTitle,
      body: COPY.txn.deleteBody,
      confirmLabel: COPY.common.delete,
      destructive: true,
    });
    if (ok) {
      onDelete(transaction.id);
      onClose();
      toast(COPY.txn.deletedToast);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={COPY.txn.editTitle}
      subtitle={`${transaction.partyName} · ${formatRelativeDate(transaction.date)}`}
      footer={
        <View style={styles.actions}>
          <Button
            label={COPY.common.delete}
            icon={Trash2}
            variant="danger"
            onPress={remove}
          />
          <Button
            label={COPY.common.save}
            icon={Check}
            variant="primary"
            onPress={save}
            style={styles.saveButton}
          />
        </View>
      }
    >
      <Segmented
        segments={[
          { value: 'gave', label: COPY.ledger.youGave, tone: 'debit' },
          { value: 'got', label: COPY.ledger.youGot, tone: 'credit' },
        ]}
        value={type}
        onChange={(next) => setType(next as TransactionType)}
      />

      <AmountField
        value={amount}
        onChangeText={(next) => {
          setAmount(next);
          if (error) setError(null);
        }}
        currency={currency}
        tone={type === 'gave' ? 'debit' : 'credit'}
        error={error}
      />

      <TextField
        label={COPY.txn.noteLabel}
        optional
        value={note}
        onChangeText={setNote}
        placeholder={COPY.txn.notePlaceholder}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  saveButton: {
    flex: 1,
  },
});
