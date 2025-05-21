// app/cms/posts/[id]/edit/page.tsx
import React from "react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import PostForm from "../../components/PostForm"; // Adjusted path
import { updatePost } from "../../actions";
import type { Post as PostType, Block as BlockType, Language } from "@/utils/supabase/types"; // Ensure Language is imported
import { notFound, redirect } from "next/navigation";
import BlockEditorArea from "@/app/cms/blocks/components/BlockEditorArea";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react"; // Removed SeparatorVertical, use <Separator />
import ContentLanguageSwitcher from "@/app/cms/components/ContentLanguageSwitcher";
import { getActiveLanguagesServerSide } from "@/utils/supabase/server"; // Correct server-side fetch

interface PostWithBlocks extends PostType {
  blocks: BlockType[];
  language_code?: string; // From joined languages table
  translation_group_id: string;
}

async function getPostDataWithBlocks(id: number): Promise<PostWithBlocks | null> {
  const supabase = createClient();
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select(`
      *,
      languages!inner (code),
      blocks (*)
    `)
    .eq("id", id)
    .order('order', { foreignTable: 'blocks', ascending: true })
    .single();

  if (postError) {
    console.error("Error fetching post with blocks for edit:", postError);
    return null;
  }

  const langCode = (postData.languages as unknown as Language)?.code;

  return {
    ...postData,
    blocks: postData.blocks || [],
    language_code: langCode,
    translation_group_id: postData.translation_group_id,
  } as PostWithBlocks;
}

export default async function EditPostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const postId = parseInt(params.id, 10);
  if (isNaN(postId)) {
    return notFound();
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/sign-in?redirect=/cms/posts/${postId}/edit`);

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['ADMIN', 'WRITER'].includes(profile.role)) {
      return <div className="p-6 text-center text-red-600">Access Denied. You do not have permission to edit posts.</div>;
  }

  // Fetch post data and all site languages concurrently
  const [postWithBlocks, allSiteLanguages] = await Promise.all([
    getPostDataWithBlocks(postId),
    getActiveLanguagesServerSide() // Fetch languages on the server
  ]);

  if (!postWithBlocks) {
    return notFound();
  }

  const updatePostWithId = updatePost.bind(null, postId);
  const publicPostUrl = `/blog/${postWithBlocks.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <Link href="/cms/posts">
                <Button variant="outline" size="icon" aria-label="Back to posts">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Edit Post</h1>
                <p className="text-sm text-muted-foreground truncate max-w-md" title={postWithBlocks.title}>{postWithBlocks.title}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            {allSiteLanguages.length > 0 && (
                 <ContentLanguageSwitcher
                    currentItem={postWithBlocks}
                    itemType="post"
                    allSiteLanguages={allSiteLanguages}
                  />
            )}
            <Link href={publicPostUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" /> View Live Post
              </Button>
            </Link>
        </div>
      </div>

      <PostForm
        post={postWithBlocks}
        formAction={updatePostWithId}
        actionButtonText="Update Post Metadata"
        isEditing={true}
        availableLanguagesProp={allSiteLanguages} // Pass languages as a prop
      />

      <Separator className="my-8" />

      <div>
        <h2 className="text-xl font-semibold mb-4">Post Content Blocks</h2>
        <BlockEditorArea
          parentId={postWithBlocks.id}
          parentType="post"
          initialBlocks={postWithBlocks.blocks}
          languageId={postWithBlocks.language_id}
        />
      </div>
    </div>
  );
}