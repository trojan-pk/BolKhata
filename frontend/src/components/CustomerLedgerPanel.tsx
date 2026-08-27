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
  Calendar,
  CheckCheck,
  ChevronLeft,
  Clock,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { WhatsAppIcon } from './WhatsAppIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ApiService } from '../services/api';
import { getActiveTemplateText } from '../services/reminderTemplates';
import { WaScheduleModal, getTimeRemainingText } from './WaScheduleModal';

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
  storeName = 'Veldger',
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

  // WhatsApp backend, schedule & cooldown state
  const WA_USER_ID = '00000000-0000-0000-0000-000000000000';
  const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown
  const [waLinked, setWaLinked] = useState(false);
  const [lastReminderAt, setLastReminderAt] = useState<string | null>(null);
  const [cooldownSecs, setCooldownSecs] = useState<number>(0);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<any | null>(null);

  const fetchSchedules = () => {
    if (!party?.id) return;
    ApiService.getScheduledWaReminders(WA_USER_ID)
      .then((list) => {
        const found = list.find(
          (s: any) => s.customerId === party.id && s.status === 'PENDING'
        );
        setPendingSchedule(found || null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    ApiService.checkWaStatus(WA_USER_ID)
      .then((s) => setWaLinked(s.linked))
      .catch(() => {});
    fetchSchedules();
  }, [party?.id]);

  // Check 1-hour cooldown for active party
  useEffect(() => {
    if (!party?.id) return;
    const key = `@bolkhata_wa_last_sent_${party.id}`;
    AsyncStorage.getItem(key).then((val) => {
      if (val) {
        const lastMs = parseInt(val, 10);
        const elapsed = Date.now() - lastMs;
        if (elapsed < COOLDOWN_MS) {
          setCooldownSecs(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
          setLastReminderAt(new Date(lastMs).toISOString());
        } else {
          setCooldownSecs(0);
        }
      } else {
        setCooldownSecs(0);
      }
    });
  }, [party?.id]);

  // Live 1-second countdown ticker
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const timer = setInterval(() => {
      setCooldownSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSecs]);

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

  const remind = async () => {
    if (!waLinked) {
      toast('Link your WhatsApp in Settings first', 'error');
      return;
    }
    if (!party?.id || cooldownSecs > 0) return;

    setSendingReminder(true);
    try {
      const activeTemplate = await getActiveTemplateText();
      const result = await ApiService.sendWaReminder(WA_USER_ID, {
        id: party.id,
        phone: party.mobile,
        name: party.name,
        balance: party.currentBalance,
        message: activeTemplate,
        storeName: storeName,
      });
      if (result.success) {
        const now = Date.now();
        await AsyncStorage.setItem(`@bolkhata_wa_last_sent_${party.id}`, now.toString());
        setLastReminderAt(new Date(now).toISOString());
        setCooldownSecs(3600); // 1-hour cooldown
        toast('Reminder sent via WhatsApp ✓');
      } else {
        toast(result.error ?? 'Failed to send reminder', 'error');
      }
    } catch {
      toast('Could not reach server', 'error');
    } finally {
      setSendingReminder(false);
    }
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
            <View style={styles.balanceHeader}>
              <View style={styles.labelGroup}>
                <Text style={[TYPE.overline, styles.balanceLabel]}>
                  {statusLabel}
                </Text>
                <Badge
                  label={COPY.party.entriesCount(entries.length)}
                  tone="neutral"
                />
              </View>

              {!settled ? (
                <Button
                  label={COPY.ledger.settleUp}
                  icon={CheckCheck}
                  variant="secondary"
                  size="sm"
                  onPress={settle}
                  style={styles.settleBtn}
                />
              ) : null}
            </View>

            <Money
              value={balance}
              currency={currency}
              size="title1"
              tone={settled ? 'muted' : toCollect ? 'credit' : 'debit'}
              style={styles.balanceValue}
            />
          </Card>

          {/* ------------------------------------------- whatsapp reminder -- */}
          {toCollect && phone ? (
            <View style={styles.waSectionRow}>
              <Press
                onPress={remind}
                disabled={!waLinked || sendingReminder || cooldownSecs > 0}
                style={[
                  styles.waBtn,
                  !waLinked && styles.waBtnDisabled,
                  cooldownSecs > 0 && styles.waBtnCooldown,
                  sendingReminder && styles.waBtnSending,
                ]}
              >
                <WhatsAppIcon
                  size={20}
                  color={
                    cooldownSecs > 0
                      ? '#128C7E'
                      : waLinked
                      ? '#FFFFFF'
                      : COLORS.textMuted
                  }
                />
                <Text
                  style={[
                    styles.waBtnText,
                    !waLinked && styles.waBtnTextDim,
                    cooldownSecs > 0 && styles.waBtnTextCooldown,
                  ]}
                >
                  {sendingReminder
                    ? 'Sending…'
                    : cooldownSecs > 0
                    ? `Remind in ${Math.floor(cooldownSecs / 60)}m ${cooldownSecs % 60 < 10 ? '0' : ''}${cooldownSecs % 60}s`
                    : waLinked
                    ? 'Send WA Reminder'
                    : 'Link WA in Settings'}
                </Text>
                {cooldownSecs > 0 ? (
                  <View style={styles.cooldownBadge}>
                    <Text style={styles.cooldownBadgeText}>1h Cooldown</Text>
                  </View>
                ) : null}
              </Press>

              <Press
                onPress={() => {
                  if (!waLinked) {
                    toast('Link your WhatsApp in Settings first', 'error');
                    return;
                  }
                  setScheduleModalOpen(true);
                }}
                style={styles.scheduleBtn}
              >
                <Clock size={18} color="#128C7E" strokeWidth={2.2} />
                <Text style={styles.scheduleBtnText}>Schedule</Text>
              </Press>
            </View>
          ) : null}

          {/* Active scheduled reminder badge */}
          {pendingSchedule ? (
            <View style={styles.scheduledBanner}>
              <Clock size={16} color="#128C7E" />
              <View style={styles.scheduledTextCol}>
                <Text style={styles.scheduledBannerText}>
                  Scheduled for{' '}
                  {new Date(pendingSchedule.scheduledAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.scheduledCountdownText}>
                  (Sends {getTimeRemainingText(pendingSchedule.scheduledAt)})
                </Text>
              </View>
              <Press
                onPress={async () => {
                  await ApiService.cancelScheduledWaReminder(WA_USER_ID, pendingSchedule.id);
                  toast('Schedule cancelled');
                  fetchSchedules();
                }}
                style={styles.cancelSchBtn}
              >
                <Text style={styles.cancelSchText}>Cancel</Text>
              </Press>
            </View>
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

      <WaScheduleModal
        visible={scheduleModalOpen}
        userId={WA_USER_ID}
        customer={
          party
            ? {
                id: party.id,
                name: party.name,
                phone: party.mobile,
                balance: party.currentBalance,
              }
            : null
        }
        storeName={storeName}
        onClose={() => setScheduleModalOpen(false)}
        onScheduled={fetchSchedules}
      />
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  settleBtn: {
    width: 'auto',
    flexShrink: 0,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flexWrap: 'wrap',
  },
  balanceLabel: {
    color: COLORS.textSecondary,
  },
  balanceValue: {
    marginTop: SPACE.sm + 2,
  },
  waSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.md,
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.xl,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.xl,
    backgroundColor: '#E8F9F0',
    borderWidth: 1.5,
    borderColor: '#128C7E',
  },
  scheduleBtnText: {
    ...TYPE.label,
    color: '#075E54',
    fontWeight: '700',
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#E8F9F0',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  scheduledTextCol: {
    flex: 1,
    marginLeft: 8,
    gap: 1,
  },
  scheduledBannerText: {
    ...TYPE.caption,
    color: '#075E54',
    fontWeight: '700',
    fontSize: 12,
  },
  scheduledCountdownText: {
    ...TYPE.caption,
    color: '#128C7E',
    fontWeight: '600',
    fontSize: 11,
  },
  cancelSchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.xs,
  },
  cancelSchText: {
    ...TYPE.caption,
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 11,
  },
  waBtnText: {
    ...TYPE.label,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  waBtnTextDim: {
    color: COLORS.textMuted,
  },
  waBtnTextCooldown: {
    color: '#1E293B',
    fontWeight: '700',
  },
  waBtnDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.hairline,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  waBtnCooldown: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  waBtnSending: {
    opacity: 0.7,
  },
  cooldownBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginLeft: SPACE.xs,
  },
  cooldownBadgeText: {
    ...TYPE.caption,
    color: '#0F172A',
    fontSize: 12,
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
