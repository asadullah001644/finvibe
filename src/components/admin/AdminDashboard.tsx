"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteUserAction,
  disableUserAction,
  enableUserAction,
  getAdminUsersAction,
  type AdminUserRow,
} from "@/actions/adminActions";

interface AdminDashboardProps {
  initialUsers: AdminUserRow[];
  schemaReady: boolean;
  schemaMessage?: string;
}

const adminSelectClassName =
  "h-10 w-full appearance-none rounded-xl border border-[#27272A] bg-[#09090B] pl-3 pr-10 text-sm text-zinc-100 outline-none transition-colors focus:border-[#8B5CF6]/40 [color-scheme:dark]";

function AdminSelectChevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AdminDashboard({
  initialUsers,
  schemaReady,
  schemaMessage,
}: AdminDashboardProps) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"all" | "user" | "super_admin">("all");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredCount = useMemo(() => users.length, [users]);

  function refreshUsers() {
    startTransition(async () => {
      try {
        const next = await getAdminUsersAction({ email, role, status });
        setUsers(next);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load users.");
      }
    });
  }

  function runAction(action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setMessage(successMessage);
        setError(null);
        refreshUsers();
      } else {
        setError(result.error ?? "Action failed.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#09090B] px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B5CF6]/80">Super Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">User Management</h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#27272A] px-4 py-2 text-sm text-zinc-300 hover:border-[#8B5CF6]/40"
          >
            Back to app
          </Link>
        </div>

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <label className="block min-w-0 flex-1 lg:min-w-[220px]">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">
                Search email
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Filter by email"
                className="h-10 w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[#8B5CF6]/40"
              />
            </label>
            <label className="block w-full sm:w-auto sm:min-w-[160px]">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">
                Role
              </span>
              <div className="relative">
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as typeof role)}
                  className={adminSelectClassName}
                >
                  <option value="all">All roles</option>
                  <option value="user">User</option>
                  <option value="super_admin">Super admin</option>
                </select>
                <AdminSelectChevron />
              </div>
            </label>
            <label className="block w-full sm:w-auto sm:min-w-[160px]">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">
                Status
              </span>
              <div className="relative">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className={adminSelectClassName}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
                <AdminSelectChevron />
              </div>
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={refreshUsers}
              className="h-10 w-full shrink-0 rounded-xl bg-[#8B5CF6] px-4 text-sm font-medium disabled:opacity-60 sm:w-auto lg:min-w-[132px]"
            >
              Apply filters
            </button>
          </div>
        </section>

        {message && (
          <p className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#10B981]">
            {message}
          </p>
        )}
        {!schemaReady && schemaMessage && (
          <p className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#F59E0B]">
            {schemaMessage}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="border-b border-[#27272A] px-4 py-3 text-sm text-zinc-400">
            {filteredCount} user(s)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#27272A] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#27272A]/70">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">
                      {user.isDisabled ? (
                        <span className="text-[#EF4444]">Disabled</span>
                      ) : (
                        <span className="text-[#10B981]">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="rounded-lg border border-[#27272A] px-2 py-1 text-xs hover:border-[#8B5CF6]/40"
                        >
                          View data
                        </Link>
                        {schemaReady &&
                          (user.isDisabled ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                runAction(
                                  () => enableUserAction(user.id),
                                  "User enabled.",
                                )
                              }
                              className="rounded-lg border border-[#10B981]/30 px-2 py-1 text-xs text-[#10B981]"
                            >
                              Enable
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                runAction(
                                  () => disableUserAction(user.id),
                                  "User disabled.",
                                )
                              }
                              className="rounded-lg border border-[#F59E0B]/30 px-2 py-1 text-xs text-[#F59E0B]"
                            >
                              Disable
                            </button>
                          ))}
                        {schemaReady && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete ${user.email}? This removes all their financial data.`,
                                )
                              ) {
                                runAction(
                                  () => deleteUserAction(user.id),
                                  "User deleted.",
                                );
                              }
                            }}
                            className="rounded-lg border border-[#EF4444]/30 px-2 py-1 text-xs text-[#EF4444]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
