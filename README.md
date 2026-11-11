# Punjab Exam Academy — Online Starter

A Next.js + Supabase foundation for a real online Punjab exam preparation portal.

## Included
- Responsive homepage and navigation
- MCQ quiz page with sample bilingual and English questions, answer feedback and scoring
- Notes, papers, notifications, about and admin entry pages
- Supabase schema (questions, resources, notifications, profiles, attempts)
- Starter seed question set
- SEO metadata
- Environment setup

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project; set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. In Supabase SQL Editor run `supabase/schema.sql`, then `supabase/seed.sql`.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000

Without Supabase env values, the app still opens and quiz uses bundled sample questions. Database-driven resource pages show empty-state messages.

## Deploy online
- Push this project to a Git repository.
- Import it into Vercel.
- Add the two Supabase environment variables in Vercel project settings.
- Deploy; then add your custom domain and configure Google Search Console.

## Important production work still required
This starter is a usable application foundation, **not yet a fully production-ready school platform**:
- Admin content CRUD UI is not implemented yet; `/admin` is an authentication entry, not a publishing CMS.
- Create secure admin provisioning (never allow users to change their own role); implement admin-only policies/server actions.
- Add full timed mock-test engine, student dashboard, bookmarks, saved attempts, password reset, email verification and bilingual content management.
- Add reviewed question bank and legally shareable PDFs. Seed data is deliberately small and illustrative; verify facts/questions before publication.
- Add rate limits, audit logs, backups, privacy/terms, error monitoring and automated tests before public launch.
