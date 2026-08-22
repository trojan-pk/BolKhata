import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCheck,
  ChevronLeft,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import {
  ELEV,
  GUTTER,
  MAX_CONTENT_WIDTH,
  MOTION,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { Party, Transaction } from '../types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DayHeading,
  EmptyState,
  Enter,
  IconButton,
  Money,
  Press,
  SectionHeader,
  useFeedback,
} from '../ui';
import { EntryRow } from './EntryRow';
import {
  formatMoney,
  formatPhone,
  groupByDate,
  normalisePhone,
} from '../utils/format';

/**
 * A customer's full account: what they owe, and every entry that got them
 * there — each row carrying the running balance after it, which is what makes a
 * statement checkable rather than just a list.
 *
 * Rendered as an in-tree overlay rather than a native `Modal` on purpose. A
 * Modal gets its own native window, which would put toasts and confirmation
 * dialogs raised from this panel *behind* it — so deleting a customer or a
 * failed dial would silently appear to do nothing.
 */
export const CustomerLedgerPanel: React.FC<{
  visible: boolean;
  party: Party | null;
  transactions: Transaction[];
  currency?: string;
  storeName?: string;
  onClose: () => void;
  onAddGave: () => void;
  onAddGot: () => void;
  onSettleUp: () => void;
  onEditTransaction?: (txn: Transaction) => void;
  onDeleteParty?: (partyId: string) => void;
}> = ({
  visible,
  party,
  transactions,
  currency = 'Rs',
  storeName = 'BolKhata',
  onClose,
  onAddGave,
  onAddGot,
  onSettleUp,
  onEditTransaction,
  onDeleteParty,
}) => {
  const { confirm, toast } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  /* ------------------------------------------------------------ animation -- */
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        friction: 24,
        tension: 200,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: MOTION.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, progress]);

  /* --------------------------------------------------------- android back -- */
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  /* ------------------------------------------------------------- statement -- */
  const entries = useMemo(() => {
    if (!party) return [];
    const own = transactions.filter((t) => t.partyId === party.id);

    // Walk oldest → newest to accumulate the balance, then present newest first.
    const chronological = [...own].sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
    );
    let running = 0;
    const stamped = chronological.map((txn) => {
      running += txn.type === 'gave' ? txn.amount : -txn.amount;
      return { txn, balance: running, date: txn.date };
    });
    return stamped.reverse();
  }, [party, transactions]);

  const days = useMemo(() => groupByDate(entries), [entries]);

  if (!mounted || !party) return null;

  const balance = party.currentBalance;
  const toCollect = balance > 0;
  const settled = balance === 0;
  const phone = normalisePhone(party.mobile);

  const statusLabel = settled
    ? COPY.ledger.allSquare
    : toCollect
    ? COPY.ledger.toCollect
    : COPY.ledger.toPay;

  /* --------------------------------------------------------------- actions -- */

  const call = () => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      toast('Could not open the dialler', 'error')
    );
  };

  const remind = () => {
    const message = encodeURIComponent(
      `Hello ${party.name},\n\n` +
        `A ledger reminder from ${storeName}. Your outstanding balance is ` +
        `${formatMoney(Math.abs(balance), currency)}.\n\n` +
        `Please arrange payment when convenient. Thank you.`
    );
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${phone}?text=${message}`).catch(() =>
        toast('WhatsApp is not available on this device', 'error')
      );
    });
  };

  const settle = async () => {
    const ok = await confirm({
      title: COPY.ledger.settleUp,
      body: `Record a ${formatMoney(Math.abs(balance), currency)} ${
        toCollect ? 'payment received from' : 'payment made to'
      } ${party.name} and bring the balance to zero?`,
      confirmLabel: COPY.ledger.settleUp,
    });
    if (ok) {
      onSettleUp();
      toast(COPY.party.settledToast);
    }
  };

  const removeParty = async () => {
    if (!onDeleteParty) return;
    const ok = await confirm({
      title: COPY.party.deleteTitle,
      body: COPY.party.deleteBody(party.name),
      confirmLabel: COPY.common.delete,
      destructive: true,
    });
    if (ok) {
      onDeleteParty(party.id);
      toast(COPY.party.deletedToast(party.name));
      onClose();
    }
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        {
          opacity: progress,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [Math.min(width * 0.25, 120), 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.shell, { paddingTop: insets.top }]}>
        {/* --------------------------------------------------------- bar -- */}
        <View style={styles.bar}>
          <View style={styles.barInner}>
            <IconButton
              icon={ChevronLeft}
              onPress={onClose}
              accessibilityLabel={COPY.common.close}
              size={40}
            />

            <View style={styles.identity}>
              <Avatar name={party.name} size={36} />
              <View style={styles.identityText}>
                <Text style={[TYPE.title3, styles.name]} numberOfLines={1}>
                  {party.name}
                </Text>
                <Text style={[TYPE.caption, styles.sub]} numberOfLines={1}>
                  {party.mobile ? formatPhone(party.mobile) : 'No phone number'}
                </Text>
              </View>
            </View>

            <View style={styles.barActions}>
              {phone ? (
                <IconButton
                  icon={Phone}
                  onPress={call}
                  accessibilityLabel={`Call ${party.name}`}
                />
              ) : null}
              {onDeleteParty ? (
                <IconButton
                  icon={Trash2}
                  onPress={removeParty}
                  accessibilityLabel={COPY.party.deleteTitle}
                  variant="danger"
                />
              ) : null}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------------------------------------------------- balance -- */}
          <Card
            tone={settled ? 'surface' : toCollect ? 'credit' : 'debit'}
            padding={SPACE.lg}
            radius={RADIUS.xl}
          >
            <View style={styles.balanceRow}>
              <View style={styles.balanceText}>
                <Text style={[TYPE.overline, styles.balanceLabel]}>
                  {statusLabel}
                </Text>
                <Money
                  value={balance}
                  currency={currency}
                  size="title1"
                  tone={settled ? 'muted' : toCollect ? 'credit' : 'debit'}
                  style={styles.balanceValue}
                />
                <Badge
                  label={COPY.party.entriesCount(entries.length)}
                  tone="neutral"
                  style={styles.entriesBadge}
                />
              </View>

              {!settled ? (
                <Button
                  label={COPY.ledger.settleUp}
                  icon={CheckCheck}
                  variant="secondary"
                  size="sm"
                  onPress={settle}
                />
              ) : null}
            </View>
          </Card>

          {/* ------------------------------------------- whatsapp reminder -- */}
          {toCollect && phone ? (
            <Press onPress={remind} style={styles.reminder}>
              <MessageCircle size={16} color={COLORS.whatsapp} strokeWidth={2.2} />
              <Text style={[TYPE.label, styles.reminderText]}>
                {COPY.party.reminderCta}
              </Text>
            </Press>
          ) : null}

          {/* -------------------------------------------------- statement -- */}
          <View style={styles.statement}>
            <SectionHeader title={COPY.ledger.statement} />

            {entries.length === 0 ? (
              <EmptyState
                title={COPY.party.emptyLedgerTitle}
                body={COPY.party.emptyLedgerBody}
              />
            ) : (
              days.map((day) => (
                <View key={day.key}>
                  <DayHeading label={day.label} />
                  <View style={styles.rows}>
                    {day.items.map((item, index) => (
                      <Enter key={item.txn.id} index={index}>
                        <EntryRow
                          transaction={item.txn}
                          currency={currency}
                          context="statement"
                          runningBalance={item.balance}
                          onPress={
                            onEditTransaction
                              ? () => onEditTransaction(item.txn)
                              : undefined
                          }
                        />
                      </Enter>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* -------------------------------------------------- action bar -- */}
        <View
          style={[
            styles.actionBar,
            ELEV.raised,
            { paddingBottom: Math.max(insets.bottom, SPACE.md) },
          ]}
        >
          <View style={styles.actionBarInner}>
            <Button
              label={COPY.ledger.youGave}
              icon={Minus}
              variant="debit"
              size="lg"
              onPress={onAddGave}
              style={styles.actionButton}
            />
            <Button
              label={COPY.ledger.youGot}
              icon={Plus}
              variant="credit"
              size="lg"
              onPress={onAddGot}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: COLORS.paper,
    zIndex: 500,
  },
  shell: {
    flex: 1,
  },
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    backgroundColor: COLORS.surface,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 2,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 2,
  },
  identityText: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: COLORS.textPrimary,
  },
  sub: {
    color: COLORS.textMuted,
  },
  barActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  scroll: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.huge,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  balanceText: {
    flex: 1,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
  },
  balanceValue: {
    marginTop: SPACE.xs,
  },
  entriesBadge: {
    marginTop: SPACE.sm,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.md,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.whatsappSoft,
    borderWidth: 1,
    borderColor: COLORS.creditBorder,
  },
  reminderText: {
    color: COLORS.creditStrong,
    fontWeight: '700',
  },
  statement: {
    marginTop: SPACE.xxl,
  },
  rows: {
    gap: SPACE.sm,
  },
  actionBar: {
    paddingTop: SPACE.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  actionBarInner: {
    flexDirection: 'row',
    gap: SPACE.md,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: GUTTER,
  },
  actionButton: {
    flex: 1,
  },
});
