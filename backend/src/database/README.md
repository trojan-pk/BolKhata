# Database Schema

The single source of truth for the BolKhata database is the migration folder:

```
backend/supabase/migrations/
```

Apply migrations either via the Supabase CLI (`supabase db push` on a linked
project) or by pasting the SQL into Supabase Dashboard → SQL Editor.

The unified v3 schema (2026-09) enforces:
- Row Level Security on every table — users can only read/write rows where
  `user_id` matches their own `auth.uid()`.
- `transactions.user_id` derived from the owning customer by trigger, so
  cross-tenant ledger entries are impossible.
- `customers.balance` recomputed from the transaction history by trigger —
  the ledger is the single source of truth.
- `voice_usage` with an atomic `increment_voice_usage()` quota counter.
