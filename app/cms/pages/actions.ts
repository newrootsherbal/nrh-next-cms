// app/cms/pages/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PageStatus } from "@/utils/supabase/types"; // Using manually defined types for now

// Type for insert and update, omitting auto-generated fields
// Ideally, this would come from generated Supabase types: Database['public']['Tables']['pages']['Insert'] / ['Update']
type UpsertPagePayload = {
  language_id: number;
  author_id: string | null; // Assuming author_id is the current user's ID
  title: string;
  slug: string;
  status: PageStatus;
  meta_title?: string | null;
  meta_description?: string | null;
};

export async function createPage(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated." };
  }

  // Basic data extraction, no Zod for now as requested
  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  // Basic validation
  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
    return { error: "Missing required fields: title, slug, language, or status." };
  }

  const pageData: UpsertPagePayload = {
    ...rawFormData,
    author_id: user.id, // Set the author to the current user
  };

  const { data, error } = await supabase
    .from("pages")
    .insert(pageData)
    .select()
    .single();

  if (error) {
    console.error("Error creating page:", error);
    return { error: `Failed to create page: ${error.message}` };
  }

  revalidatePath("/cms/pages"); // Revalidate the list page
  if (data?.id) {
    revalidatePath(`/cms/pages/${data.id}/edit`); // Revalidate the edit page if needed
    redirect(`/cms/pages/${data.id}/edit?success=Page created successfully`); // Redirect to edit page
  } else {
    redirect(`/cms/pages?success=Page created successfully`);
  }
}

export async function updatePage(pageId: number, formData: FormData) {
  const supabase = createClient();

   const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated." };
  }

  // Basic data extraction
  const rawFormData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    language_id: parseInt(formData.get("language_id") as string, 10),
    status: formData.get("status") as PageStatus,
    meta_title: formData.get("meta_title") as string || null,
    meta_description: formData.get("meta_description") as string || null,
  };

  if (!rawFormData.title || !rawFormData.slug || isNaN(rawFormData.language_id) || !rawFormData.status) {
     return { error: "Missing required fields: title, slug, language, or status." };
  }

  // Construct the update payload, excluding fields like author_id if it shouldn't be changed on update
  const pageData: Partial<UpsertPagePayload> = {
    title: rawFormData.title,
    slug: rawFormData.slug,
    language_id: rawFormData.language_id,
    status: rawFormData.status,
    meta_title: rawFormData.meta_title,
    meta_description: rawFormData.meta_description,
    // updated_at will be handled by the database trigger
  };


  const { error } = await supabase
    .from("pages")
    .update(pageData)
    .eq("id", pageId);

  if (error) {
    console.error("Error updating page:", error);
    return { error: `Failed to update page: ${error.message}` };
  }

  revalidatePath("/cms/pages");
  revalidatePath(`/cms/pages/${pageId}/edit`);
  // Instead of redirecting, we might want to return a success message
  // that the form component can display.
  // For now, redirecting back to the edit page with a query param.
  redirect(`/cms/pages/${pageId}/edit?success=Page updated successfully`);
}

export async function deletePage(pageId: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    console.error("Error deleting page:", error);
    return { error: `Failed to delete page: ${error.message}` };
  }

  revalidatePath("/cms/pages");
  // No redirect here, the list page will just update.
  // Or redirect to the list page if called from an edit page.
  redirect("/cms/pages?success=Page deleted successfully");
}
