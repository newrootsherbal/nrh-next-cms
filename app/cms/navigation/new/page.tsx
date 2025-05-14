// app/cms/navigation/new/page.tsx
import NavigationItemForm from "../components/NavigationItemForm";
import { createNavigationItem } from "../actions";

export default function NewNavigationItemPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Navigation Item</h1>
      <NavigationItemForm
        formAction={createNavigationItem}
        actionButtonText="Create Item"
        isEditing={false}
      />
    </div>
  );
}
