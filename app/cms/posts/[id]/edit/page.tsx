// app/cms/posts/[id]/edit/page.tsx
import { createClient } from "@/utils/supabase/server";
import PostForm from "../../components/PostForm"; // Adjusted path
import { updatePost } from "../../actions";
import type { Post } from "@/utils/supabase/types";
import { notFound } from "next/navigation";

async function getPostData(id: number): Promise<Post | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post for edit:", error);
    return null;
  }
  return data;
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const postId = parseInt(params.id, 10);
  if (isNaN(postId)) {
    return notFound();
  }

  const post = await getPostData(postId);

  if (!post) {
    return notFound();
  }

  const updatePostWithId = updatePost.bind(null, postId);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Post: {post.title}</h1>
      <PostForm
        post={post}
        formAction={updatePostWithId}
        actionButtonText="Update Post"
        isEditing={true}
      />
    </div>
  );
}
