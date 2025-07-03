// app/cms/navigation/utils.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getLanguages() {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("languages")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching languages:", error);
    throw new Error("Could not fetch languages.");
  }

  return data;
}

export async function getNavigationItems() {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("navigation_items")
    .select("id, label, language_id, menu_key, parent_id, translation_group_id")
    .order("order");

  if (error) {
    console.error("Error fetching navigation items:", error);
    throw new Error("Could not fetch navigation items.");
  }

  return data;
}

export async function getPages() {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, slug, language_id")
    .eq("status", "published")
    .order("title");

  if (error) {
    console.error("Error fetching pages:", error);
    throw new Error("Could not fetch pages.");
  }

  return data;
}