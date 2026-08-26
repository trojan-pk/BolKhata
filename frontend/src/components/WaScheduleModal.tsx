import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Press, useFeedback } from '../ui';
import { ApiService } from '../services/api';
import { getActiveTemplateText } from '../services/reminderTemplates';
import { WaMarkdownPreview } from './WaMarkdownPreview';

interface Props {
  visible: boolean;
  userId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    balance: number;
  } | null;
  storeName?: string;
  onClose: () => void;
  onScheduled?: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getTimeRemainingText(targetIso: string): string {
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return 'due now';

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) {
    return `in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `in ${mins}m`;
  }
  return 'in < 1m';
}

export const WaScheduleModal: React.FC<Props> = ({
  visible,
  userId,
  customer,
  storeName = 'BolKhata Store',
  onClose,
  onScheduled,
}) => {
  const { toast } = useFeedback();
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Calendar State (year, month 0-11, day 1-31)
  const today = new Date();
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);

  const [calYear, setCalYear] = useState<number>(tmr.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(tmr.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(tmr.getDate());

  // Clock State (hour 1-12, minute 0-59, ampm 'AM' | 'PM')
  const [hour, setHour] = useState<number>(10);
  const [minute, setMinute] = useState<number>(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (!visible) return;
    getActiveTemplateText().then(setActiveTemplate);

    const t = new Date();
    t.setDate(t.getDate() + 1);
    setCalYear(t.getFullYear());
    setCalMonth(t.getMonth());
    setSelectedDay(t.getDate());
    setHour(10);
    setMinute(0);
    setAmpm('AM');
  }, [visible]);

  if (!customer) return null;

  // Calendar Month Navigation
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  // Build Month Days Grid
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) dayCells.push(null);
  for (let d = 1; d <= totalDaysInMonth; d++) dayCells.push(d);

  // Time Steppers
  const adjustHour = (delta: number) => {
    setHour((h) => {
      let next = h + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    setMinute((m) => {
      let next = m + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 45;
      return next;
    });
  };

  // Construct Target ISO Date
  const calculateTargetIso = (): string => {
    let h24 = hour;
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;

    const d = new Date(calYear, calMonth, selectedDay, h24, minute, 0, 0);
    return d.toISOString();
  };

  const handleSchedule = async () => {
    setSubmitting(true);
    try {
      const scheduledAt = calculateTargetIso();
      const result = await ApiService.scheduleWaReminder(userId, {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        scheduledAt,
        message: activeTemplate,
        storeName,
      });

      if (result.success) {
        toast('Reminder scheduled successfully ⏰✓');
        if (onScheduled) onScheduled();
        onClose();
      } else {
        toast(result.error ?? 'Failed to schedule reminder', 'error');
      }
    } catch {
      toast('Could not connect to server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedSelectedDate = new Date(calYear, calMonth, selectedDay).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = `${hour}:${minute < 10 ? '0' : ''}${minute} ${ampm}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.clockIcon}>
              <Clock size={20} color="#128C7E" strokeWidth={2.2} />
            </View>
            <Text style={[TYPE.title2, styles.title]}>Schedule Reminder</Text>
          </View>
          <Press onPress={onClose} style={styles.closeBtn}>
            <Text style={[TYPE.label, styles.closeTxt]}>Cancel</Text>
          </Press>
        </View>

        <Text style={[TYPE.body, styles.subtitle]}>
          Schedule WhatsApp payment reminder for <Text style={styles.boldText}>{customer.name}</Text>.
        </Text>

        {/* ── REAL VISUAL CALENDAR ── */}
        <View style={styles.sectionHeader}>
          <CalendarIcon size={18} color="#128C7E" />
          <Text style={[TYPE.label, styles.sectionTitle]}>Select Date</Text>
        </View>

        <View style={styles.calendarCard}>
          {/* Month Header Bar */}
          <View style={styles.monthBar}>
            <Press onPress={prevMonth} style={styles.navBtn}>
              <ChevronLeft size={20} color={COLORS.textPrimary} />
            </Press>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[calMonth]} {calYear}
            </Text>
            <Press onPress={nextMonth} style={styles.navBtn}>
              <ChevronRight size={20} color={COLORS.textPrimary} />
            </Press>
          </View>

          {/* Weekday Names */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {dayCells.map((dayNum, idx) => {
              if (dayNum === null) {
                return <View key={`empty_${idx}`} style={styles.dayCellEmpty} />;
              }

              const isPast =
                new Date(calYear, calMonth, dayNum).setHours(23, 59, 59, 999) <
                today.setHours(0, 0, 0, 0);

              const isSelected = selectedDay === dayNum;

              return (
                <Press
                  key={`day_${dayNum}`}
                  disabled={isPast}
                  onPress={() => setSelectedDay(dayNum)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isPast && styles.dayCellPast,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isPast && styles.dayTextPast,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </Press>
              );
            })}
          </View>
        </View>

        {/* ── REAL VISUAL CLOCK PICKER ── */}
        <View style={styles.sectionHeader}>
          <Clock size={18} color="#128C7E" />
          <Text style={[TYPE.label, styles.sectionTitle]}>Set Time</Text>
        </View>

        <View style={styles.clockCard}>
          {/* Digital Time Dial */}
          <View style={styles.timeDisplayRow}>
            {/* Hour Dial */}
            <View style={styles.digitCol}>
              <Press onPress={() => adjustHour(1)} style={styles.stepBtn}>
                <Text style={styles.stepBtnTxt}>▲</Text>
              </Press>
              <View style={styles.digitBox}>
                <Text style={styles.digitTxt}>{hour < 10 ? '0' + hour : hour}</Text>
              </View>
              <Press onPress={() => adjustHour(-1)} style={styles.stepBtn}>
                <Text style={styles.stepBtnTxt}>▼</Text>
              </Press>
              <Text style={styles.unitLabel}>HOURS</Text>
            </View>

            <Text style={styles.colon}>:</Text>

            {/* Minute Dial */}
            <View style={styles.digitCol}>
              <Press onPress={() => adjustMinute(15)} style={styles.stepBtn}>
                <Text style={styles.stepBtnTxt}>▲</Text>
              </Press>
              <View style={styles.digitBox}>
                <Text style={styles.digitTxt}>{minute < 10 ? '0' + minute : minute}</Text>
              </View>
              <Press onPress={() => adjustMinute(-15)} style={styles.stepBtn}>
                <Text style={styles.stepBtnTxt}>▼</Text>
              </Press>
              <Text style={styles.unitLabel}>MINS</Text>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.ampmCol}>
              <Press
                onPress={() => setAmpm('AM')}
                style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
              >
                <Text style={[styles.ampmTxt, ampm === 'AM' && styles.ampmTxtActive]}>
                  AM
                </Text>
              </Press>
              <Press
                onPress={() => setAmpm('PM')}
                style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
              >
                <Text style={[styles.ampmTxt, ampm === 'PM' && styles.ampmTxtActive]}>
                  PM
                </Text>
              </Press>
            </View>
          </View>

          {/* Quick Preset Time Slot Pills */}
          <View style={styles.quickTimeRow}>
            {[
              { label: '🌅 9:00 AM', h: 9, m: 0, ap: 'AM' },
              { label: '☀️ 12:00 PM', h: 12, m: 0, ap: 'PM' },
              { label: '☕ 3:00 PM', h: 3, m: 0, ap: 'PM' },
              { label: '🌇 6:00 PM', h: 6, m: 0, ap: 'PM' },
              { label: '🌙 9:00 PM', h: 9, m: 0, ap: 'PM' },
            ].map((slot, idx) => (
              <Press
                key={idx}
                onPress={() => {
                  setHour(slot.h);
                  setMinute(slot.m);
                  setAmpm(slot.ap as any);
                }}
                style={styles.timePill}
              >
                <Text style={styles.timePillTxt}>{slot.label}</Text>
              </Press>
            ))}
          </View>
        </View>

        {/* Selected Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Schedule Target:</Text>
          <Text style={styles.summaryVal}>
            📅 {formattedSelectedDate} at ⏰ {formattedTime}
          </Text>
          <View style={styles.countdownPill}>
            <Clock size={13} color="#075E54" />
            <Text style={styles.countdownPillText}>
              Sends {getTimeRemainingText(calculateTargetIso())}
            </Text>
          </View>
        </View>

        {/* Message Preview */}
        <View style={styles.previewSection}>
          <Text style={[TYPE.label, styles.sectionTitle]}>Message Preview</Text>
          <WaMarkdownPreview
            text={activeTemplate}
            sampleName={customer.name}
            sampleAmount={customer.balance.toLocaleString()}
            sampleStore={storeName}
          />
        </View>

        <Button
          label={submitting ? 'Scheduling…' : `Schedule for ${formattedSelectedDate}`}
          icon={CalendarIcon}
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={handleSchedule}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  content: {
    padding: SPACE.xl,
    paddingBottom: SPACE.huge,
    gap: SPACE.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  clockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACE.sm,
  },
  closeTxt: {
    color: COLORS.textMuted,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACE.xs,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: SPACE.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  // Real Visual Calendar
  calendarCard: {
    padding: SPACE.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  navBtn: {
    padding: SPACE.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
  },
  monthTitle: {
    ...TYPE.label,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACE.xs,
  },
  weekdayText: {
    ...TYPE.caption,
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#128C7E',
  },
  dayCellPast: {
    opacity: 0.25,
  },
  dayText: {
    ...TYPE.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextPast: {
    color: COLORS.textMuted,
  },
  // Real Visual Clock Picker
  clockCard: {
    padding: SPACE.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    alignItems: 'center',
    gap: SPACE.md,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
  },
  digitCol: {
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: '#F1F5F9',
  },
  stepBtnTxt: {
    fontSize: 12,
    color: '#475569',
  },
  digitBox: {
    width: 60,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: '#E8F9F0',
    borderWidth: 1.5,
    borderColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitTxt: {
    fontSize: 24,
    fontWeight: '800',
    color: '#075E54',
  },
  unitLabel: {
    ...TYPE.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  colon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#128C7E',
    marginBottom: 16,
  },
  ampmCol: {
    gap: 6,
    marginBottom: 16,
  },
  ampmBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  ampmBtnActive: {
    backgroundColor: '#128C7E',
    borderColor: '#075E54',
  },
  ampmTxt: {
    ...TYPE.caption,
    fontWeight: '700',
    color: '#475569',
  },
  ampmTxtActive: {
    color: '#FFFFFF',
  },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACE.xs,
  },
  timePill: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  timePillTxt: {
    ...TYPE.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Summary
  summaryCard: {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#E8F9F0',
    borderWidth: 1,
    borderColor: '#25D366',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    ...TYPE.caption,
    color: '#075E54',
    fontWeight: '600',
  },
  summaryVal: {
    ...TYPE.label,
    fontSize: 15,
    fontWeight: '800',
    color: '#075E54',
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D9FDD3',
    paddingHorizontal: SPACE.md,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginTop: 2,
  },
  countdownPillText: {
    ...TYPE.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#075E54',
  },
  previewSection: {
    marginTop: SPACE.xs,
    gap: SPACE.sm,
  },
  confirmBtn: {
    marginTop: SPACE.md,
    backgroundColor: '#128C7E',
  },
});
