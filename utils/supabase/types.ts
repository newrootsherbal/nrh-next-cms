// lib/supabase/types.ts
export type UserRole = 'ADMIN' | 'WRITER' | 'USER';

export interface Profile {
  id: string; // UUID
  updated_at?: string | null;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  role: UserRole;
}

// You can also generate types from your Supabase schema using:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/database.types.ts
// And then use Database['public']['Tables']['profiles']['Row'] for Profile type.
// For this phase, manual types are fine.