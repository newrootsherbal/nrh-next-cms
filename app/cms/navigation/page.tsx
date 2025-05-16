// app/cms/navigation/page.tsx
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, ListTree, ArrowDownUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { deleteNavigationItem } from "./actions"; // No longer needed directly here
import type { NavigationItem, Language, MenuLocation } from "@/utils/supabase/types";
import { getActiveLanguagesServerSide } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import DeleteNavItemButton from "./components/DeleteNavItemButton"; // Import the new component

interface NavItemWithDetails extends NavigationItem {
  languageCode: string;
  parentLabel?: string | null;
  pageSlug?: string | null;
}

async function getNavigationItemsWithDetails(): Promise<NavItemWithDetails[]> {
  const supabase = createClient();
  const languages = await getActiveLanguagesServerSide();
  const langMap = new Map(languages.map(l => [l.id, l.code]));

  // Fetch all items, pages for linking, and self for parent labels
  const { data: items, error: itemsError } = await supabase
    .from("navigation_items")
    .select("*, pages (slug)") // Fetch linked page slug directly
    .order("menu_key")
    .order("language_id")
    .order("parent_id", { nullsFirst: true })
    .order("order");

  if (itemsError) {
    console.error("Error fetching navigation items:", itemsError);
    return [];
  }
  if (!items) return [];

  // Create a map for quick parent label lookup
  const itemLabelMap = new Map(items.map(item => [item.id, item.label]));

  return items.map(item => ({
    ...item,
    languageCode: langMap.get(item.language_id)?.toUpperCase() || 'N/A',
    parentLabel: item.parent_id ? itemLabelMap.get(item.parent_id) : null,
    // @ts-ignore Supabase JS SDK might type joined tables as arrays if not single
    pageSlug: item.pages?.slug 
  }));
}

export default async function CmsNavigationListPage() {
  const navItems = await getNavigationItemsWithDetails();

  // Group items by menu_key and then by language for display
  const groupedItems: Record<string, Record<string, NavItemWithDetails[]>> = {};
  navItems.forEach(item => {
    if (!groupedItems[item.menu_key]) {
      groupedItems[item.menu_key] = {};
    }
    if (!groupedItems[item.menu_key][item.languageCode]) {
      groupedItems[item.menu_key][item.languageCode] = [];
    }
    groupedItems[item.menu_key][item.languageCode].push(item);
  });


  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manage Navigation</h1>
        <Link href="/cms/navigation/new">
          <Button variant="default">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Item
          </Button>
        </Link>
      </div>

      {navItems.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <ListTree className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No navigation items found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new navigation item.
          </p>
          <div className="mt-6">
            <Link href="/cms/navigation/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Item
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([menuKey, langGroups]) => (
            <div key={menuKey}>
              <h2 className="text-xl font-semibold mb-3 capitalize">{menuKey.toLowerCase()} Menus</h2>
              {Object.entries(langGroups).map(([langCode, itemsInLang]) => (
                 <div key={langCode} className="mb-6 p-4 border rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Language: {langCode}</h3>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Label</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Parent</TableHead>
                                <TableHead>Linked Page</TableHead>
                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {itemsInLang.map((item) => (
                                <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.label}</TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={item.url}>{item.url}</TableCell>
                                <TableCell><Badge variant="outline">{item.order}</Badge></TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.parentLabel || 'None'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.pageSlug ? `/${item.pageSlug}` : 'Manual URL'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Item actions</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                        <Link href={`/cms/navigation/${item.id}/edit`} className="flex items-center">
                                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                                        </Link>
                                        </DropdownMenuItem>
                                        <DeleteNavItemButton itemId={item.id} />
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                 </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

