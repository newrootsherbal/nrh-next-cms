'use server';

import { createClient } from '../../utils/supabase/server';
import type { Post } from '../../utils/supabase/types'; // Ensure this path is correct

export async function fetchPaginatedPublishedPosts(languageId: number, page: number, limit: number) {
  const supabase = createClient();
  const offset = (page - 1) * limit;

  const { data: posts, error, count } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, language_id, status, created_at, updated_at, translation_group_id', { count: 'exact' }) // Adjust fields as needed
    .eq('status', 'published')
    .eq('language_id', languageId)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching paginated posts:", error);
    // It's good practice to return a consistent shape, even on error
    return { posts: [], totalCount: 0, error: error.message };
  }
  return { posts: posts as Post[], totalCount: count || 0, error: undefined }; // Return error: undefined on success
}

// You could also move fetchInitialPublishedPosts here if it makes sense for organization
export async function fetchInitialPublishedPosts(languageId: number, limit: number): Promise<{ posts: Post[], totalCount: number, error?: string | null }> {
  const supabase = createClient(); // This createClient is from utils/supabase/server
  const { data: posts, error, count } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, language_id, status, created_at, updated_at, translation_group_id', { count: 'exact' }) // Ensure all Post fields are selected
    .eq('status', 'published')
    .eq('language_id', languageId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching initial posts:", error);
    return { posts: [], totalCount: 0, error: error.message };
  }
  return { posts: posts as Post[], totalCount: count || 0, error: null };
}