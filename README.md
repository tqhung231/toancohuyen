<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LygXpg_bsteuNjjMX2riU0wFrjJX-7Vy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `API_KEY` (optional, for Gemini AI insights)
3. In Supabase SQL editor, run [supabase/schema.sql](supabase/schema.sql)
   - If you already ran it before, rerun it (or execute `alter table students add column if not exists note text not null default '';`) to add student notes.
4. Run the app:
   `npm run dev`

## Deploy to GitHub Pages (same repo setup as before)

This project is configured for GitHub Pages at:
`https://tqhung231.github.io/toancohuyen`

1. Push the workflow file to `main`:
   - [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
2. In GitHub repo settings:
   - `Settings -> Pages -> Build and deployment -> Source: GitHub Actions`
3. Add repository secrets:
   - `Settings -> Secrets and variables -> Actions -> New repository secret`
   - Required:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Optional (for AI insights):
     - `API_KEY` (or `GEMINI_API_KEY`)
4. Push to `main` (or run the workflow manually from `Actions`) to deploy.

Notes:
- `VITE_*` values are embedded into the frontend bundle at build time, so they are not private at runtime.
- Keep Supabase Row Level Security enabled and do not use the Supabase `service_role` key in frontend builds.
