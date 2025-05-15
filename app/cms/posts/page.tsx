// app/cms/posts/page.tsx
import React from "react";
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
import { MoreHorizontal, PlusCircle, Trash2, Edit3, PenTool } from "lucide-react"; // Changed FileText to PenToolSquare
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePost } from "./actions";
import type { Post, Language } from "@/utils/supabase/types";
import { getActiveLanguagesServerSide } from "@/utils/supabase/server";

function DeletePostButton({ postId }: { postId: number }) {
  const deleteActionWithId = async (formData: FormData) => {
    await deletePost(postId);
  };
  return (
    <form action={deleteActionWithId}>
      <button type="submit" className="w-full text-left">
        <DropdownMenuItem
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </button>
    </form>
  );
}

async function getPostsWithLanguages(): Promise<{ post: Post; languageCode: string }[]> {
  const supabase = createClient();
  const languages = await getActiveLanguagesServerSide();
  const langMap = new Map(languages.map(l => [l.id, l.code]));

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
  if (!posts) return [];

  return posts.map(p => ({
    post: p,
    languageCode: langMap.get(p.language_id)?.toUpperCase() || 'N/A'
  }));
}

export default async function CmsPostsListPage() {
  const postsWithLang = await getPostsWithLanguages();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manage Posts</h1>
        <Link href="/cms/posts/new">
          <Button variant="default">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {postsWithLang.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <PenTool className="mx-auto h-12 w-12 text-muted-foreground" /> {/* Icon changed */}
          <h3 className="mt-2 text-sm font-medium text-foreground">No posts found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new post.
          </p>
          <div className="mt-6">
            <Link href="/cms/posts/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Post
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
                <TableHead>Published At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postsWithLang.map(({ post, languageCode }) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published"
                          ? "default"
                          : post.status === "draft"
                            ? "secondary"
                            : "destructive"
                      }
                       className={
                        post.status === "published" ? "bg-green-500 hover:bg-green-600 text-white" :
                        post.status === "draft" ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900" :
                        "bg-gray-400 hover:bg-gray-500 text-gray-900"
                      }
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{languageCode}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(post.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                           <span className="sr-only">Post actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/cms/posts/${post.id}/edit`} className="flex items-center">
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DeletePostButton postId={post.id} />
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
