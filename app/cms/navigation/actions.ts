// app/cms/navigation/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NavigationItem, MenuLocation } from "@/utils/supabase/types";

type UpsertNavigationItemPayload = {
  language_id: number;
  menu_key: MenuLocation;
  label: string;
  url: string;
  parent_id?: number | null;
  order?: number; // Optional, default to 0 if not provided
  page_id?: number | null;
};

// Helper to check admin role
async function isAdminUser(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "ADMIN";
}

export async function createNavigationItem(formData: FormData) {
  const supabase = createClient();

  if (!(await isAdminUser(supabase))) {
    return { error: "Unauthorized: Admin role required." };
  }

  const rawFormData = {
    label: formData.get("label") as string,
    url: formData.get("url") as string,
    language_id: parseInt(formData.get("language_id") as string, 10),
    menu_key: formData.get("menu_key") as MenuLocation,
    order: parseInt(formData.get("order") as string, 10) || 0,
    parent_id: formData.get("parent_id") && formData.get("parent_id") !== "___NONE___" ? parseInt(formData.get("parent_id") as string, 10) : null,
    page_id: formData.get("page_id") && formData.get("page_id") !== "___NONE___" ? parseInt(formData.get("page_id") as string, 10) : null,
  };

  if (!rawFormData.label || !rawFormData.url || isNaN(rawFormData.language_id) || !rawFormData.menu_key) {
    return { error: "Missing required fields: label, URL, language, or menu key." };
  }

  const navData: UpsertNavigationItemPayload = {
    ...rawFormData,
  };

  const { data, error } = await supabase
    .from("navigation_items")
    .insert(navData)
    .select()
    .single();

  if (error) {
    console.error("Error creating navigation item:", error);
    return { error: `Failed to create item: ${error.message}` };
  }

  revalidatePath("/cms/navigation");
  if (data?.id) {
    revalidatePath(`/cms/navigation/${data.id}/edit`);
    redirect(`/cms/navigation/${data.id}/edit?success=Item created successfully`);
  } else {
    redirect(`/cms/navigation?success=Item created successfully`);
  }
}

export async function updateNavigationItem(itemId: number, formData: FormData) {
  const supabase = createClient();

  if (!(await isAdminUser(supabase))) {
    return { error: "Unauthorized: Admin role required." };
  }

  const rawFormData = {
    label: formData.get("label") as string,
    url: formData.get("url") as string,
    language_id: parseInt(formData.get("language_id") as string, 10),
    menu_key: formData.get("menu_key") as MenuLocation,
    order: parseInt(formData.get("order") as string, 10) || 0,
    parent_id: formData.get("parent_id") && formData.get("parent_id") !== "___NONE___" ? parseInt(formData.get("parent_id") as string, 10) : null,
    page_id: formData.get("page_id") && formData.get("page_id") !== "___NONE___" ? parseInt(formData.get("page_id") as string, 10) : null,
  };

   if (!rawFormData.label || !rawFormData.url || isNaN(rawFormData.language_id) || !rawFormData.menu_key) {
     return { error: "Missing required fields: label, URL, language, or menu key." };
  }

  const navData: Partial<UpsertNavigationItemPayload> = {
    ...rawFormData,
  };

  const { error } = await supabase
    .from("navigation_items")
    .update(navData)
    .eq("id", itemId);

  if (error) {
    console.error("Error updating navigation item:", error);
    return { error: `Failed to update item: ${error.message}` };
  }

  revalidatePath("/cms/navigation");
  revalidatePath(`/cms/navigation/${itemId}/edit`);
  redirect(`/cms/navigation/${itemId}/edit?success=Item updated successfully`);
}

export async function deleteNavigationItem(itemId: number) {
  const supabase = createClient();

  if (!(await isAdminUser(supabase))) {
    return { error: "Unauthorized: Admin role required." };
  }

  // Before deleting, check if any other items have this item as a parent_id
  // and set their parent_id to null to avoid foreign key constraint issues if not using ON DELETE SET NULL for parent_id.
  // The current schema uses ON DELETE CASCADE for parent_id, so children will be deleted.
  // If you want to orphan children instead, you'd modify the FK or handle it here.

  const { error } = await supabase
    .from("navigation_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting navigation item:", error);
    return { error: `Failed to delete item: ${error.message}` };
  }

  revalidatePath("/cms/navigation");
  redirect("/cms/navigation?success=Item deleted successfully");
}

export async function getNavigationMenu(menuKey: MenuLocation, languageCode: string): Promise<NavigationItem[]> {
  const supabase = createClient();

  // First, get the language ID from the language code
  const { data: language, error: langError } = await supabase
    .from("languages")
    .select("id")
    .eq("code", languageCode)
    .single();

  if (langError || !language) {
    console.error(`Error fetching language ID for code ${languageCode}:`, langError);
    return [];
  }

  const languageId = language.id;

  // Then, fetch navigation items for that menu key and language ID
  // For simplicity, this example fetches only top-level items (parent_id is null)
  // and orders them. You might want to fetch all and build hierarchy in the component.
  const { data: items, error: itemsError } = await supabase
    .from("navigation_items")
    .select("*")
    .eq("menu_key", menuKey)
    .eq("language_id", languageId)
    // .is("parent_id", null) // Uncomment to fetch only top-level items initially
    .order("order");

  if (itemsError) {
    console.error(`Error fetching navigation items for ${menuKey} (${languageCode}):`, itemsError);
    return [];
  }

  return items || [];
}
