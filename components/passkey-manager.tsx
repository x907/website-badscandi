"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Passkey = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeyManager({ passkeys }: { passkeys: Passkey[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(passkeyId: string) {
    if (!confirm("Are you sure you want to delete this passkey?")) {
      return;
    }

    setDeleting(passkeyId);
    try {
      const res = await fetch("/api/auth/passkey/delete-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: passkeyId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete passkey");
      }

      window.location.reload();
    } catch (err) {
      alert("Failed to delete passkey. Please try again.");
      setDeleting(null);
    }
  }

  async function handleRename(passkeyId: string) {
    try {
      const res = await fetch("/api/auth/passkey/update-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: passkeyId, name: editName }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename passkey");
      }

      window.location.reload();
    } catch (err) {
      alert("Failed to rename passkey. Please try again.");
    }
  }

  function startEditing(passkey: Passkey) {
    setEditingId(passkey.id);
    setEditName(passkey.name || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  if (passkeys.length === 0) {
    return <p className="text-sm text-neutral-600">No passkeys registered yet</p>;
  }

  return (
    <ul className="space-y-3">
      {passkeys.map((passkey) => (
        <li
          key={passkey.id}
          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
        >
          <div className="flex-1">
            {editingId === passkey.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded"
                  placeholder="Passkey name"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRename(passkey.id)}
                  disabled={!editName.trim()}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <>
                <p className="font-medium text-sm">{passkey.name || "Unnamed Passkey"}</p>
                <p className="text-xs text-neutral-600">
                  Created: {formatDate(passkey.createdAt)}
                </p>
              </>
            )}
          </div>
          {editingId !== passkey.id && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startEditing(passkey)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(passkey.id)}
                disabled={deleting === passkey.id}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
