"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2, ShieldAlert } from "lucide-react";
import { deleteUserAndProfile } from "../actions";

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
      const result = await deleteUserAndProfile(userId);
      if (result?.error) {
        alert(`Error: ${result.error}`);
      }
      setShowConfirm(false);
      // Server action handles redirect and revalidation
    });
  };

  if (showConfirm) {
    return (
      <div className="p-2 space-y-2">
        <p className="text-sm text-foreground">Delete {userEmail || 'this user'}?</p>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenuItem
      className={`text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20 ${userId === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''}`}
      onSelect={(e) => {
        e.preventDefault();
        if (userId !== currentAdminId) setShowConfirm(true);
      }}
      disabled={userId === currentAdminId}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete User
      {userId === currentAdminId && <ShieldAlert className="ml-auto h-4 w-4 text-yellow-500" title="You cannot delete your own account."/>}
    </DropdownMenuItem>
  );
}