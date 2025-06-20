// app/cms/navigation/components/NavigationItemForm.tsx
"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/utils/supabase/types";
import { useAuth } from "@/context/AuthContext";

type NavigationItem = Database['public']['Tables']['navigation_items']['Row'];
type MenuLocation = Database['public']['Enums']['menu_location'];
type Language = Database['public']['Tables']['languages']['Row'];
type Page = Database['public']['Tables']['pages']['Row'];
import { getActiveLanguagesClientSide, createClient as createBrowserClient } from "@/utils/supabase/client";

interface NavigationItemFormProps {
  item?: NavigationItem | null;
  formAction: (formData: FormData) => Promise<{ error?: string } | void>;
  actionButtonText?: string;
  isEditing?: boolean;
}

// Helper to fetch potential parent items and pages for dropdowns
async function getFormDataSources(currentLanguageId?: number, currentMenuKey?: MenuLocation, currentItemId?: number) {
  const supabase = createBrowserClient();
  // Fetch all active languages
  const languagesResult = await getActiveLanguagesClientSide();

  // Fetch pages only if a language ID is available
  const pagesResult = currentLanguageId
    ? await supabase.from("pages").select("id, title, slug").eq("language_id", currentLanguageId).order("title")
    : { data: [], error: null };

  // Fetch parent items only if language ID and menu key are available
  const parentItemsResult = (currentLanguageId && currentMenuKey)
    ? await supabase
        .from("navigation_items")
        .select("id, label, translation_group_id") // Also fetch translation_group_id for parents
        .eq("language_id", currentLanguageId)
        .eq("menu_key", currentMenuKey)
        .neq("id", currentItemId || 0) // Exclude self if editing
        // .is("parent_id", null) // Consider fetching all, or implement smarter parent selection
        .order("order")
    : { data: [], error: null };

  return {
    languages: languagesResult || [],
    pages: pagesResult.data || [],
    parentItems: parentItemsResult.data || [],
  };
}


export default function NavigationItemForm({
  item,
  formAction,
  actionButtonText = "Save Item",
  isEditing = false,
}: NavigationItemFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // For creating a new translation based on an existing item
  const fromTranslationGroupId = searchParams.get("from_translation_group_id");
  const targetLanguageIdForTranslation = searchParams.get("target_language_id_for_translation");
  const initialMenuKeyFromParam = searchParams.get("menu_key") as MenuLocation | null;
  const originalLabelFromParam = searchParams.get("original_label");


  const [label, setLabel] = useState(item?.label || (originalLabelFromParam ? `[Translate] ${originalLabelFromParam}` : ""));
  const [url, setUrl] = useState(item?.url || (originalLabelFromParam ? "#" : "")); // Default to # if translating
  const [languageId, setLanguageId] = useState<string>(
    targetLanguageIdForTranslation || item?.language_id?.toString() || ""
  );
  const [menuKey, setMenuKey] = useState<MenuLocation | "">(
    initialMenuKeyFromParam || item?.menu_key || ""
  );
  const [order, setOrder] = useState<string>(item?.order?.toString() || "0");
  const [parentId, setParentId] = useState<string>(item?.parent_id?.toString() || "");
  const [pageId, setPageId] = useState<string>(item?.page_id?.toString() || "");

  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [availablePages, setAvailablePages] = useState<Pick<Page, 'id' | 'title' | 'slug'>[]>([]);
  const [availableParentItems, setAvailableParentItems] = useState<Pick<NavigationItem, 'id' | 'label' | 'translation_group_id'>[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const successMessage = searchParams.get('success');
    const errorMessage = searchParams.get('error');
    if (successMessage) setFormMessage({ type: 'success', text: decodeURIComponent(successMessage) });
    else if (errorMessage) setFormMessage({ type: 'error', text: decodeURIComponent(errorMessage) });
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      const currentLangId = languageId ? parseInt(languageId) : undefined;
      const currentMenuKeyVal = menuKey || undefined;

      const sources = await getFormDataSources(
        currentLangId,
        currentMenuKeyVal,
        item?.id
      );
      setAvailableLanguages(sources.languages);
      setAvailablePages(sources.pages);
      setAvailableParentItems(sources.parentItems);

      // If creating new (not editing) and no language ID is set yet (and not creating a specific translation)
      if (!isEditing && !languageId && !targetLanguageIdForTranslation && sources.languages.length > 0) {
        const defaultLang = sources.languages.find(l => l.is_default) || sources.languages[0];
        if (defaultLang) setLanguageId(defaultLang.id.toString());
      }
      setDataLoading(false);
    }
    fetchData();
  }, [item?.id, languageId, menuKey, isEditing, targetLanguageIdForTranslation]);

  const handlePageSelect = (selectedPageId: string) => {
    setPageId(selectedPageId);
    const selectedPage = availablePages.find(p => p.id.toString() === selectedPageId);
    if (selectedPage) {
      setUrl(`/${selectedPage.slug}`);
    } else if (selectedPageId === "___NONE___") {
      setUrl("#"); // Reset URL if "None" is selected, or keep previous manual URL
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    const formData = new FormData(event.currentTarget);

    // Append translation group ID if creating a new translation from an existing group
    if (fromTranslationGroupId && !isEditing) {
        formData.append("from_translation_group_id", fromTranslationGroupId);
    }
    if (targetLanguageIdForTranslation && !isEditing) {
        formData.append("target_language_id_for_translation", targetLanguageIdForTranslation);
    }


    startTransition(async () => {
      const result = await formAction(formData);
      if (result?.error) setFormMessage({ type: 'error', text: result.error });
    });
  };

  if (authLoading || !isAdmin) {
    return <div>Access Denied. Admin role required.</div>;
  }
  if (dataLoading && !item) return <div>Loading form data...</div>; // Show loading only if not editing an existing item with data

  const menuLocations: MenuLocation[] = ['HEADER', 'FOOTER', 'SIDEBAR'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formMessage && (
        <div className={`p-3 rounded-md text-sm ${formMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {formMessage.text}
        </div>
      )}

      {/* Hidden input for from_translation_group_id if present in URL params and not editing */}
      {!isEditing && fromTranslationGroupId && (
        <input type="hidden" name="from_translation_group_id" value={fromTranslationGroupId} />
      )}
      {/* Hidden input for target_language_id_for_translation if present and not editing */}
       {!isEditing && targetLanguageIdForTranslation && (
        <input type="hidden" name="target_language_id_for_translation" value={targetLanguageIdForTranslation} />
      )}


      <div>
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" value={label} onChange={(e) => setLabel(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="page_id">Link to Internal Page (Optional)</Label>
        <Select name="page_id" value={pageId} onValueChange={handlePageSelect} disabled={!languageId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="None (Manual URL)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="___NONE___">None (Manual URL)</SelectItem>
            {availablePages.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.title} ({p.slug})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Selecting a page will auto-fill the URL (can be overridden). Requires language to be selected first.</p>
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" value={url} onChange={(e) => setUrl(e.target.value)} required className="mt-1" placeholder="/about-us or https://example.com" />
      </div>
      <div>
        <Label htmlFor="language_id">Language</Label>
        <Select
            name="language_id"
            value={languageId}
            onValueChange={(val) => {
                setLanguageId(val);
                // Reset page and parent item selection if language changes, as they are language-specific
                setPageId("");
                setParentId("");
                if (url.startsWith("/")) setUrl("#"); // Reset relative URL if it was page-linked
            }}
            required
            disabled={isEditing && !!targetLanguageIdForTranslation} // Disable if creating a specific translation or editing
        >
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name} ({lang.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="menu_key">Menu Location</Label>
        <Select
            name="menu_key"
            value={menuKey}
            onValueChange={(val) => {
                setMenuKey(val as MenuLocation);
                setParentId(""); // Reset parent if menu key changes
            }}
            required
            disabled={isEditing && !!initialMenuKeyFromParam} // Disable if creating translation for specific menu
        >
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select menu location" /></SelectTrigger>
          <SelectContent>
            {menuLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc.charAt(0) + loc.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="order">Order</Label>
        <Input id="order" name="order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="parent_id">Parent Item (Optional)</Label>
        <Select name="parent_id" value={parentId} onValueChange={setParentId} disabled={!languageId || !menuKey}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="___NONE___">None (Top Level)</SelectItem>
            {availableParentItems.map((parent) => (
              <SelectItem key={parent.id} value={parent.id.toString()}>{parent.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <p className="text-xs text-muted-foreground mt-1">Parents must be in the same language and menu location.</p>
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/cms/navigation")} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending || dataLoading || !languageId || !menuKey}>
          {isPending ? "Saving..." : actionButtonText}
        </Button>
      </div>
    </form>
  );
}
