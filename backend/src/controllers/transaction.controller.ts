import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';
import { requireUserId } from '../middleware/auth.middleware';

/**
 * Transaction CRUD.
 *
 * Balances are never computed here: inserting, editing, or deleting a row
 * fires the `trg_transactions_recalc_balance` trigger, which recomputes
 * customers.balance from the full transaction history atomically — so
 * concurrent writes can't corrupt the total.
 */

async function fetchBalance(customerId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('balance')
    .eq('id', customerId)
    .single();
  if (error) throw error;
  return data ? Number(data.balance) : null;
}

export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { customer_id, limit } = req.query as unknown as {
      customer_id?: string;
      limit: number;
    };

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (customer_id) query = query.eq('customer_id', customer_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { customer_id, type, amount, note, payment_mode, date, source } = req.body;

    // Verify the customer belongs to this user before touching the ledger.
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customer_id)
      .eq('user_id', userId)
      .single();

    if (custError || !customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        customer_id,
        party_name: customer.name,
        type,
        amount,
        note,
        payment_mode,
        date,
        source,
      })
      .select()
      .single();

    if (txError) throw txError;

    const newBalance = await fetchBalance(customer_id);
    res.status(201).json({ transaction, newBalance });
  } catch (error) {
    next(error);
  }
};

export const getTransactionsByCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Scope through the customer so another tenant's customer id leaks nothing.
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (custError || !customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { type, amount, note, payment_mode, date } = req.body;

    const { data: updated, error } = await supabase
      .from('transactions')
      .update({
        ...(type !== undefined && { type }),
        ...(amount !== undefined && { amount }),
        ...(note !== undefined && { note }),
        ...(payment_mode !== undefined && { payment_mode }),
        ...(date !== undefined && { date }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updated) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const newBalance = await fetchBalance(updated.customer_id);
    res.json({ transaction: updated, newBalance });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { data: deleted, error: findError } = await supabase
      .from('transactions')
      .select('id, customer_id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (findError || !deleted) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;

    const newBalance = await fetchBalance(deleted.customer_id);
    res.json({ success: true, newBalance });
  } catch (error) {
    next(error);
  }
};
