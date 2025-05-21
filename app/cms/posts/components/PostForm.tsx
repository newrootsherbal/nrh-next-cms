// app/cms/posts/components/PostForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import type { Post, PageStatus, Language } from "@/utils/supabase/types";
import { useAuth } from "@/context/AuthContext";
// Remove client-side language fetching: import { getActiveLanguagesClientSide } from "@/utils/supabase/client";

interface PostFormProps {
  post?: Post | null;
  formAction: (formData: FormData) => Promise<{ error?: string } | void>;
  actionButtonText?: string;
  isEditing?: boolean;
  availableLanguagesProp: Language[]; // New prop to accept languages
}

export default function PostForm({
  post,
  formAction,
  actionButtonText = "Save Post",
  isEditing = false,
  availableLanguagesProp, // Destructure the new prop
}: PostFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { user, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [languageId, setLanguageId] = useState<string>(
    post?.language_id?.toString() || ""
  );
  const [status, setStatus] = useState<PageStatus>(post?.status || "draft");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [publishedAt, setPublishedAt] = useState<string>(() => {
    if (post?.published_at) {
      try {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [metaTitle, setMetaTitle] = useState(post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description || ""
  );

  // Use the passed-in languages directly
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(availableLanguagesProp);
  // No need for languagesLoading state if languages are passed as props
  // const [languagesLoading, setLanguagesLoading] = useState(true); // REMOVE THIS

  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const successMessage = searchParams.get('success');
    const errorMessage = searchParams.get('error');
    if (successMessage) {
      setFormMessage({ type: 'success', text: decodeURIComponent(successMessage) });
    } else if (errorMessage) {
      setFormMessage({ type: 'error', text: decodeURIComponent(errorMessage) });
    }
  }, [searchParams]);

  // Initialize languageId if creating new post and languages are available
  useEffect(() => {
    if (!isEditing && availableLanguages.length > 0 && !languageId) { // check !isEditing too
      const defaultLang = availableLanguages.find(l => l.is_default) || availableLanguages[0];
      if (defaultLang) {
          setLanguageId(defaultLang.id.toString());
      }
    }
  }, [isEditing, availableLanguages, languageId]); // Add isEditing to dependency array


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing || !slug) { // Only auto-generate slug if creating new or slug is empty
      setSlug(newTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, ""));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await formAction(formData);
      if (result?.error) {
        setFormMessage({ type: 'error', text: result.error });
      }
      // Success is handled by redirect with query param in server action
    });
  };

  // Remove languagesLoading from this condition
  if (authLoading) {
    return <div>Loading form...</div>;
  }
  if (!user) {
    return <div>Please log in to manage posts.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formMessage && (
        <div
          className={`p-3 rounded-md text-sm ${
            formMessage.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
              : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
          }`}
        >
          {formMessage.text}
        </div>
      )}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" value={title} onChange={handleTitleChange} required className="mt-1" />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="mt-1" />
      </div>

      <div>
        <Label htmlFor="language_id">Language</Label>
        {availableLanguages.length > 0 ? (
        <Select name="language_id" value={languageId} onValueChange={setLanguageId} required disabled={isEditing}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name} ({lang.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        ) : (
           <p className="text-sm text-muted-foreground mt-1">No languages available. Please add languages in CMS settings.</p>
        )}
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1" rows={3} />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select name="status" value={status} onValueChange={(value) => setStatus(value as PageStatus)} required>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="published_at">Published At (Optional)</Label>
        <Input
          id="published_at"
          name="published_at"
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="mt-1"
        />
         <p className="text-xs text-muted-foreground mt-1">Leave blank to publish immediately when status is 'Published'.</p>
      </div>

      <div>
        <Label htmlFor="meta_title">Meta Title (SEO)</Label>
        <Input id="meta_title" name="meta_title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="meta_description">Meta Description (SEO)</Label>
        <Textarea id="meta_description" name="meta_description" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1" rows={3} />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/cms/posts")} disabled={isPending}>Cancel</Button>
        {/* Adjust disabled condition */}
        <Button type="submit" disabled={isPending || authLoading || availableLanguages.length === 0}>
          {isPending ? "Saving..." : actionButtonText}
        </Button>
      </div>
    </form>
  );
}