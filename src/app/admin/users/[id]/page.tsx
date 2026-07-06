import Link from "next/link";
import NavigationContentReady from "@/components/NavigationContentReady";
import { formatCurrency } from "@/lib/currency";
import { getAdminUserDataAction, getAdminUserProfileAction } from "@/actions/adminActions";
import { AuthGate, getAppAuthGate } from "@/lib/pageHelpers";
import { resolveDisplayName } from "@/lib/profileDisplay";
import { resolveMonthKey } from "@/lib/month";

interface AdminUserPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

function formatRole(role: string): string {
  return role === "super_admin" ? "Super admin" : "User";
}

export default async function AdminUserPage({ params, searchParams }: AdminUserPageProps) {
  const gate = await getAppAuthGate();

  if (gate.state === "pin_required") {
    return <AuthGate gateState={gate}>{null}</AuthGate>;
  }

  const { id } = await params;
  const { month } = await searchParams;
  const monthKey = resolveMonthKey(month);
  const profile = await getAdminUserProfileAction(id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#09090B] px-3 py-6 text-zinc-100 sm:px-4 sm:py-8">
        <p>User not found.</p>
      </main>
    );
  }

  const { budget, expenses } = await getAdminUserDataAction(id, monthKey);
  const userLabel = resolveDisplayName({
    displayName: profile.displayName,
    email: profile.email,
  });

  return (
    <main className="min-h-screen bg-[#09090B] px-3 py-6 pb-10 text-zinc-100 sm:px-4 sm:py-8">
      <NavigationContentReady />
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B5CF6]/80">User data</p>
            <h1 className="mt-2 text-xl font-semibold sm:text-2xl">{userLabel}</h1>
            <p className="mt-1 break-all text-sm text-zinc-500">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[#27272A] bg-[#18181B] px-2.5 py-0.5 text-xs text-zinc-300">
                {formatRole(profile.role)}
              </span>
              <span
                className={
                  profile.isDisabled
                    ? "inline-flex rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-0.5 text-xs font-medium text-[#EF4444]"
                    : "inline-flex rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-medium text-[#10B981]"
                }
              >
                {profile.isDisabled ? "Disabled" : "Active"}
              </span>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[#27272A] px-4 py-2.5 text-sm sm:w-auto"
          >
            Back to admin
          </Link>
        </div>

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
          <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">
                Month
              </span>
              <input
                type="month"
                name="month"
                defaultValue={monthKey}
                className="h-10 w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 text-sm [color-scheme:dark]"
              />
            </label>
            <button
              type="submit"
              className="h-10 w-full rounded-xl bg-[#8B5CF6] px-4 text-sm font-medium sm:w-auto sm:px-5"
            >
              Load month
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-400">Salary</p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(Number(budget?.total_salary ?? 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-400">Savings goal</p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(Number(budget?.savings_goal ?? 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Expenses ({monthKey})
            </p>
            <p className="mt-2 text-xl font-semibold">{expenses.length}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="border-b border-[#27272A] px-4 py-3 text-sm text-zinc-400">
            Transactions
          </div>

          {expenses.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No expenses for this month.
            </p>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {expenses.map((expense) => (
                  <article
                    key={expense.id}
                    className="rounded-xl border border-[#27272A] bg-[#09090B] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{expense.date}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#27272A] bg-[#18181B] px-2.5 py-0.5 text-xs text-zinc-300">
                        {expense.category}
                      </span>
                    </div>
                    {expense.description ? (
                      <p className="mt-3 break-words text-sm text-zinc-400">
                        {expense.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[#27272A] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-[#27272A]/70">
                        <td className="whitespace-nowrap px-4 py-3">{expense.date}</td>
                        <td className="px-4 py-3">{expense.category}</td>
                        <td className="max-w-xs truncate px-4 py-3">{expense.description}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
