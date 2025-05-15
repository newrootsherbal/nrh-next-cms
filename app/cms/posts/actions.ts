// app/cms/posts/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Post, PageStatus, Language } from "@/utils/supabase/types"; // Ensure Language type is available
import { v4 as uuidv4 } from 'uuid'; // For generating translation_group_id and unique parts of placeholder slugs

// Helper function to generate a unique placeholder slug for new translations
// This aims to avoid immediate collisions before a user manually sets a proper translated slug.
function generatePlaceholderSlug(title: string, langCode: string): string {
  const baseSlug = title.toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars (alphanumeric, underscore, hyphen)
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 70); // Truncate to a reasonable length
  return `${baseSlug}-${langCode}-${uuidv4().substring(0, 6)}`; // Add lang code and short unique ID
}

type UpsertPostPayload = {
  language_id: number;
  author_id: string | null;
  title: string;
  slug: string; // Now language-specific
  excerpt?: string | null;
  status: PageStatus;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  translation_group_id: string; // UUID
};

export async function createPost(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated." };
  }

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string, // User provides initial slug for this language
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    excerpt: formData.get("excerpt") as string || null,
    published_at: formData.get("published_at") as string || null,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
    return { error: "Missing required fields: title, slug, language, or status." };
  }

  let publishedAtISO: string | null = null;
  if (rawFormData.published_at) {
    const parsedDate = new Date(rawFormData.published_at);
    if (!isNaN(parsedDate.getTime())) publishedAtISO = parsedDate.toISOString();
    else publishedAtISO = rawFormData.published_at; // Pass as is if format is unexpected by JS Date
  }

  const newTranslationGroupId = uuidv4(); // Generate a new group ID for this new conceptual post

  const postData: UpsertPostPayload = {
    ...rawFormData,
    published_at: publishedAtISO,
    author_id: user.id,
    translation_group_id: newTranslationGroupId,
  };

  const { data: newPost, error: createError } = await supabase
    .from("posts")
    .insert(postData)
    .select("id, title, slug, language_id, translation_group_id") // Select fields needed for placeholders
    .single();

  if (createError) {
    console.error("Error creating post:", createError);
    if (createError.code === '23505' && createError.message.includes('posts_language_id_slug_key')) {
        return { error: `The slug "${postData.slug}" already exists for the selected language. Please use a unique slug.`};
    }
    return { error: `Failed to create post: ${createError.message}` };
  }

  let successMessage = "Post created successfully.";

  if (newPost) {
    const { data: languages, error: langError } = await supabase
      .from("languages")
      .select("id, code")
      .neq("id", newPost.language_id); // Get other active languages

    if (langError) {
      console.error("Error fetching other languages for post auto-creation:", langError);
    } else if (languages && languages.length > 0) {
      let placeholderCreations = 0;
      for (const lang of languages) {
        const placeholderSlug = generatePlaceholderSlug(newPost.title, lang.code);
        const placeholderPostData: Omit<UpsertPostPayload, 'author_id'> & {author_id?: string | null} = {
          language_id: lang.id,
          title: `[${lang.code.toUpperCase()}] ${newPost.title}`,
          slug: placeholderSlug, // Unique placeholder slug
          status: 'draft',
          published_at: null,
          excerpt: `Placeholder for ${lang.code.toUpperCase()} translation. Original excerpt: ${postData.excerpt || ''}`.substring(0, 250),
          meta_title: null,
          meta_description: null,
          translation_group_id: newPost.translation_group_id, // Use same group ID
          author_id: user.id,
        };
        const { error: placeholderError } = await supabase.from("posts").insert(placeholderPostData);
        if (placeholderError) {
          console.error(`Error auto-creating post for language ${lang.code} (slug: ${placeholderSlug}):`, placeholderError);
        } else {
          placeholderCreations++;
        }
      }
      if (placeholderCreations > 0) {
        successMessage += ` ${placeholderCreations} placeholder version(s) also created (draft status, please edit their slugs and content).`;
      }
    }
  }

  revalidatePath("/cms/posts");
  if (newPost?.slug) revalidatePath(`/blog/${newPost.slug}`); // Revalidate the new post's public path

  if (newPost?.id) {
    redirect(`/cms/posts/${newPost.id}/edit?success=${encodeURIComponent(successMessage)}`);
  } else {
    redirect(`/cms/posts?success=${encodeURIComponent(successMessage)}`);
  }
}

export async function updatePost(postId: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "User not authenticated." };

  const { data: existingPost, error: fetchError } = await supabase
    .from("posts")
    .select("slug, translation_group_id, language_id") // language_id to ensure it's not changed
    .eq("id", postId)
    .single();

  if (fetchError || !existingPost) {
    return { error: "Original post not found or error fetching it." };
  }

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string, // User can change the slug for this specific language version
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    excerpt: formData.get("excerpt") as string || null,
    published_at: formData.get("published_at") as string || null,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
     return { error: "Missing required fields: title, slug, language, or status." };
  }
  if (rawFormData.language_id !== existingPost.language_id) {
      return { error: "Changing the language of an existing post version is not allowed. Create a new translation instead." };
  }


  let publishedAtISO: string | null = null;
  if (rawFormData.published_at) {
    const parsedDate = new Date(rawFormData.published_at);
    if (!isNaN(parsedDate.getTime())) publishedAtISO = parsedDate.toISOString();
    else publishedAtISO = rawFormData.published_at;
  }

  // translation_group_id and author_id should not be changed on update by this form
  const postUpdateData: Partial<Omit<UpsertPostPayload, 'translation_group_id' | 'author_id'>> = {
    title: rawFormData.title,
    slug: rawFormData.slug,
    language_id: rawFormData.language_id, // Should match existingPost.language_id
    excerpt: rawFormData.excerpt,
    status: rawFormData.status,
    published_at: publishedAtISO,
    meta_title: rawFormData.meta_title,
    meta_description: rawFormData.meta_description,
  };

  const { error: updateError } = await supabase
    .from("posts")
    .update(postUpdateData)
    .eq("id", postId);

  if (updateError) {
    console.error("Error updating post:", updateError);
    if (updateError.code === '23505' && updateError.message.includes('posts_language_id_slug_key')) {
        return { error: `The slug "${postUpdateData.slug}" already exists for the selected language. Please use a unique slug.`};
    }
    return { error: `Failed to update post: ${updateError.message}` };
  }

  revalidatePath("/cms/posts");
  if (existingPost.slug) revalidatePath(`/blog/${existingPost.slug}`); // Revalidate old public path
  if (rawFormData.slug && rawFormData.slug !== existingPost.slug) {
      revalidatePath(`/blog/${rawFormData.slug}`); // Revalidate new public path if slug changed
  }
  revalidatePath(`/cms/posts/${postId}/edit`);
  redirect(`/cms/posts/${postId}/edit?success=Post updated successfully`);
}

export async function deletePost(postId: number) {
  const supabase = createClient();
  // Fetch the post to get its slug for revalidation and translation_group_id for potential cleanup
  const { data: postToDelete, error: fetchErr } = await supabase
    .from("posts")
    .select("slug, translation_group_id, language_id")
    .eq("id", postId)
    .single();

  if (fetchErr || !postToDelete) {
      return { error: "Post not found or error fetching details for deletion."};
  }

  // Check if this is the last post in its translation group.
  // If so, deleting it means the conceptual post is gone.
  // If not, other language versions still exist.
  const { count, error: countError } = await supabase
    .from("posts")
    .select('*', { count: 'exact', head: true })
    .eq("translation_group_id", postToDelete.translation_group_id);

  if (countError) {
      console.error("Error counting translations:", countError);
      // Proceed with deletion but log error
  }

  const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);

  if (deleteError) {
    console.error("Error deleting post:", deleteError);
    return { error: `Failed to delete post: ${deleteError.message}` };
  }

  revalidatePath("/cms/posts");
  if (postToDelete.slug) revalidatePath(`/blog/${postToDelete.slug}`);

  let successMessage = "Post version deleted successfully.";
  if (count === 1) {
      successMessage = "Post (including all its translations as this was the last one) deleted successfully.";
  }

  redirect(`/cms/posts?success=${encodeURIComponent(successMessage)}`);
}
