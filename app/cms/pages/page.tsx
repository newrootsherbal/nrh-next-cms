// app/cms/pages/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePage } from "./actions";
import type { Page, Language } from "@/utils/supabase/types"; // Assuming Page type is defined here
import { getActiveLanguagesServerSide } from "@/utils/supabase/server"; // To map language_id to name

// Helper component for the delete action
function DeletePageButton({ pageId }: { pageId: number }) {
  // This needs to be a client component to use useTransition or handle form submission client-side
  // For simplicity with server actions, we'll make the form submission trigger the action directly.
  // A more robust UX would involve a confirmation modal.
  const deleteActionWithId = deletePage.bind(null, pageId);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const result = await deleteActionWithId();
      if (result.error) {
        console.error("Error deleting page:", result.error);
      }
    }}>
      <button type="submit" className="w-full text-left">
        <DropdownMenuItem
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20"
          onSelect={(e) => e.preventDefault()} // Prevent DropdownMenu from closing if we add confirmation
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </button>
    </form>
  );
}


async function getPagesWithLanguages(): Promise<{ page: Page; languageCode: string }[]> {
  const supabase = createClient();
  const languages = await getActiveLanguagesServerSide();
  const langMap = new Map(languages.map(l => [l.id, l.code]));

  // Fetch pages and include language information
  // For a more complex scenario with many languages, you might join in the DB
  // or fetch related data more efficiently.
  const { data: pages, error } = await supabase
    .from("pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pages:", error);
    return [];
  }
  if (!pages) return [];

  return pages.map(p => ({
    page: p,
    languageCode: langMap.get(p.language_id)?.toUpperCase() || 'N/A'
  }));
}


export default async function CmsPagesListPage() {
  const pagesWithLang = await getPagesWithLanguages();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manage Pages</h1>
        <Link href="/cms/pages/new">
          <Button variant="default">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Page
          </Button>
        </Link>
      </div>

      {pagesWithLang.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No pages found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new page.
          </p>
          <div className="mt-6">
            <Link href="/cms/pages/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Page
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagesWithLang.map(({ page, languageCode }) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        page.status === "published"
                          ? "default"
                          : page.status === "draft"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        page.status === "published" ? "bg-green-500 hover:bg-green-600 text-white" :
                        page.status === "draft" ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900" :
                        "bg-gray-400 hover:bg-gray-500 text-gray-900"
                      }
                    >
                      {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{languageCode}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">/{page.slug}</TableCell>
                  <TableCell>
                    {new Date(page.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Page actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/cms/pages/${page.id}/edit`} className="flex items-center">
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DeletePageButton pageId={page.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
