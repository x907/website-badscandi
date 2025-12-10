"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { passkey } from "@/lib/auth-client";

type Passkey = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeyManager({ passkeys }: { passkeys: Passkey[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(passkeyId: string) {
    setDeletingId(passkeyId);
    setError(null);

    try {
      // Use Better Auth client for deletion
      const result = await passkey.deletePasskey({ id: passkeyId });

      if (result.error) {
        throw new Error(result.error.message || "Failed to delete passkey");
      }

      window.location.reload();
    } catch (err: any) {
      console.error("Delete passkey error:", err);
      setError(err.message || "Failed to delete passkey. Please try again.");
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleRename(passkeyId: string) {
    setError(null);

    try {
      // Use Better Auth client for update
      const result = await passkey.updatePasskey({
        id: passkeyId,
        name: editName.trim()
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to rename passkey");
      }

      window.location.reload();
    } catch (err: any) {
      console.error("Rename passkey error:", err);
      setError(err.message || "Failed to rename passkey. Please try again.");
    }
  }

  function startEditing(pk: Passkey) {
    setEditingId(pk.id);
    setEditName(pk.name || "");
    setConfirmDeleteId(null);
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setError(null);
  }

  function requestDelete(passkeyId: string) {
    setConfirmDeleteId(passkeyId);
    setEditingId(null);
    setError(null);
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
    setError(null);
  }

  if (passkeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No passkeys registered yet</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {passkeys.map((pk) => (
          <li
            key={pk.id}
            className="p-3 sm:p-4 bg-muted rounded-lg"
          >
            {/* Delete confirmation state */}
            {confirmDeleteId === pk.id ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Delete "{pk.name || "Unnamed Passkey"}"?
                </p>
                <p className="text-xs text-muted-foreground">
                  You won't be able to use this passkey to sign in anymore.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(pk.id)}
                    disabled={deletingId === pk.id}
                    className="flex-1 min-h-[44px]"
                  >
                    {deletingId === pk.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={deletingId === pk.id}
                    className="flex-1 min-h-[44px]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : editingId === pk.id ? (
              /* Edit state */
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Passkey name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRename(pk.id)}
                    disabled={!editName.trim()}
                    className="flex-1 min-h-[44px]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                    className="flex-1 min-h-[44px]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal state */
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground">{pk.name || "Unnamed Passkey"}</p>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(pk.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 sm:gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(pk)}
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0"
                    aria-label="Edit passkey name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => requestDelete(pk.id)}
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0"
                    aria-label="Delete passkey"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
