"use client";

import { useEffect, useState } from "react";
import { Users, ShieldCheck, Mail, ShoppingBag, Loader2, Search, KeyRound, Megaphone } from "lucide-react";
import { Input } from "./ui/input";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  emailVerified: boolean;
  marketingConsent: boolean;
  hasPasskey: boolean;
  orderCount: number;
  totalSpentCents: number;
  providers: string[];
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function providerLabel(provider: string) {
  const map: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    facebook: "Facebook",
    microsoft: "Microsoft",
    credential: "Email",
  };
  return map[provider] ?? provider;
}

export function AdminUsersClient() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          {data && (
            <p className="text-muted-foreground mt-1">
              {data.total} registered {data.total === 1 ? "user" : "users"}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-900 dark:text-red-100 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && data?.users.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{search ? "No users match your search." : "No users yet."}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.users.length > 0 && (
        <>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sign-in</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <KeyRound className="h-3.5 w-3.5" /> Passkey
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Megaphone className="h-3.5 w-3.5" /> Marketing
                      </span>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orders</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-accent-soft-foreground">
                              {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name ?? "—"}</p>
                            <p className="text-muted-foreground text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                              {user.emailVerified && (
                                <ShieldCheck className="h-3 w-3 text-green-500" aria-label="Email verified" />
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.providers.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border"
                            >
                              {providerLabel(p)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.hasPasskey ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.marketingConsent ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="flex items-center justify-end gap-1 text-foreground">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.orderCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {user.totalSpentCents > 0 ? formatCurrency(user.totalSpentCents) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
