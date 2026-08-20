import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';

const USER_ID = '00000000-0000-0000-0000-000000000000'; // mocked

export const getDashboardInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('balance')
      .eq('user_id', USER_ID);
      
    if (error) throw error;
    
    let totalUdhaar = 0;
    customers?.forEach(c => {
      if (Number(c.balance) > 0) {
        totalUdhaar += Number(c.balance);
      }
    });
    
    res.json({
      totalUdhaar,
      dueToday: 0 // Mocked for now
    });
  } catch (error) { next(error); }
};
