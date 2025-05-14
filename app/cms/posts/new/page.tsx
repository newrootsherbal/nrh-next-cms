// app/cms/posts/new/page.tsx
import PostForm from "../components/PostForm";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <PostForm
        formAction={createPost}
        actionButtonText="Create Post"
        isEditing={false}
      />
    </div>
  );
}
