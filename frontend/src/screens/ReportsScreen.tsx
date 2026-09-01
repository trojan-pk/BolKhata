import React, { useMemo } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CheckCircle2, FileDown, Share2 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { GUTTER, RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Party } from '../types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Enter,
  Money,
  Row,
  ScreenHeader,
  SectionHeader,
  useFeedback,
} from '../ui';
import { daysAgo, formatDate, formatMoney, formatRelativeDate } from '../utils/format';

const STALE_DAYS = 30;

/**
 * Where the money is sitting. Three questions, in the order a shopkeeper asks
 * them: how is the outstanding split, who owes the most, and what has gone
 * quiet long enough to worry about.
 */
export const ReportsScreen: React.FC<{
  parties: Party[];
  currency?: string;
  storeName?: string;
  onSelectParty?: (party: Party) => void;
}> = ({ parties, currency = 'Rs', storeName = 'BolKhata', onSelectParty }) => {
  const { toast } = useFeedback();

  const { debtors, creditors, toCollect, toPay, stale } = useMemo(() => {
    const debtorList = parties
      .filter((p) => p.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
    const creditorList = parties
      .filter((p) => p.currentBalance < 0)
      .sort((a, b) => a.currentBalance - b.currentBalance);

    return {
      debtors: debtorList,
      creditors: creditorList,
      toCollect: debtorList.reduce((sum, p) => sum + p.currentBalance, 0),
      toPay: creditorList.reduce((sum, p) => sum + Math.abs(p.currentBalance), 0),
      stale: debtorList.filter((p) => (daysAgo(p.lastUpdated) ?? 0) >= STALE_DAYS),
    };
  }, [parties]);

  const outstanding = toCollect + toPay;
  const collectShare = outstanding > 0 ? toCollect / outstanding : 0;

  /* ------------------------------------------------------------- exporting -- */

  const buildStatement = () => {
    const lines: string[] = [];
    lines.push(`${storeName} — Ledger statement`);
    lines.push(`Generated ${formatDate(new Date().toISOString())}`);
    lines.push('');
    lines.push(
      `${COPY.ledger.toCollect.toUpperCase()} (${debtors.length}) — ${formatMoney(
        toCollect,
        currency
      )}`
    );
    debtors.forEach((p) =>
      lines.push(`  ${p.name} — ${formatMoney(p.currentBalance, currency)}`)
    );
    lines.push('');
    lines.push(
      `${COPY.ledger.toPay.toUpperCase()} (${creditors.length}) — ${formatMoney(
        toPay,
        currency
      )}`
    );
    creditors.forEach((p) =>
      lines.push(`  ${p.name} — ${formatMoney(p.currentBalance, currency)}`)
    );
    lines.push('');
    lines.push(`${COPY.ledger.netPosition.toUpperCase()} — ${formatMoney(toCollect - toPay, currency)}`);
    return lines.join('\n');
  };

  const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** The same statement, laid out for a printable A4 PDF via expo-print. */
  const buildStatementHtml = () => {
    const rows = (list: Party[]) =>
      list
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.name)}</td><td class="num">${formatMoney(
              p.currentBalance,
              currency
            )}</td></tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 40px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding: 6px 4px; }
  td { padding: 6px 4px; border-bottom: 1px solid #f1f5f9; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .net { margin-top: 28px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; display: flex; justify-content: space-between; }
  .total { font-weight: 700; }
</style></head>
<body>
  <h1>${escapeHtml(storeName)}</h1>
  <div class="sub">Ledger statement · Generated ${formatDate(new Date().toISOString())}</div>
  <h2>${escapeHtml(COPY.ledger.toCollect)} (${debtors.length}) — ${formatMoney(toCollect, currency)}</h2>
  <table><tr><th>Party</th><th class="num">Balance</th></tr>${rows(debtors)}</table>
  <h2>${escapeHtml(COPY.ledger.toPay)} (${creditors.length}) — ${formatMoney(toPay, currency)}</h2>
  <table><tr><th>Party</th><th class="num">Balance</th></tr>${rows(creditors)}</table>
  <div class="net"><span>${escapeHtml(COPY.ledger.netPosition)}</span><span class="total">${formatMoney(
    toCollect - toPay,
    currency
  )}</span></div>
</body>
</html>`;
  };

  /** Renders the statement to a PDF file and opens the share sheet with it. */
  const exportPdf = async () => {
    if (Platform.OS === 'web') {
      // expo-print can't produce a file on web — reuse the text share there.
      await exportStatement();
      return;
    }

    try {
      const { uri } = await Print.printToFileAsync({ html: buildStatementHtml() });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${storeName} statement`,
        });
      } else {
        toast(`PDF saved to ${uri}`);
      }
    } catch {
      toast('Could not generate the PDF', 'error');
    }
  };

  const exportStatement = async () => {
    const statement = buildStatement();

    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
      try {
        if (nav?.share) {
          await nav.share({ title: `${storeName} statement`, text: statement });
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(statement);
          toast(COPY.reports.copiedToast);
          return;
        }
      } catch {
        // A dismissed share sheet is not an error worth reporting.
        return;
      }
      toast('Sharing is not available in this browser', 'error');
      return;
    }

    try {
      await Share.share({
        message: statement,
        title: `${storeName} statement`,
      });
    } catch {
      toast('Could not open the share sheet', 'error');
    }
  };

  /* ------------------------------------------------------------------ view -- */

  if (parties.length === 0 || outstanding === 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={COPY.reports.title} subtitle={COPY.reports.subtitle} />
        <EmptyState
          icon={CheckCircle2}
          title={COPY.reports.emptyTitle}
          body={COPY.reports.emptyBody}
          size="full"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={COPY.reports.title}
        subtitle={COPY.reports.subtitle}
        action={
          <View style={styles.headerActions}>
            <Button
              label="PDF"
              icon={FileDown}
              variant="secondary"
              size="sm"
              onPress={exportPdf}
            />
            <Button
              label={COPY.reports.export}
              icon={Share2}
              variant="secondary"
              size="sm"
              onPress={exportStatement}
            />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------- split card -- */}
        <Card padding={SPACE.lg}>
          <Text style={[TYPE.overline, styles.eyebrow]}>{COPY.reports.split}</Text>

          <View style={styles.bar}>
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(collectShare, 0.02),
                  backgroundColor: COLORS.credit,
                },
              ]}
            />
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(1 - collectShare, 0.02),
                  backgroundColor: COLORS.debit,
                },
              ]}
            />
          </View>

          <View style={styles.legend}>
            <LegendRow
              tint={COLORS.credit}
              label={COPY.ledger.toCollect}
              meta={COPY.reports.partiesLabel(debtors.length)}
              value={toCollect}
              currency={currency}
              tone="credit"
              share={collectShare}
            />
            <LegendRow
              tint={COLORS.debit}
              label={COPY.ledger.toPay}
              meta={COPY.reports.partiesLabel(creditors.length)}
              value={toPay}
              currency={currency}
              tone="debit"
              share={1 - collectShare}
            />
          </View>
        </Card>

        {/* -------------------------------------------------------- stale -- */}
        {stale.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={COPY.reports.overdue}
              meta={`${stale.length}`}
            />
            <View style={styles.rows}>
              {stale.slice(0, 5).map((party, index) => (
                <Enter key={party.id} index={index}>
                  <Row
                    onPress={onSelectParty ? () => onSelectParty(party) : undefined}
                    chevron={!!onSelectParty}
                    leading={<Avatar name={party.name} size={40} />}
                    title={party.name}
                    subtitle={`Last entry ${formatRelativeDate(party.lastUpdated)}`}
                    trailing={
                      <>
                        <Money
                          value={party.currentBalance}
                          currency={currency}
                          size="body"
                          tone="credit"
                        />
                        <Badge label="Stale" tone="warning" />
                      </>
                    }
                  />
                </Enter>
              ))}
            </View>
          </View>
        ) : null}

        {/* ------------------------------------------------------ debtors -- */}
        {debtors.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={COPY.reports.topDebtors}
              meta={COPY.reports.partiesLabel(debtors.length)}
            />
            <View style={styles.rows}>
              {debtors.slice(0, 8).map((party, index) => (
                <Enter key={party.id} index={index}>
                  <ProportionRow
                    party={party}
                    currency={currency}
                    max={debtors[0].currentBalance}
                    tone="credit"
                    onPress={onSelectParty ? () => onSelectParty(party) : undefined}
                  />
                </Enter>
              ))}
            </View>
          </View>
        ) : null}

        {/* ---------------------------------------------------- creditors -- */}
        {creditors.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={COPY.reports.topCreditors}
              meta={COPY.reports.partiesLabel(creditors.length)}
            />
            <View style={styles.rows}>
              {creditors.slice(0, 8).map((party, index) => (
                <Enter key={party.id} index={index}>
                  <ProportionRow
                    party={party}
                    currency={currency}
                    max={Math.abs(creditors[0].currentBalance)}
                    tone="debit"
                    onPress={onSelectParty ? () => onSelectParty(party) : undefined}
                  />
                </Enter>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

/** Name, amount, and a hairline bar showing size relative to the largest. */
const ProportionRow: React.FC<{
  party: Party;
  currency: string;
  max: number;
  tone: 'credit' | 'debit';
  onPress?: () => void;
}> = ({ party, currency, max, tone, onPress }) => {
  const value = Math.abs(party.currentBalance);
  const share = max > 0 ? Math.max(value / max, 0.04) : 0;
  const tint = tone === 'credit' ? COLORS.credit : COLORS.debit;

  return (
    <Row
      onPress={onPress}
      leading={<Avatar name={party.name} size={40} />}
      title={party.name}
      meta={
        <View style={styles.miniTrack}>
          <View
            style={[styles.miniFill, { flex: share, backgroundColor: tint }]}
          />
          <View style={{ flex: 1 - share }} />
        </View>
      }
      trailing={
        <Money value={value} currency={currency} size="body" tone={tone} />
      }
    />
  );
};

const LegendRow: React.FC<{
  tint: string;
  label: string;
  meta: string;
  value: number;
  currency: string;
  tone: 'credit' | 'debit';
  share: number;
}> = ({ tint, label, meta, value, currency, tone, share }) => (
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, { backgroundColor: tint }]} />
    <View style={styles.legendText}>
      <Text style={[TYPE.label, styles.legendLabel]}>{label}</Text>
      <Text style={[TYPE.caption, styles.legendMeta]}>
        {meta} · {Math.round(share * 100)}%
      </Text>
    </View>
    <Money value={value} currency={currency} size="body" tone={tone} />
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: 132,
  },
  eyebrow: {
    color: COLORS.textMuted,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACE.md,
    gap: 3,
  },
  barSegment: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  legend: {
    marginTop: SPACE.lg,
    gap: SPACE.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    gap: 1,
  },
  legendLabel: {
    color: COLORS.textPrimary,
  },
  legendMeta: {
    color: COLORS.textMuted,
  },
  section: {
    marginTop: SPACE.xxl,
  },
  rows: {
    gap: SPACE.sm,
  },
  miniTrack: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceSunken,
    marginTop: 7,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
});
