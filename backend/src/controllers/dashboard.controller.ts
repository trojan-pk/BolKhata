import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';
import { requireUserId } from '../middleware/auth.middleware';

/**
 * Dashboard summary, computed from authoritative data:
 *  - receivable / payable from the trigger-maintained customer balances
 *  - today's activity straight from the transaction ledger
 */
export const getDashboardInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    const [customersRes, todayRes] = await Promise.all([
      supabase.from('customers').select('balance').eq('user_id', userId),
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .eq('date', today),
    ]);

    if (customersRes.error) throw customersRes.error;
    if (todayRes.error) throw todayRes.error;

    let totalReceivable = 0;
    let totalPayable = 0;
    for (const c of customersRes.data || []) {
      const balance = Number(c.balance);
      if (balance > 0) totalReceivable += balance;
      if (balance < 0) totalPayable += Math.abs(balance);
    }

    let gaveToday = 0;
    let gotToday = 0;
    for (const t of todayRes.data || []) {
      if (t.type === 'gave') gaveToday += Number(t.amount);
      else gotToday += Number(t.amount);
    }

    res.json({
      totalReceivable,
      totalPayable,
      netBalance: totalReceivable - totalPayable,
      partyCount: (customersRes.data || []).length,
      today: { gave: gaveToday, got: gotToday },
    });
  } catch (error) {
    next(error);
  }
};
