import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable. Supabase client will fail to initialize correctly.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl || 'http://placeholder.com', supabaseKey || 'placeholder');
