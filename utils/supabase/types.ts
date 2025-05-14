// utils/supabase/types.ts
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

export interface Language {
  id: number;
  code: string;
  name: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PageStatus = 'draft' | 'published' | 'archived';

export interface Page {
  id: number;
  language_id: number;
  author_id?: string | null;
  title: string;
  slug: string;
  status: PageStatus;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  language_id: number;
  author_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  status: PageStatus;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string; // uuid
  uploader_id?: string | null;
  file_name: string;
  object_key: string;
  file_type?: string | null;
  size_bytes?: number | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: number;
  page_id?: number | null;
  post_id?: number | null;
  language_id: number;
  block_type: string;
  content?: any | null; // Define more specific types based on block_type if possible
  order: number;
  created_at: string;
  updated_at: string;
}

export type MenuLocation = 'HEADER' | 'FOOTER' | 'SIDEBAR';

export interface NavigationItem {
  id: number;
  language_id: number;
  menu_key: MenuLocation;
  label: string;
  url: string;
  parent_id?: number | null;
  order: number;
  page_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string;
    // Add other fields from auth.users if needed
}

export interface UserWithProfile {
    authUser: AuthUser; // Data from auth.users
    profile: Profile | null; // Data from public.profiles
}
// It's highly recommended to generate the full database types using:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > utils/supabase/database.types.ts
// And then import { Database } from './database.types'; in your Supabase client/server files.
// The types above are simplified. Your generated types will be more comprehensive.
// For example, Database['public']['Tables']['pages']['Row']