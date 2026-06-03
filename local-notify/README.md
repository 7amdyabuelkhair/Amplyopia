# Local Notify (private — not on the public website)

Send in-app notifications to Amplyopia users **without signing in**. For your computer only.

## Setup (one time)

1. In Supabase: **Project Settings → API** → copy:
   - **Project URL**
   - **service_role** key (secret — never put this in the main app or GitHub)

2. In this folder, copy the example config:
   ```
   copy local-config.example.js local-config.js
   ```
   (On Mac/Linux: `cp local-config.example.js local-config.js`)

3. Edit `local-config.js` and paste your URL and **service_role** key.

4. Run a small local server (required — do not open `index.html` as `file://`):
   ```bash
   cd local-notify
   npx --yes serve .
   ```
   Or from project root:
   ```bash
   npx --yes serve local-notify
   ```

5. Open in the browser, e.g. `http://localhost:3000`

## Use

1. Page opens directly to the form (no login).
2. Click **Reload users** if the list is empty.
3. Select users, enter **title** and **message**, click **Send**.

Users receive the notification when they open the Amplyopia PWA/app (inbox / push client).

## Security

- `local-config.js` is in `.gitignore` — do not commit it.
- Never deploy this folder to GitHub Pages.
- Never use the service role key in `js/supabase-config.js` (that file is public).
