import type { Database } from '@/utils/supabase/types';

export type PostWithMediaDimensions = Database['public']['Tables']['posts']['Row'] & {
    feature_image_url: string | null;
    feature_image_width: number | null;
    feature_image_height: number | null;
    blur_data_url: string | null;
};