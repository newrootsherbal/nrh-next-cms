"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { deleteNavigationItem } from "../actions";
import { ConfirmationModal } from "@/app/cms/components/ConfirmationModal";

interface DeleteNavItemButtonProps {
  itemId: number;
  onDelete?: () => void;
}

export default function DeleteNavItemButton({ itemId, onDelete }: DeleteNavItemButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await deleteNavigationItem(itemId);
      if (result?.error) {
        console.error("Delete operation failed:", result.error);
      } else {
        if (onDelete) {
          onDelete();
        }
      }
    } catch (error) {
      console.error("Exception during delete action:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20"
        onSelect={(e) => {
          e.preventDefault();
          setIsModalOpen(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This will permanently delete the navigation item. This action cannot be undone."
      />
    </>
  );
}