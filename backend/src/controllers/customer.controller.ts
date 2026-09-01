import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';
import { requireUserId } from '../middleware/auth.middleware';

/**
 * Customer CRUD. Every query is scoped to the verified Supabase user id —
 * the service-role client bypasses RLS, so tenant isolation is enforced here.
 */

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { name, phone, address, type, openingBalance } = req.body;

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({ user_id: userId, name, phone, address, type })
      .select()
      .single();

    if (error) throw error;

    // An opening balance is stored as a real 'gave'/'got' entry so it stays
    // auditable and survives retroactive edits — the DB trigger then keeps
    // customers.balance in sync automatically.
    if (typeof openingBalance === 'number' && openingBalance !== 0) {
      const { error: openingError } = await supabase.from('transactions').insert({
        user_id: userId,
        customer_id: customer.id,
        party_name: customer.name,
        type: openingBalance > 0 ? 'gave' : 'got',
        amount: Math.abs(openingBalance),
        note: 'Opening balance',
        payment_mode: 'cash',
        source: 'manual',
      });
      if (openingError) throw openingError;

      const { data: refreshed, error: refreshError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single();
      if (refreshError) throw refreshError;
      res.status(201).json(refreshed);
      return;
    }

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { name, phone, address, type } = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update({ ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), ...(address !== undefined && { address }), ...(type !== undefined && { type }), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
