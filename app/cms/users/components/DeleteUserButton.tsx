// app/cms/users/components/DeleteUserButton.tsx
"use client"; // This is crucial

import React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation"; // if needed for client-side navigation after action
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2, ShieldAlert } from "lucide-react";
import { deleteUserAndProfile } from "../actions"; // Your server action

export function DeleteUserButtonClient({ userId, userEmail, currentAdminId }: { userId: string; userEmail?: string, currentAdminId?: string}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    if (userId === currentAdminId) {
        alert("Admins cannot delete their own account through this panel.");
        setShowConfirm(false);
        return;
    }
    startTransition(async () => {
      const result = await deleteUserAndProfile(userId); // Server Action
      if (result?.error) {
        alert(`Error: ${result.error}`);
      }
      // Revalidation and redirect should be handled by the server action.
      // If not, uncomment and use router.refresh():
      // router.refresh();
      setShowConfirm(false);
    });
  };

  if (showConfirm) {
    return (
      <div className="p-2">
        <p className="text-sm text-foreground mb-2">Delete {userEmail || 'this user'}?</p>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Confirm"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenuItem
      className={`text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20 ${userId === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''}`}
      onSelect={(e) => {
        e.preventDefault(); // Important to prevent menu from closing immediately
        if (userId !== currentAdminId) setShowConfirm(true);
      }}
      disabled={userId === currentAdminId}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete User
      {userId === currentAdminId && (
        <span title="You cannot delete your own account.">
          <ShieldAlert className="ml-auto h-4 w-4 text-yellow-500" aria-label="You cannot delete your own account." />
        </span>
      )}
    </DropdownMenuItem>
  );
}