"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { deleteNavigationItem } from "../actions"; // Adjusted path

interface DeleteNavItemButtonProps {
  itemId: number;
  onDelete?: () => void; // Optional callback after deletion
}

export default function DeleteNavItemButton({ itemId, onDelete }: DeleteNavItemButtonProps) {
  const boundDeleteAction = deleteNavigationItem.bind(null, itemId);

  // Wrapper to satisfy form action type and handle potential error return
  const clientActionWrapper = async () => {
    try {
      const result = await boundDeleteAction();
      if (result?.error) {
        // You might want to display this error to the user, e.g., using a toast notification
        console.error("Delete operation failed:", result.error);
        // Potentially re-throw or handle as a client-side error state
      } else {
        // Successful deletion (redirect handled by server action)
        if (onDelete) {
          onDelete(); // Callback for client-side updates if needed
        }
      }
    } catch (error) {
      // This catch block handles errors thrown by the redirect() or other unexpected errors
      console.error("Exception during delete action:", error);
      // Handle unexpected errors (e.g. display a generic error message)
    }
  };

  return (
    <form action={clientActionWrapper} className="w-full">
      <button type="submit" className="w-full text-left">
        <DropdownMenuItem
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20"
          // The click on the button submits the form.
          // onSelect on DropdownMenuItem can be used for other purposes if needed,
          // but for form submission, the button's behavior is key.
          // Adding onSelect={(e) => e.preventDefault()} here might be desired if you want
          // to stop the dropdown from closing immediately, but ensure it doesn't block submission.
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </button>
    </form>
  );
}