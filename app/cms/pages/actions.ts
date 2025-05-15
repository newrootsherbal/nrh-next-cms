// app/cms/pages/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Page, PageStatus, Language } from "@/utils/supabase/types";
import { v4 as uuidv4 } from 'uuid'; // For generating translation_group_id

// Helper function to generate a unique slug (simple version, needs improvement for production)
// For auto-generated placeholders, to avoid immediate collision before user edits.
function generatePlaceholderSlug(title: string, langCode: string): string {
  const baseSlug = title.toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .substring(0, 50); // Truncate
  return `${baseSlug}-${langCode}-${uuidv4().substring(0, 4)}`;
}

type UpsertPagePayload = {
  language_id: number;
  author_id: string | null;
  title: string;
  slug: string; // Now language-specific
  status: PageStatus;
  meta_title?: string | null;
  meta_description?: string | null;
  translation_group_id: string; // UUID
};

export async function createPage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "User not authenticated." };

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string, // User provides initial slug for this language
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
    return { error: "Missing required fields: title, slug, language, or status." };
  }

  const newTranslationGroupId = uuidv4(); // Generate a new group ID for this new conceptual page

  const pageData: UpsertPagePayload = {
    ...rawFormData,
    author_id: user.id,
    translation_group_id: newTranslationGroupId,
  };

  const { data: newPage, error: createError } = await supabase
    .from("pages")
    .insert(pageData)
    .select("id, title, slug, language_id, translation_group_id") // Select fields needed for placeholders
    .single();

  if (createError) {
    console.error("Error creating page:", createError);
    if (createError.code === '23505' && createError.message.includes('pages_language_id_slug_key')) {
        return { error: `The slug "${pageData.slug}" already exists for the selected language. Please use a unique slug.`};
    }
    return { error: `Failed to create page: ${createError.message}` };
  }

  let successMessage = "Page created successfully.";

  if (newPage) {
    const { data: languages, error: langError } = await supabase
      .from("languages")
      .select("id, code")
      .neq("id", newPage.language_id); // Get other active languages

    if (langError) {
      console.error("Error fetching other languages for auto-creation:", langError);
    } else if (languages && languages.length > 0) {
      let placeholderCreations = 0;
      for (const lang of languages) {
        const placeholderSlug = generatePlaceholderSlug(newPage.title, lang.code);
        const placeholderPageData: Omit<UpsertPagePayload, 'author_id'> & {author_id?: string | null} = {
          language_id: lang.id,
          title: `[${lang.code.toUpperCase()}] ${newPage.title}`,
          slug: placeholderSlug, // Placeholder slug, user should update this
          status: 'draft',
          meta_title: null,
          meta_description: null,
          translation_group_id: newPage.translation_group_id, // Use same group ID
          author_id: user.id,
        };
        const { error: placeholderError } = await supabase.from("pages").insert(placeholderPageData);
        if (placeholderError) {
          console.error(`Error auto-creating page for language ${lang.code} (slug: ${placeholderSlug}):`, placeholderError);
        } else {
          placeholderCreations++;
        }
      }
      if (placeholderCreations > 0) {
        successMessage += ` ${placeholderCreations} placeholder version(s) also created (draft status, please edit their slugs and content).`;
      }
    }
  }

  revalidatePath("/cms/pages");
  if (newPage?.slug) revalidatePath(`/${newPage.slug}`); // Revalidate the new page's public path

  if (newPage?.id) {
    redirect(`/cms/pages/${newPage.id}/edit?success=${encodeURIComponent(successMessage)}`);
  } else {
    redirect(`/cms/pages?success=${encodeURIComponent(successMessage)}`);
  }
}

export async function updatePage(pageId: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "User not authenticated." };

  // Fetch the existing page to get its translation_group_id (it should not change)
  const { data: existingPage, error: fetchError } = await supabase
    .from("pages")
    .select("translation_group_id, slug") // also fetch old slug for revalidation
    .eq("id", pageId)
    .single();

  if (fetchError || !existingPage) {
    return { error: "Original page not found or error fetching it." };
  }

  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string, // User can change the slug for this specific language version
    language_id: parseInt(formData.get("language_id") as string, 10), // Usually lang_id won't change on edit form
    status: formData.get("status") as PageStatus,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
     return { error: "Missing required fields: title, slug, language, or status." };
  }

  const pageUpdateData: Partial<Omit<UpsertPagePayload, 'translation_group_id' | 'author_id'>> = {
    title: rawFormData.title,
    slug: rawFormData.slug,
    language_id: rawFormData.language_id,
    status: rawFormData.status,
    meta_title: rawFormData.meta_title,
    meta_description: rawFormData.meta_description,
  };

  const { error: updateError } = await supabase
    .from("pages")
    .update(pageUpdateData)
    .eq("id", pageId);

  if (updateError) {
    console.error("Error updating page:", updateError);
     if (updateError.code === '23505' && updateError.message.includes('pages_language_id_slug_key')) {
        return { error: `The slug "${pageUpdateData.slug}" already exists for the selected language. Please use a unique slug.`};
    }
    return { error: `Failed to update page: ${updateError.message}` };
  }

  revalidatePath("/cms/pages");
  if (existingPage.slug) revalidatePath(`/${existingPage.slug}`); // Revalidate old public path
  if (rawFormData.slug && rawFormData.slug !== existingPage.slug) {
      revalidatePath(`/${rawFormData.slug}`); // Revalidate new public path if slug changed
  }
  revalidatePath(`/cms/pages/${pageId}/edit`);
  redirect(`/cms/pages/${pageId}/edit?success=Page updated successfully`);
}

// deletePage action remains largely the same, but revalidation path needs to use the specific slug
export async function deletePage(pageId: number) {
  const supabase = createClient();
   const { data: pageToDelete, error: fetchErr } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", pageId)
    .single();

  if (fetchErr || !pageToDelete) {
      return { error: "Page not found or error fetching details for deletion."};
  }

  const { error } = await supabase.from("pages").delete().eq("id", pageId);

  if (error) {
    console.error("Error deleting page:", error);
    return { error: `Failed to delete page: ${error.message}` };
  }

  revalidatePath("/cms/pages");
  if (pageToDelete.slug) revalidatePath(`/${pageToDelete.slug}`); // Revalidate the public path
  redirect("/cms/pages?success=Page deleted successfully");
}