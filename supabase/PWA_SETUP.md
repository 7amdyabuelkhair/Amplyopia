# Amplyopia PWA Setup

## 1) Run SQL

Run these files in Supabase SQL Editor (in order):

1. `supabase/schema.sql`
2. `supabase/pwa-schema.sql`

If you see **"infinite recursion detected in policy for relation profiles"**, run:

3. `supabase/fix-profiles-rls-recursion.sql`

Set your admin account:

1. User must exist under **Authentication → Users** (sign up in the app once).
2. Run **`supabase/set-admin-by-email.sql`** in SQL Editor (edit the email in that file).

Your old query only updates an existing profile row. If you deleted all profiles, it changes **0 rows** and does nothing. The new script **inserts or updates** the profile and sets `is_admin = true`.

## 2) Configure app

Edit `js/pwa-config.js`:

- `VAPID_PUBLIC_KEY` (required for browser push subscription)
- `ADMIN_EMAILS` (optional fallback admin check)

## 3) Deploy

Deploy site over HTTPS (required for PWA + notifications).

Update `version.json` on each release to trigger in-app update prompt.

## 4) Admin dashboard

Open:

`/admin/index.html`

Sign in with an admin account, select users, and send notifications.

## 5) Push behavior

- Users receive inbox notifications via `notification_targets` when app is opened.
- For true background push (phone locked), deploy a Supabase Edge Function that reads `push_subscriptions` and sends Web Push using your VAPID private key.
