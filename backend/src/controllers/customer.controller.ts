import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';

const USER_ID = '00000000-0000-0000-0000-000000000000'; // mocked for hackathon

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', USER_ID);
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .insert({ user_id: USER_ID, name, phone, balance: 0 })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', USER_ID)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .update({ name, phone })
      .eq('id', req.params.id)
      .eq('user_id', USER_ID)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', USER_ID);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
};
