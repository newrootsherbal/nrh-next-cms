// app/cms/posts/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Post, PageStatus } from "@/utils/supabase/types"; // Using manually defined types

// Type for insert and update for Posts
type UpsertPostPayload = {
  language_id: number;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  status: PageStatus;
  published_at?: string | null; // Expecting ISO string or null
  meta_title?: string | null;
  meta_description?: string | null;
};

export async function createPost(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated." };
  }

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    excerpt: formData.get("excerpt") as string || null,
    published_at: formData.get("published_at") as string || null, // Handle empty string as null
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
    return { error: "Missing required fields: title, slug, language, or status." };
  }

  // Validate or parse published_at if it's not empty
  let publishedAtISO: string | null = null;
  if (rawFormData.published_at) {
    const parsedDate = new Date(rawFormData.published_at);
    if (!isNaN(parsedDate.getTime())) {
      publishedAtISO = parsedDate.toISOString();
    } else {
      // return { error: "Invalid 'Published At' date format. Please use YYYY-MM-DDTHH:MM." };
      // For now, we'll allow it to pass and let DB handle it or store as is if not strictly typed in DB
      publishedAtISO = rawFormData.published_at;
    }
  }


  const postData: UpsertPostPayload = {
    ...rawFormData,
    published_at: publishedAtISO,
    author_id: user.id,
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(postData)
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { error: `Failed to create post: ${error.message}` };
  }

  revalidatePath("/cms/posts");
  if (data?.id) {
    revalidatePath(`/cms/posts/${data.id}/edit`);
    redirect(`/cms/posts/${data.id}/edit?success=Post created successfully`);
  } else {
    redirect(`/cms/posts?success=Post created successfully`);
  }
}

export async function updatePost(postId: number, formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated." };
  }

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
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
    if (!isNaN(parsedDate.getTime())) {
      publishedAtISO = parsedDate.toISOString();
    } else {
      publishedAtISO = rawFormData.published_at; // Pass as is if not parsable by JS Date
    }
  }

  const postData: Partial<UpsertPostPayload> = {
    title: rawFormData.title,
    slug: rawFormData.slug,
    language_id: rawFormData.language_id,
    excerpt: rawFormData.excerpt,
    status: rawFormData.status,
    published_at: publishedAtISO,
    meta_title: rawFormData.meta_title,
    meta_description: rawFormData.meta_description,
  };

  const { error } = await supabase
    .from("posts")
    .update(postData)
    .eq("id", postId);

  if (error) {
    console.error("Error updating post:", error);
    return { error: `Failed to update post: ${error.message}` };
  }

  revalidatePath("/cms/posts");
  revalidatePath(`/cms/posts/${postId}/edit`);
  redirect(`/cms/posts/${postId}/edit?success=Post updated successfully`);
}

export async function deletePost(postId: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    return { error: `Failed to delete post: ${error.message}` };
  }

  revalidatePath("/cms/posts");
  redirect("/cms/posts?success=Post deleted successfully");
}
