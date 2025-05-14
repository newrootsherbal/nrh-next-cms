// utils/supabase/types.ts
export type UserRole = 'ADMIN' | 'WRITER' | 'USER';

export interface Profile {
  id: string;
  updated_at?: string | null;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  role: UserRole;
}

// New type for Language
export interface Language {
  id: number;
  code: string; // e.g., 'en', 'fr'
  name: string; // e.g., 'English', 'Français'
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}