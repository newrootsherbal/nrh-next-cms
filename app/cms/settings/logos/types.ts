import type { Database } from '@/utils/supabase/types';

export type Logo = Database['public']['Tables']['logos']['Row'] & { media: (Database['public']['Tables']['media']['Row'] & { alt_text: string | null }) | null };