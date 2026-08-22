import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Calendar, Check, Quote, Tag, User } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Party, TransactionType } from '../types';
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
  initialResult?: any;
  onClose: () => void;
  onParseVoice: (result: {
    partyName: string;
    amount: number;
    type: TransactionType;
    note: string;
    date?: string;
  }) => void;
}

/**
 * Review step between speech and the ledger.
 *
 * Nothing is written until it is confirmed here — a mis-heard amount is far
 * cheaper to fix before it lands in someone's account than after. The parsed
 * fields arrive pre-filled and every one of them stays editable.
 */
export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  currency = 'Rs',
  language = 'roman_ur',
  parties = [],
  initialResult,
  onClose,
  onParseVoice,
}) => {
  const [transcript, setTranscript] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('gave');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(todayISO());
  const [balanceOf, setBalanceOf] = useState<{ name: string; balance: number } | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchParty = (needle: string) =>
    parties.find((p) => {
      const a = p.name.toLowerCase();
      const b = needle.toLowerCase();
      return a.includes(b) || b.includes(a);
    });

  /** Reads the parsed entry back so it can be checked without looking down. */
  const speak = (person: string, value: number, direction: TransactionType, why?: string) => {
    const locale = SPEECH_LOCALE[language] || 'en-US';
    const urdu = language === 'ur' || language === 'roman_ur';

    const text = urdu
      ? `${person} کے ${value} روپے ${
          direction === 'gave' ? 'ادھار دیے گئے ہیں' : 'وصول ہوئے ہیں'
        }${why ? `، ${why} کے لیے` : ''}۔`
      : `${direction === 'gave' ? 'Gave' : 'Received'} ${value} rupees ${
          direction === 'gave' ? 'to' : 'from'
        } ${person}${why ? ` for ${why}` : ''}.`;

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale;
        utterance.rate = 1.05;
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => v.lang?.startsWith(locale.split('-')[0]));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
        return;
      }
      Speech.stop();
      Speech.speak(text, { language: locale, rate: 1.0 });
    } catch {
      // Speech is a convenience, never a requirement.
    }
  };

  /**
   * The parser has grown a few response shapes over time (nested `transaction`,
   * flat fields, older `customerName`). Normalise them all here so the rest of
   * the sheet only deals with one.
   */
  const absorb = (data: any) => {
    if (!data) return;
    setError(null);
    setMessage(null);
    setTranscript(data.originalText || '');

    if (data.intent === 'get_balance') {
      const asked = data.person?.name || data.customerName || data.partyName || '';
      const matched = matchParty(asked);
      if (matched) {
        setBalanceOf({ name: matched.name, balance: matched.currentBalance });
      } else {
        setBalanceOf(null);
        setError(COPY.voice.notFound(asked));
      }
      return;
    }

    setBalanceOf(null);

    const person =
      data.person?.name || data.customerName || data.partyName || '';
    const value = data.transaction?.amount ?? data.amount ?? 0;
    const direction: TransactionType =
      data.transaction?.direction === 'got' ||
      data.type === 'got' ||
      data.direction === 'got'
        ? 'got'
        : 'gave';
    const why =
      data.transaction?.reason || data.description || data.note || '';

    setName(person);
    setAmount(value > 0 ? String(value) : '');
    setType(direction);
    setReason(why || '');
    setDate(data.transaction?.date || data.date || todayISO());

    if (person && !matchParty(person)) {
      setMessage(COPY.voice.newCustomerNote);
    }

    if (value > 0 && person) speak(person, value, direction, why);
  };

  useEffect(() => {
    if (!visible) return;
    if (initialResult) {
      absorb(initialResult);
      return;
    }
    setTranscript('');
    setName('');
    setAmount('');
    setReason('');
    setType('gave');
    setDate(todayISO());
    setBalanceOf(null);
    setMessage(null);
    setError(null);
    // `initialResult` identity changes per parse, which is exactly the trigger.
  }, [visible, initialResult]);

  const save = () => {
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

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isBalanceQuery ? COPY.voice.balanceTitle : COPY.voice.title}
      subtitle={isBalanceQuery ? undefined : COPY.voice.reviewHint}
      footer={
        isBalanceQuery ? (
          <Button
            label={COPY.common.done}
            variant="primary"
            size="lg"
            onPress={onClose}
            fullWidth
          />
        ) : (
          <Button
            label={COPY.voice.saveCta}
            icon={Check}
            variant="primary"
            size="lg"
            onPress={save}
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
            tone={
              balanceOf.balance > 0 ? 'credit' : balanceOf.balance < 0 ? 'debit' : 'muted'
            }
          />
          <Text style={[TYPE.caption, styles.balanceCaption]}>
            {balanceOf.balance > 0
              ? COPY.ledger.toCollect
              : balanceOf.balance < 0
              ? COPY.ledger.toPay
              : COPY.ledger.allSquare}
          </Text>
        </Card>
      ) : (
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
});
