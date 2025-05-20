"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2, ShieldAlert } from "lucide-react";
import { deleteLanguage } from "../actions"; // Server action
import type { Language } from "@/utils/supabase/types";
import { useTransition } from 'react';

interface DeleteLanguageClientButtonProps {
  language: Language;
}

export default function DeleteLanguageClientButton({ language }: DeleteLanguageClientButtonProps) {
  const [isPending, startTransition] = useTransition();
  // A more robust check for "is_default and is the only default language" should ideally
  // be handled by the server action or by passing allLanguages to this component.
  // For UI hint, this is a simplified check. The server action has the final say.
  const isDefaultLanguage = language.is_default;

  const handleDeleteClick = () => {
    // The server-side `deleteLanguage` action already checks if it's the default
    // and if it's the only language. This client-side check is for immediate UX.
    if (isDefaultLanguage) {
      // The server action has a more robust check for "only default"
      // For now, a simple alert for any default language.
       alert("Cannot delete the default language. Please set another language as default first, or ensure this is not the only language.");
       return;
    }
    if (!confirm(`Are you sure you want to delete "${language.name}"? This will delete ALL content (pages, posts, etc.) associated with this language.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteLanguage(language.id); // Call the server action
      if (result?.error) {
        alert(`Error: ${result.error}`);
        // In a real app, use a toast or a more integrated notification system
      }
      // Revalidation and redirection are handled by the server action itself.
    });
  };

  return (
    <DropdownMenuItem
      className={`hover:!bg-red-50 dark:hover:!bg-red-700/20 ${
        isDefaultLanguage // Visually hint if it's default, server action has final say on deletability
          ? "text-muted-foreground cursor-not-allowed hover:!text-muted-foreground"
          : "text-red-600 hover:!text-red-600 cursor-pointer"
      }`}
      onSelect={(e) => e.preventDefault()} // Prevent menu closing immediately
      onClick={!isPending ? handleDeleteClick : undefined}
      disabled={isPending || isDefaultLanguage} // Disable if pending or if it's the default language
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isPending ? "Deleting..." : "Delete"}
      {isDefaultLanguage && (
        <span title="This is the default language. Deletion might be restricted.">
          <ShieldAlert className="ml-auto h-4 w-4 text-amber-500" />
        </span>
      )}
    </DropdownMenuItem>
  );
}