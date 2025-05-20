// app/cms/navigation/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NavigationItem, MenuLocation, Language } from "@/utils/supabase/types";
import { v4 as uuidv4 } from 'uuid'; // For generating translation_group_id

type UpsertNavigationItemPayload = {
  language_id: number;
  menu_key: MenuLocation;
  label: string;
  url: string;
  parent_id?: number | null;
  order?: number;
  page_id?: number | null;
  translation_group_id: string; // Now required
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

// Helper to generate a placeholder label for new translations
function generatePlaceholderLabel(originalLabel: string, langCode: string): string {
  return `[${langCode.toUpperCase()}] ${originalLabel}`;
}

export async function createNavigationItem(formData: FormData) {
  const supabase = createClient();

  if (!(await isAdminUser(supabase))) {
    return { error: "Unauthorized: Admin role required." };
  }

  const fromGroupId = formData.get("from_translation_group_id") as string | null;
  const targetLangIdForTranslation = formData.get("target_language_id_for_translation") as string | null;

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

  // Determine translation_group_id
  // If 'from_group_id' is provided, it means we are creating a translation for an existing group.
  // Otherwise, it's a new conceptual item, so generate a new group ID.
  const translationGroupId = fromGroupId || uuidv4();

  const navData: UpsertNavigationItemPayload = {
    ...rawFormData,
    translation_group_id: translationGroupId,
  };

  const { data: newNavItem, error } = await supabase
    .from("navigation_items")
    .insert(navData)
    .select()
    .single();

  if (error) {
    console.error("Error creating navigation item:", error);
    return { error: `Failed to create item: ${error.message}` };
  }

  let successMessage = "Navigation item created successfully.";

  // If this was the first item in a new group (i.e., fromGroupId was null),
  // and it's NOT a targeted translation creation (targetLangIdForTranslation is null),
  // then create placeholders for other languages.
  if (newNavItem && !fromGroupId && !targetLangIdForTranslation) {
    const { data: languages, error: langError } = await supabase
      .from("languages")
      .select("id, code")
      .neq("id", newNavItem.language_id); // Get other active languages

    if (langError) {
      console.error("Error fetching other languages for nav item auto-creation:", langError);
    } else if (languages && languages.length > 0) {
      let placeholderCreations = 0;
      for (const lang of languages) {
        // For placeholders, URL might be '#', page_id null, parent_id null initially.
        // User would need to edit these.
        const placeholderNavItemData: UpsertNavigationItemPayload = {
          language_id: lang.id,
          menu_key: newNavItem.menu_key,
          label: generatePlaceholderLabel(newNavItem.label, lang.code),
          url: '#', // Placeholder URL
          parent_id: null, // Placeholders are top-level initially, or require complex parent mapping
          order: newNavItem.order, // Or default to 0 for placeholders
          page_id: null,
          translation_group_id: newNavItem.translation_group_id, // Use same group ID
        };
        const { error: placeholderError } = await supabase.from("navigation_items").insert(placeholderNavItemData);
        if (placeholderError) {
          console.error(`Error auto-creating nav item for language ${lang.code}:`, placeholderError);
        } else {
          placeholderCreations++;
        }
      }
      if (placeholderCreations > 0) {
        successMessage += ` ${placeholderCreations} placeholder version(s) also created (please edit their details).`;
      }
    }
  }


  revalidatePath("/cms/navigation");
  if (newNavItem?.id) {
    revalidatePath(`/cms/navigation/${newNavItem.id}/edit`);
    redirect(`/cms/navigation/${newNavItem.id}/edit?success=${encodeURIComponent(successMessage)}`);
  } else {
    redirect(`/cms/navigation?success=${encodeURIComponent(successMessage)}`);
  }
}

export async function updateNavigationItem(itemId: number, formData: FormData) {
  const supabase = createClient();

  if (!(await isAdminUser(supabase))) {
    return { error: "Unauthorized: Admin role required." };
  }

  // Fetch existing item to ensure translation_group_id is not changed
  // and language_id is not changed (editing a specific language version)
  const { data: existingItem, error: fetchError } = await supabase
    .from("navigation_items")
    .select("translation_group_id, language_id")
    .eq("id", itemId)
    .single();

  if (fetchError || !existingItem) {
    return { error: "Original navigation item not found or error fetching it." };
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

  if (rawFormData.language_id !== existingItem.language_id) {
      return { error: "Changing the language of an existing navigation item version is not allowed. Create a new translation instead." };
  }

  const navData: Partial<Omit<UpsertNavigationItemPayload, 'translation_group_id'>> = {
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

  const { data: items, error: itemsError } = await supabase
    .from("navigation_items")
    .select("*") // Select all fields, including translation_group_id
    .eq("menu_key", menuKey)
    .eq("language_id", languageId)
    .order("parent_id", { nullsFirst: true }) // Ensure parents come before children for easier hierarchy building
    .order("order");

  if (itemsError) {
    console.error(`Error fetching navigation items for ${menuKey} (${languageCode}):`, itemsError);
    return [];
  }

  return items || [];
}
