# Punjab Exam Academy

Next.js 14 + Supabase starter for free Punjab competitive-exam preparation.

## Local setup
1. Install Node.js 20+.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and add the Supabase project URL and **anon/publishable key**.
4. Run `npm run dev`.

## Supabase setup
1. Review and run `supabase/schema.sql` in Supabase SQL Editor on a fresh project.
2. Enable email confirmation in Supabase Auth.
3. Create an account at `/account`; the SQL trigger creates a student profile.
4. To grant admin, identify the user's Auth UUID and run as project owner:
   `update public.profiles set role='admin' where id='<AUTH_USER_UUID>';`
5. Never put the Supabase service-role key in `NEXT_PUBLIC_*`, client code, or Git.

## Routes
- `/` home
- `/account` student registration/login
- `/quiz` MCQ practice
- `/mock-tests` timed practice
- `/notes` study notes
- `/papers` previous papers
- `/notifications` notices
- `/admin` administrator sign-in (content CRUD is not yet implemented)
- `/privacy`, `/terms`, `/about`

## Security
Baseline headers are configured in `next.config.js`; Supabase RLS policies are in `supabase/schema.sql`. This is a development starter, not a security certification. Review policies, test in a staging project, configure backups/monitoring, and complete production security review before handling real users.
