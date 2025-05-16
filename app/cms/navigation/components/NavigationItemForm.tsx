// app/cms/navigation/components/NavigationItemForm.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
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
import type { NavigationItem, MenuLocation, Language, Page } from "@/utils/supabase/types";
import { useAuth } from "@/context/AuthContext";
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
  const [languagesResult, pagesResult, parentItemsResult] = await Promise.all([
    getActiveLanguagesClientSide(),
    currentLanguageId ? supabase.from("pages").select("id, title, slug").eq("language_id", currentLanguageId).order("title") : Promise.resolve({ data: [], error: null }),
    (currentLanguageId && currentMenuKey) ? supabase
      .from("navigation_items")
      .select("id, label")
      .eq("language_id", currentLanguageId)
      .eq("menu_key", currentMenuKey)
      .neq("id", currentItemId || 0) // Exclude self
      .is("parent_id", null) // Fetch only top-level items as potential parents for simplicity, or implement recursive fetching
      .order("order")
      : Promise.resolve({ data: [], error: null })
  ]);

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

  const [label, setLabel] = useState(item?.label || "");
  const [url, setUrl] = useState(item?.url || "");
  const [languageId, setLanguageId] = useState<string>(item?.language_id?.toString() || "");
  const [menuKey, setMenuKey] = useState<MenuLocation | "">(item?.menu_key || "");
  const [order, setOrder] = useState<string>(item?.order?.toString() || "0");
  const [parentId, setParentId] = useState<string>(item?.parent_id?.toString() || "");
  const [pageId, setPageId] = useState<string>(item?.page_id?.toString() || "");

  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [availablePages, setAvailablePages] = useState<Pick<Page, 'id' | 'title' | 'slug'>[]>([]);
  const [availableParentItems, setAvailableParentItems] = useState<Pick<NavigationItem, 'id' | 'label'>[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const successMessage = searchParams.get('success');
    const errorMessage = searchParams.get('error');
    if (successMessage) setFormMessage({ type: 'success', text: successMessage });
    else if (errorMessage) setFormMessage({ type: 'error', text: errorMessage });
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      const sources = await getFormDataSources(
        languageId ? parseInt(languageId) : undefined,
        menuKey || undefined,
        item?.id
      );
      setAvailableLanguages(sources.languages);
      setAvailablePages(sources.pages);
      setAvailableParentItems(sources.parentItems);

      if (!item?.language_id && sources.languages.length > 0) {
        const defaultLang = sources.languages.find(l => l.is_default) || sources.languages[0];
        if (defaultLang) setLanguageId(defaultLang.id.toString());
      }
      setDataLoading(false);
    }
    fetchData();
  }, [item?.id, item?.language_id, languageId, menuKey]); // Refetch if language or menuKey changes for parent/page lists

  const handlePageSelect = (selectedPageId: string) => {
    setPageId(selectedPageId);
    const selectedPage = availablePages.find(p => p.id.toString() === selectedPageId);
    if (selectedPage) {
      // Assuming language prefix is handled by Next.js i18n routing or you construct it based on language
      setUrl(`/${selectedPage.slug}`); // Or construct full path with language if needed
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await formAction(formData);
      if (result?.error) setFormMessage({ type: 'error', text: result.error });
    });
  };

  if (authLoading || !isAdmin) { // Navigation is admin-only
    return <div>Access Denied. Admin role required.</div>;
  }
  if (dataLoading) return <div>Loading form data...</div>;


  const menuLocations: MenuLocation[] = ['HEADER', 'FOOTER'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formMessage && (
        <div className={`p-3 rounded-md text-sm ${formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {formMessage.text}
        </div>
      )}
      <div>
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" value={label} onChange={(e) => setLabel(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="page_id">Link to Internal Page (Optional)</Label>
        <Select name="page_id" value={pageId} onValueChange={handlePageSelect}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="None (Manual URL)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="___NONE___">None (Manual URL)</SelectItem>
            {availablePages.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.title} ({p.slug})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Selecting a page will auto-fill the URL (can be overridden).</p>
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" value={url} onChange={(e) => setUrl(e.target.value)} required className="mt-1" placeholder="/about-us or https://example.com" />
      </div>
      <div>
        <Label htmlFor="language_id">Language</Label>
        <Select name="language_id" value={languageId} onValueChange={setLanguageId} required>
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
        <Select name="menu_key" value={menuKey} onValueChange={(val) => setMenuKey(val as MenuLocation)} required>
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
        <Label htmlFor="parent_id">Parent Item (Optional - for submenus)</Label>
        <Select name="parent_id" value={parentId} onValueChange={setParentId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="___NONE___">None (Top Level)</SelectItem>
            {availableParentItems.map((parent) => (
              <SelectItem key={parent.id} value={parent.id.toString()}>{parent.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <p className="text-xs text-muted-foreground mt-1">Select a parent if this is a sub-menu item. Parents must be in the same language and menu location.</p>
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/cms/navigation")} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending || dataLoading}>
          {isPending ? "Saving..." : actionButtonText}
        </Button>
      </div>
    </form>
  );
}
