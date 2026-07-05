import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { getAdminUserDataAction, getAdminUserProfileAction } from "@/actions/adminActions";
import { requireSuperAdmin } from "@/lib/auth";
import { resolveMonthKey } from "@/lib/month";

interface AdminUserPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

export default async function AdminUserPage({ params, searchParams }: AdminUserPageProps) {
  await requireSuperAdmin();
  const { id } = await params;
  const { month } = await searchParams;
  const monthKey = resolveMonthKey(month);
  const profile = await getAdminUserProfileAction(id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#09090B] px-4 py-8 text-zinc-100">
        <p>User not found.</p>
      </main>
    );
  }

  const { budget, expenses } = await getAdminUserDataAction(id, monthKey);

  return (
    <main className="min-h-screen bg-[#09090B] px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B5CF6]/80">User data</p>
            <h1 className="mt-2 text-2xl font-semibold">{profile.email}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {profile.role} · {profile.isDisabled ? "Disabled" : "Active"}
            </p>
          </div>
          <Link href="/admin" className="rounded-xl border border-[#27272A] px-4 py-2 text-sm">
            Back to admin
          </Link>
        </div>

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Month</span>
              <input
                type="month"
                name="month"
                defaultValue={monthKey}
                className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-medium"
            >
              Load month
            </button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs text-zinc-400">Salary</p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(Number(budget?.total_salary ?? 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs text-zinc-400">Savings goal</p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(Number(budget?.savings_goal ?? 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs text-zinc-400">Expenses ({monthKey})</p>
            <p className="mt-2 text-xl font-semibold">{expenses.length}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="border-b border-[#27272A] px-4 py-3 text-sm text-zinc-400">
            Transactions
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#27272A] text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-zinc-500">
                      No expenses for this month.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-[#27272A]/70">
                      <td className="px-4 py-3">{expense.date}</td>
                      <td className="px-4 py-3">{expense.category}</td>
                      <td className="px-4 py-3">{expense.description}</td>
                      <td className="px-4 py-3">{formatCurrency(Number(expense.amount))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
