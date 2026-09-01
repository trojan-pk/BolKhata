import { CashbookEntry, Party, Transaction } from '../types';
import { isUuid, uuid } from './uuid';
import { todayISO } from './format';

/* ------------------------------------------------------------ ledger math -- */

/**
 * A party's balance is always the sum of its entries — including the opening
 * balance, which is stored as a real transaction rather than a loose number.
 * That's what lets edits and deletions recompute correctly instead of silently
 * dropping whatever the account started with.
 */
export function balanceFor(transactions: Transaction[], partyId: string): number {
  return transactions
    .filter((t) => t.partyId === partyId)
    .reduce((sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount), 0);
}

/** Returns the party list with one party's cached balance refreshed. */
export function withRecalculatedBalance(
  parties: Party[],
  transactions: Transaction[],
  partyId: string,
  date = todayISO()
): Party[] {
  const balance = balanceFor(transactions, partyId);
  return parties.map((p) =>
    p.id === partyId ? { ...p, currentBalance: balance, lastUpdated: date } : p
  );
}

/* ------------------------------------------------------ legacy id repair -- */

/**
 * One-time repair for ledgers created before cloud sync: legacy local ids
 * (`p_lx…`, `t_lx…`, `c_lx…`) can never satisfy the cloud schema's UUID
 * primary keys, so they are reissued and every reference is rewired in the
 * same pass. Rows that already carry UUIDs pass through untouched.
 */
export function normalizeLegacyIds(
  parties: Party[],
  transactions: Transaction[],
  cashbook: CashbookEntry[]
): { parties: Party[]; transactions: Transaction[]; cashbook: CashbookEntry[]; changed: boolean } {
  const needsRepair =
    parties.some((p) => !isUuid(p.id)) ||
    transactions.some((t) => !isUuid(t.id)) ||
    cashbook.some((c) => !isUuid(c.id));

  if (!needsRepair) {
    return { parties, transactions, cashbook, changed: false };
  }

  const idMap = new Map<string, string>();
  const remap = (id: string): string => {
    if (isUuid(id)) return id;
    let next = idMap.get(id);
    if (!next) {
      next = uuid();
      idMap.set(id, next);
    }
    return next;
  };

  return {
    parties: parties.map((p) => ({ ...p, id: remap(p.id) })),
    transactions: transactions.map((t) => ({
      ...t,
      id: remap(t.id),
      partyId: remap(t.partyId),
    })),
    cashbook: cashbook.map((c) => ({ ...c, id: remap(c.id) })),
    changed: true,
  };
}
