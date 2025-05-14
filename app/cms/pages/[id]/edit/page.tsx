// app/cms/pages/[id]/edit/page.tsx
import { createClient } from "@/utils/supabase/server";
import PageForm from "../../components/PageForm"; // Adjusted path
import { updatePage } from "../../actions"; // Server action for updating
import type { Page } from "@/utils/supabase/types";
import { notFound } from "next/navigation";

async function getPageData(id: number): Promise<Page | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching page for edit:", error);
    return null;
  }
  return data;
}

export default async function EditPage({ params }: { params: { id: string } }) {
  const pageId = parseInt(params.id, 10);
  if (isNaN(pageId)) {
    return notFound();
  }

  const page = await getPageData(pageId);

  if (!page) {
    return notFound(); // Or a more specific "Page not found" component
  }

  // Bind the pageId to the updatePage server action
  const updatePageWithId = updatePage.bind(null, pageId);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Page: {page.title}</h1>
      <PageForm
        page={page}
        formAction={updatePageWithId}
        actionButtonText="Update Page"
        isEditing={true}
      />
    </div>
  );
}
