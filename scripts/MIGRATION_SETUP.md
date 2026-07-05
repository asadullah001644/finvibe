# FinVibe Multi-User Migration Setup

Run these steps **in order** in the Supabase SQL Editor after deploying the app code.

## Phase 0 — Backup (already done locally)

```bash
node scripts/backup-db.mjs
```

Backup saved under `backups/<timestamp>/`. Confirm row counts in Supabase match `manifest.json`.

Also confirm Supabase Dashboard → Database → Backups has a recent snapshot.

## Phase 1 — Foundation

Run: [`supabase/migrations/003_multi_user_foundation.sql`](../supabase/migrations/003_multi_user_foundation.sql)

Optional (recommended): In Supabase → Database → Settings → Custom Postgres Config, set:

```
app.super_admin_email = 'muhammadasadullah833@gmail.com'
```

## Phase 2 — Auth (app deploy)

1. Deploy app with new env vars (`SUPER_ADMIN_EMAIL`, optional `SUPABASE_SERVICE_ROLE_KEY`)
2. Visit `/signup` and create account: `muhammadasadullah833@gmail.com`
3. Sign in at `/login`

## Phase 3 — Backfill your existing data

Run: [`supabase/migrations/005_backfill_super_admin.sql`](../supabase/migrations/005_backfill_super_admin.sql)

Verify:

```sql
select count(*) filter (where user_id is null) from budgets;
select count(*) filter (where user_id is null) from expenses;
```

Both must be `0`.

## Phase 4 — RLS lockdown

Run: [`supabase/migrations/004_multi_user_lockdown.sql`](../supabase/migrations/004_multi_user_lockdown.sql)

## Post-migration

1. Sign in — you should see all your original budgets and expenses
2. Optional: Settings → enable 4-digit app PIN (replaces old env PIN)
3. Remove `APP_SECRET_PIN_HASH` from Vercel / `.env.local`
4. Super admin: `/admin` for user management, Insights for AI audits

## Rollback

- **Cloud:** Supabase Dashboard → Database → Backups → Restore
- **Local:** `node scripts/restore-db.mjs backups/<timestamp> --confirm`
