import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type UserRole = 'admin' | 'projectManager' | 'siteInspector' | 'contractor' | 'worker' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  notifications_enabled?: boolean;
  theme_preference?: 'light' | 'dark';
  language_preference?: string;
  is_verified?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
} 