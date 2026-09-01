import { describe, it, expect } from 'vitest';
import { Party, Transaction, CashbookEntry } from '../types';
import { balanceFor, withRecalculatedBalance, normalizeLegacyIds } from './ledger';
import { isUuid } from './uuid';

const party = (id: string, balance = 0): Party => ({
  id,
  name: `Party ${id}`,
  mobile: '0300 1234567',
  type: 'customer',
  currentBalance: balance,
  lastUpdated: '2026-01-01',
});

const txn = (
  id: string,
  partyId: string,
  type: 'gave' | 'got',
  amount: number
): Transaction => ({
  id,
  partyId,
  partyName: `Party ${partyId}`,
  type,
  amount,
  date: '2026-01-01',
  note: '',
  paymentMode: 'cash',
  source: 'manual',
  createdAt: 1_700_000_000_000,
});

describe('balanceFor', () => {
  it('sums gave as positive and got as negative', () => {
    const txns = [
      txn('a', 'p1', 'gave', 500),
      txn('b', 'p1', 'got', 200),
      txn('c', 'p2', 'gave', 999), // different party — ignored
    ];
    expect(balanceFor(txns, 'p1')).toBe(300);
  });

  it('returns zero for a party with no entries', () => {
    expect(balanceFor([], 'p1')).toBe(0);
  });

  it('includes the opening-balance entry like any other row', () => {
    const txns = [txn('open', 'p1', 'gave', 1000)];
    expect(balanceFor(txns, 'p1')).toBe(1000);
  });
});

describe('withRecalculatedBalance', () => {
  it('refreshes only the target party', () => {
    const parties = [party('p1', 5), party('p2', 7)];
    const txns = [txn('a', 'p1', 'gave', 400), txn('b', 'p2', 'got', 50)];

    const next = withRecalculatedBalance(parties, txns, 'p1', '2026-02-02');

    expect(next.find((p) => p.id === 'p1')).toMatchObject({
      currentBalance: 400,
      lastUpdated: '2026-02-02',
    });
    expect(next.find((p) => p.id === 'p2')).toEqual(parties[1]);
  });
});

describe('normalizeLegacyIds', () => {
  const cashEntry = (id: string): CashbookEntry => ({
    id,
    type: 'in',
    amount: 10,
    category: 'Sales',
    note: '',
    date: '2026-01-01',
    createdAt: 1_700_000_000_000,
  });

  it('is a no-op when every id is already a UUID', () => {
    const parties = [party('00000000-0000-4000-8000-000000000001')];
    const txns = [
      txn('00000000-0000-4000-8000-000000000002', parties[0].id, 'gave', 100),
    ];
    const result = normalizeLegacyIds(parties, txns, [cashEntry('00000000-0000-4000-8000-000000000003')]);
    expect(result.changed).toBe(false);
    expect(result.parties).toBe(parties);
  });

  it('reissues legacy ids and rewires every reference', () => {
    const parties = [party('p_lx8f2k'), party('00000000-0000-4000-8000-000000000001')];
    const txns = [
      txn('t_abc123', 'p_lx8f2k', 'gave', 250),
      txn('00000000-0000-4000-8000-000000000002', parties[1].id, 'got', 75),
    ];

    const result = normalizeLegacyIds(parties, txns, [cashEntry('c_zz999')]);

    expect(result.changed).toBe(true);

    const remappedParty = result.parties[0];
    expect(isUuid(remappedParty.id)).toBe(true);
    // The UUID party is untouched
    expect(result.parties[1].id).toBe(parties[1].id);

    // The legacy transaction points at the remapped party and got a UUID id
    expect(result.transactions[0].partyId).toBe(remappedParty.id);
    expect(isUuid(result.transactions[0].id)).toBe(true);
    // The UUID transaction is untouched
    expect(result.transactions[1].id).toBe(txns[1].id);
    expect(result.transactions[1].partyId).toBe(parties[1].id);

    expect(isUuid(result.cashbook[0].id)).toBe(true);
  });

  it('keeps both entries of one party pointing at the same new id', () => {
    const parties = [party('p_old')];
    const txns = [
      txn('t_one', 'p_old', 'gave', 100),
      txn('t_two', 'p_old', 'got', 40),
    ];
    const result = normalizeLegacyIds(parties, txns, []);
    const newPartyId = result.parties[0].id;
    expect(result.transactions.every((t) => t.partyId === newPartyId)).toBe(true);
    expect(result.transactions[0].id).not.toBe(result.transactions[1].id);
  });
});
