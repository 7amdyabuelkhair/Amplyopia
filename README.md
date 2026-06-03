## Amplyopia

### Supabase setup (required)

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run SQL (one file)**  
   Open **Supabase → SQL Editor**, paste the full contents of **`supabase/RUN-IN-SUPABASE.sql`**, and click **Run**.  
   This creates profiles, scores, terms, notifications, and fixes RLS (no infinite recursion on admin).

3. **Enable Google sign-in**  
   **Authentication → Providers → Google** → enable.  
   **Authentication → URL configuration → Redirect URLs**, add:
   - `https://amplyopia.com/services.html` (main — Google returns here)
   - `https://amplyopia.com/index.html`
   - `https://amplyopia.com/`
   - (GitHub Pages: `https://YOUR_USER.github.io/Amplyopia/services.html` and `.../index.html`)

4. **Add keys to the app**  
   Edit `js/supabase-config.js` with your project **URL** and **anon** key (never the service_role key).

5. **Optional: admin user**  
   After you sign up once, run `supabase/set-admin-by-email.sql` in the SQL editor (replace the email).

### Sign-in flow

1. Instructions → **Sign in** (Google or email)  
2. If the child profile is missing → fill name, gender, birthday → **Save & Continue**  
3. **Choose Service** at `services.html` (opens after sign-in when profile is complete)

### Local notifications (your PC only)

See `local-notify/README.md`. Uses the **service_role** key in `local-notify/local-config.js` (never commit that file).
