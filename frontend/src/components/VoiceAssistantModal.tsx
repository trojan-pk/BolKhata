import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  Edit3,
  Quote,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Party, Transaction, TransactionType } from '../types';
import { LanguageCode } from '../i18n/translations';
import {
  AmountField,
  Badge,
  Button,
  Card,
  Money,
  Segmented,
  Sheet,
  TextField,
} from '../ui';
import { formatDate, parseAmount, todayISO } from '../utils/format';

/** Locale used when the assistant reads an entry back. */
const SPEECH_LOCALE: Record<LanguageCode, string> = {
  ur: 'ur-PK',
  roman_ur: 'ur-PK',
  en: 'en-US',
  hi: 'hi-IN',
  bn: 'bn-BD',
  es: 'es-ES',
};

interface VoiceAssistantModalProps {
  visible: boolean;
  currency?: string;
  language?: LanguageCode;
  parties?: Party[];
  transactions?: Transaction[];
  initialResult?: any;
  onClose: () => void;
  onParseVoice: (result: {
    partyName: string;
    amount: number;
    type: TransactionType;
    note: string;
    date?: string;
  }) => void;
  onUpdateTransaction?: (updatedTxn: Transaction) => void;
  onDeleteTransaction?: (txnId: string) => void;
  onDeleteParty?: (partyId: string) => void;
}

type VoiceActionIntent =
  | 'create_transaction'
  | 'update_transaction'
  | 'delete_transaction'
  | 'delete_customer'
  | 'get_balance';

/**
 * Intelligent Review step for speech ledger actions:
 * Supports Creating, Updating, and Deleting records & customers via voice.
 */
export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  currency = 'Rs',
  language = 'roman_ur',
  parties = [],
  transactions = [],
  initialResult,
  onClose,
  onParseVoice,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteParty,
}) => {
  const [activeIntent, setActiveIntent] = useState<VoiceActionIntent>('create_transaction');
  const [transcript, setTranscript] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('gave');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(todayISO());

  // Special intent targets
  const [balanceOf, setBalanceOf] = useState<{ name: string; balance: number } | null>(null);
  const [targetTxnToUpdate, setTargetTxnToUpdate] = useState<Transaction | null>(null);
  const [targetTxnToDelete, setTargetTxnToDelete] = useState<Transaction | null>(null);
  const [targetPartyToDelete, setTargetPartyToDelete] = useState<Party | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchParty = (needle: string) =>
    parties.find((p) => {
      const a = p.name.toLowerCase().trim();
      const b = needle.toLowerCase().trim();
      return a.includes(b) || b.includes(a);
    });

  /** Speaks text back in English via Web Speech / Expo Speech. */
  const speakText = (text: string) => {
    const locale = 'en-US';
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale;
        utterance.rate = 1.0;
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => v.lang?.startsWith('en'));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
        return;
      }
      Speech.stop();
      Speech.speak(text, { language: locale, rate: 1.0 });
    } catch {
      // Speech is a convenience, non-blocking
    }
  };

  /** Normalizes voice result and resolves the target transaction / party. */
  const absorb = (data: any) => {
    if (!data) return;
    setError(null);
    setMessage(null);
    setTranscript(data.originalText || '');

    const rawIntent: VoiceActionIntent = data.intent || 'create_transaction';
    setActiveIntent(rawIntent);

    const person = (data.person?.name || data.customerName || data.partyName || '').trim();
    const matchedP = person ? matchParty(person) : undefined;

    // 1. BALANCE QUERY INTENT
    if (rawIntent === 'get_balance') {
      if (matchedP) {
        setBalanceOf({ name: matchedP.name, balance: matchedP.currentBalance });
        speakText(`${matchedP.name}'s balance is ${matchedP.currentBalance} rupees.`);
      } else {
        setBalanceOf(null);
        setError(COPY.voice.notFound(person || 'Customer'));
        speakText(`Customer ${person || ''} was not found.`);
      }
      return;
    }

    setBalanceOf(null);

    // 2. DELETE CUSTOMER INTENT
    if (rawIntent === 'delete_customer') {
      if (matchedP) {
        setTargetPartyToDelete(matchedP);
        speakText(`Delete customer ${matchedP.name}? Press confirm to proceed.`);
      } else {
        setError(`"${person}" customer list mein nahi mila.`);
        speakText(`Customer ${person} was not found.`);
      }
      return;
    }

    setTargetPartyToDelete(null);

    // 3. UPDATE TRANSACTION INTENT
    if (rawIntent === 'update_transaction') {
      if (!matchedP) {
        setError(`"${person}" customer list mein nahi mila.`);
        speakText(`Customer ${person} was not found.`);
        return;
      }

      // Find matching transaction for this party
      const partyTxns = transactions
        .filter((t) => t.partyId === matchedP.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (partyTxns.length === 0) {
        setError(`"${matchedP.name}" ki koi entry nahi mili jise update kiya ja sake.`);
        speakText(`No previous entries found for ${matchedP.name} to update.`);
        return;
      }

      let target: Transaction | undefined;
      const targetAmount = Number(data.searchCriteria?.previousAmount);

      if (targetAmount > 0) {
        target = partyTxns.find((t) => Math.abs(t.amount - targetAmount) < 1);
      }
      if (!target) {
        target = partyTxns[0]; // Default to most recent entry
      }

      setTargetTxnToUpdate(target);

      const newAmount = Number(data.changes?.amount) || Number(data.transaction?.amount) || target.amount;
      const newType: TransactionType =
        data.changes?.direction || data.transaction?.direction || target.type;
      const newReason =
        data.changes?.reason !== undefined
          ? data.changes.reason
          : data.transaction?.reason || target.note || '';

      setName(matchedP.name);
      setAmount(String(newAmount));
      setType(newType);
      setReason(newReason);
      setDate(target.date || todayISO());

      speakText(
        `Update ${matchedP.name}'s entry from ${target.amount} to ${newAmount} rupees? Press save to confirm.`
      );
      return;
    }

    setTargetTxnToUpdate(null);

    // 4. DELETE TRANSACTION INTENT
    if (rawIntent === 'delete_transaction') {
      if (!matchedP) {
        setError(`"${person}" customer list mein nahi mila.`);
        speakText(`Customer ${person} was not found.`);
        return;
      }

      const partyTxns = transactions
        .filter((t) => t.partyId === matchedP.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (partyTxns.length === 0) {
        setError(`"${matchedP.name}" ki koi entry nahi mili.`);
        speakText(`No entries found for ${matchedP.name}.`);
        return;
      }

      let target: Transaction | undefined;
      const targetAmount = Number(data.searchCriteria?.previousAmount);

      if (targetAmount > 0) {
        target = partyTxns.find((t) => Math.abs(t.amount - targetAmount) < 1);
      }
      if (!target) {
        target = partyTxns[0]; // Default to most recent entry
      }

      setTargetTxnToDelete(target);
      setName(matchedP.name);
      speakText(`Delete ${matchedP.name}'s ${target.amount} rupees entry? Press confirm to delete.`);
      return;
    }

    setTargetTxnToDelete(null);

    // 5. CREATE NEW TRANSACTION (Default Intent)
    const value = Number(data.transaction?.amount ?? data.amount) || 0;
    const direction: TransactionType =
      data.transaction?.direction === 'got' ||
      data.type === 'got' ||
      data.direction === 'got'
        ? 'got'
        : 'gave';
    const why = data.transaction?.reason || data.description || data.note || '';

    setName(person);
    setAmount(value > 0 ? String(value) : '');
    setType(direction);
    setReason(why || '');
    setDate(data.transaction?.date || data.date || todayISO());

    if (person && !matchParty(person)) {
      setMessage(COPY.voice.newCustomerNote);
    }

    if (value > 0 && person) {
      speakText(
        `${direction === 'gave' ? 'Gave' : 'Received'} ${value} rupees ${
          direction === 'gave' ? 'to' : 'from'
        } ${person}${why ? ` for ${why}` : ''}. Press save to record.`
      );
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (initialResult) {
      absorb(initialResult);
      return;
    }
    setActiveIntent('create_transaction');
    setTranscript('');
    setName('');
    setAmount('');
    setReason('');
    setType('gave');
    setDate(todayISO());
    setBalanceOf(null);
    setTargetTxnToUpdate(null);
    setTargetTxnToDelete(null);
    setTargetPartyToDelete(null);
    setMessage(null);
    setError(null);
  }, [visible, initialResult]);

  // --- Confirm Handlers for Each Voice Action ---
  const handleConfirm = () => {
    // A. Update Existing Transaction
    if (activeIntent === 'update_transaction' && targetTxnToUpdate) {
      const parsedVal = parseAmount(amount);
      if (parsedVal <= 0) {
        setError('Valid amount is required.');
        return;
      }
      if (onUpdateTransaction) {
        onUpdateTransaction({
          ...targetTxnToUpdate,
          amount: parsedVal,
          type,
          note: reason.trim(),
          date,
        });
      }
      onClose();
      return;
    }

    // B. Delete Existing Transaction
    if (activeIntent === 'delete_transaction' && targetTxnToDelete) {
      if (onDeleteTransaction) {
        onDeleteTransaction(targetTxnToDelete.id);
      }
      onClose();
      return;
    }

    // C. Delete Customer
    if (activeIntent === 'delete_customer' && targetPartyToDelete) {
      if (onDeleteParty) {
        onDeleteParty(targetPartyToDelete.id);
      }
      onClose();
      return;
    }

    // D. Create New Transaction
    const value = parseAmount(amount);
    if (!name.trim()) {
      setError(COPY.txn.invalidName);
      return;
    }
    if (value <= 0) {
      setError(COPY.txn.invalidAmount);
      return;
    }
    onParseVoice({
      partyName: name.trim(),
      amount: value,
      type,
      note: reason.trim(),
      date,
    });
    onClose();
  };

  const isBalanceQuery = !!balanceOf;
  const isDeleteTxnQuery = activeIntent === 'delete_transaction' && !!targetTxnToDelete;
  const isDeletePartyQuery = activeIntent === 'delete_customer' && !!targetPartyToDelete;
  const isUpdateTxnQuery = activeIntent === 'update_transaction' && !!targetTxnToUpdate;

  // Sheet Title
  const getSheetTitle = () => {
    if (isBalanceQuery) return COPY.voice.balanceTitle;
    if (isUpdateTxnQuery) return 'Update Record';
    if (isDeleteTxnQuery) return 'Delete Record';
    if (isDeletePartyQuery) return 'Delete Customer';
    return COPY.voice.title;
  };

  // Sheet Subtitle
  const getSheetSubtitle = () => {
    if (isBalanceQuery) return undefined;
    if (isUpdateTxnQuery) return 'Review and confirm changes to this ledger entry';
    if (isDeleteTxnQuery) return 'Confirm removing this record from the ledger';
    if (isDeletePartyQuery) return 'Confirm deleting this customer account';
    return COPY.voice.reviewHint;
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={getSheetTitle()}
      subtitle={getSheetSubtitle()}
      footer={
        isBalanceQuery ? (
          <Button
            label={COPY.common.done}
            variant="primary"
            size="lg"
            onPress={onClose}
            fullWidth
          />
        ) : isDeleteTxnQuery || isDeletePartyQuery ? (
          <View style={styles.actionRow}>
            <Button
              label={COPY.common.cancel}
              variant="secondary"
              size="lg"
              onPress={onClose}
              style={styles.actionBtn}
            />
            <Button
              label={isDeletePartyQuery ? 'Delete Customer' : 'Confirm Delete'}
              icon={Trash2}
              variant="debit"
              size="lg"
              onPress={handleConfirm}
              style={styles.actionBtn}
            />
          </View>
        ) : isUpdateTxnQuery ? (
          <View style={styles.actionRow}>
            <Button
              label={COPY.common.cancel}
              variant="secondary"
              size="lg"
              onPress={onClose}
              style={styles.actionBtn}
            />
            <Button
              label="Save Changes"
              icon={Check}
              variant="primary"
              size="lg"
              onPress={handleConfirm}
              style={styles.actionBtn}
            />
          </View>
        ) : (
          <Button
            label={COPY.voice.saveCta}
            icon={Check}
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            fullWidth
          />
        )
      }
    >
      {transcript ? (
        <View style={styles.transcript}>
          <Quote size={13} color={COLORS.textFaint} strokeWidth={2.2} />
          <Text style={[TYPE.bodySm, styles.transcriptText]} numberOfLines={3}>
            {transcript}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.error}>
          <Text style={[TYPE.label, styles.errorText]}>{error}</Text>
        </View>
      ) : null}

      {/* 1. BALANCE QUERY VIEW */}
      {isBalanceQuery && balanceOf ? (
        <Card
          tone={balanceOf.balance > 0 ? 'credit' : balanceOf.balance < 0 ? 'debit' : 'muted'}
          padding={SPACE.xl}
          style={styles.balanceCard}
        >
          <Text style={[TYPE.title3, styles.balanceName]}>{balanceOf.name}</Text>
          <Money
            value={balanceOf.balance}
            currency={currency}
            size="title1"
            tone={balanceOf.balance > 0 ? 'credit' : balanceOf.balance < 0 ? 'debit' : 'muted'}
          />
          <Text style={[TYPE.caption, styles.balanceCaption]}>
            {balanceOf.balance > 0
              ? COPY.ledger.toCollect
              : balanceOf.balance < 0
              ? COPY.ledger.toPay
              : COPY.ledger.allSquare}
          </Text>
        </Card>
      ) : null}

      {/* 2. DELETE TRANSACTION PREVIEW VIEW */}
      {isDeleteTxnQuery && targetTxnToDelete ? (
        <Card tone="debit" padding={SPACE.lg} style={styles.deleteCard}>
          <View style={styles.deleteHeader}>
            <AlertTriangle size={18} color={COLORS.debit} />
            <Text style={[TYPE.title3, { color: COLORS.debit }]}>Entry to Delete</Text>
          </View>
          <View style={styles.deleteDetails}>
            <Text style={[TYPE.title2, styles.deleteAmount]}>
              {currency} {targetTxnToDelete.amount.toLocaleString()}
            </Text>
            <Badge
              label={targetTxnToDelete.type === 'gave' ? 'You Gave' : 'You Got'}
              tone={targetTxnToDelete.type === 'gave' ? 'debit' : 'credit'}
            />
          </View>
          <Text style={[TYPE.bodySm, styles.deleteCustomer]}>
            Customer: <Text style={{ fontWeight: '700' }}>{name}</Text>
          </Text>
          {targetTxnToDelete.note ? (
            <Text style={[TYPE.caption, styles.deleteNote]}>
              Note: {targetTxnToDelete.note}
            </Text>
          ) : null}
          <Text style={[TYPE.caption, styles.deleteDate]}>
            Date: {formatDate(targetTxnToDelete.date)}
          </Text>
        </Card>
      ) : null}

      {/* 3. DELETE CUSTOMER PREVIEW VIEW */}
      {isDeletePartyQuery && targetPartyToDelete ? (
        <Card tone="debit" padding={SPACE.lg} style={styles.deleteCard}>
          <View style={styles.deleteHeader}>
            <AlertTriangle size={18} color={COLORS.debit} />
            <Text style={[TYPE.title3, { color: COLORS.debit }]}>Customer to Remove</Text>
          </View>
          <Text style={[TYPE.title2, { color: COLORS.ink, marginTop: 4 }]}>
            {targetPartyToDelete.name}
          </Text>
          <Text style={[TYPE.bodySm, { color: COLORS.textSecondary, marginTop: 6 }]}>
            All ledger entries and balance records for this customer will be permanently deleted.
          </Text>
        </Card>
      ) : null}

      {/* 4. UPDATE TRANSACTION DIFF & EDIT VIEW */}
      {isUpdateTxnQuery && targetTxnToUpdate ? (
        <View style={styles.diffSection}>
          <Card tone="muted" padding={SPACE.md} style={styles.diffCard}>
            <Text style={[TYPE.overline, styles.diffHeading]}>Previous Record</Text>
            <View style={styles.diffRow}>
              <Text style={[TYPE.body, styles.diffOldAmount]}>
                {currency} {targetTxnToUpdate.amount.toLocaleString()}
              </Text>
              <Badge
                label={targetTxnToUpdate.type === 'gave' ? 'Gave' : 'Got'}
                tone={targetTxnToUpdate.type === 'gave' ? 'debit' : 'credit'}
              />
              <ArrowRight size={14} color={COLORS.textMuted} />
              <Text style={[TYPE.title3, { color: type === 'gave' ? COLORS.debit : COLORS.credit }]}>
                {currency} {parseAmount(amount) > 0 ? Number(amount).toLocaleString() : '0'}
              </Text>
              <Badge
                label={type === 'gave' ? 'Gave' : 'Got'}
                tone={type === 'gave' ? 'debit' : 'credit'}
              />
            </View>
          </Card>
        </View>
      ) : null}

      {/* EDITABLE FORM (For Create and Update modes) */}
      {!isBalanceQuery && !isDeleteTxnQuery && !isDeletePartyQuery && (
        <>
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
          />

          <TextField
            label={COPY.voice.nameLabel}
            value={name}
            onChangeText={(next) => {
              setName(next);
              if (error) setError(null);
            }}
            placeholder={COPY.voice.namePlaceholder}
            icon={User}
            autoCapitalize="words"
          />

          {message ? <Badge label={message} tone="accent" /> : null}

          <TextField
            label={COPY.voice.reasonLabel}
            optional
            value={reason}
            onChangeText={setReason}
            placeholder={COPY.voice.reasonPlaceholder}
            icon={Tag}
          />

          <View style={styles.dateRow}>
            <Calendar size={13} color={COLORS.textFaint} strokeWidth={2.2} />
            <Text style={[TYPE.caption, styles.dateText]}>{formatDate(date)}</Text>
          </View>
        </>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  transcript: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  transcriptText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  error: {
    backgroundColor: COLORS.debitSoft,
    borderWidth: 1,
    borderColor: COLORS.debitBorder,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  errorText: {
    color: COLORS.debitStrong,
    textAlign: 'center',
  },
  balanceCard: {
    alignItems: 'center',
    gap: SPACE.xs,
  },
  balanceName: {
    color: COLORS.textPrimary,
  },
  balanceCaption: {
    color: COLORS.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  dateText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACE.md,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
  deleteCard: {
    gap: SPACE.xs,
  },
  deleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginBottom: SPACE.xs,
  },
  deleteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  deleteAmount: {
    color: COLORS.debit,
    fontWeight: '800',
  },
  deleteCustomer: {
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  deleteNote: {
    color: COLORS.textSecondary,
  },
  deleteDate: {
    color: COLORS.textMuted,
  },
  diffSection: {
    marginBottom: SPACE.xs,
  },
  diffCard: {
    gap: SPACE.xs,
  },
  diffHeading: {
    color: COLORS.textMuted,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flexWrap: 'wrap',
  },
  diffOldAmount: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
});
