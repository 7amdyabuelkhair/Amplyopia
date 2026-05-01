## Amplyopia

### Supabase setup (Auth + Profiles + Scores)

- **1) Create a Supabase project**
- **2) Run SQL**
  - Open Supabase SQL editor and run `supabase/schema.sql`
- **3) Enable Google**
  - In Supabase: Authentication → Providers → **Google** (enable it)
  - Add your site URL(s) to the allowed redirect URLs
- **4) Add keys to the app**
  - Open `js/supabase-config.js` and paste your Supabase anon key.

After that, open `index.html` and use **Sign in / Sign up** (Google or email). The app will always ask for **child info (name, gender, birthday)** after sign-in if it’s missing, then it calculates age automatically.

