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
