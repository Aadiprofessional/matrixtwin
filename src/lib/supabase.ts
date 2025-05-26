import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahtardktcamfwgjuwmeb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodGFyZGt0Y2FtZndnanV3bWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTI5ODIsImV4cCI6MjA2MDg4ODk4Mn0.9yk6uUEpX-eIHTziSlG9nTDmKb2LRR0YY_P0pH6A_lc';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'admin' | 'projectManager' | 'siteInspector' | 'contractor' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  notifications_enabled?: boolean;
  theme_preference?: 'light' | 'dark';
  language_preference?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
} 