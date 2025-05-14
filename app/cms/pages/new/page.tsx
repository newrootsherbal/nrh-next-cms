// app/cms/pages/new/page.tsx
import PageForm from "../components/PageForm";
import { createPage } from "../actions"; // Server action for creating a page

export default function NewPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Page</h1>
      <PageForm
        formAction={createPage}
        actionButtonText="Create Page"
        isEditing={false}
      />
    </div>
  );
}
