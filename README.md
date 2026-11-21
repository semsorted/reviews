# Review QR

Review QR helps shop customers write and post an honest Google review from a QR code.

An admin creates each shop, its review chips, and its QR codes. A customer scans the code, picks a star rating and 2 to 4 chips, edits the AI draft, copies it, and posts it on the shop's Google review page.

## Stack

Next.js 16, React 19, Tailwind CSS 4, Prisma 7, Supabase Auth and Postgres, Gemini or OpenAI, and Vitest.

## Setup

1. Install dependencies and create your local environment file.

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. Fill in `.env.local`.

   | Variable | Required | Purpose |
   |---|---|---|
   | `NEXT_PUBLIC_APP_URL` | Yes | Public site URL encoded in every QR code |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public key |
   | `DATABASE_URL` | Yes | Supabase Postgres connection string |
   | `GEMINI_API_KEY` or `OPENAI_API_KEY` | One of them | AI provider key |
   | `GEMINI_MODEL`, `OPENAI_MODEL` | No | Override the default model |
   | `DEFAULT_AI_PROVIDER` | No | `gemini` or `openai` |
   | `ENABLE_AI_FALLBACK` | No | Set to `false` to disable provider fallback |

3. Run both SQL files in `supabase/migrations/`, oldest first, using the Supabase SQL editor or CLI.

4. Create the admin.
   - In Supabase, open **Authentication > Users** and add a user with a strong password.
   - In the SQL editor, run:

   ```sql
   UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE email = 'your-admin@example.com';
   ```

5. Turn off **Allow new users to sign up** in the Supabase Auth settings. The app has no public signup.

6. Confirm that only your account is an admin.

   ```sql
   SELECT id, email FROM public.profiles WHERE role = 'SUPER_ADMIN';
   ```

   To recover the admin account, reset its password in Supabase. Do not delete the user, because shops are protected from that deletion.

7. Start the app and sign in at `/login`.

   ```bash
   npx prisma generate
   npm run dev
   ```

## Deployment

- Set every required variable in your host before building. The server refuses to start in production if one is missing.
- Set `NEXT_PUBLIC_APP_URL` to the final domain before printing QR codes. Printed codes keep the URL they were downloaded with.
- `npm run build` generates the Prisma client.
- Use an HTTPS domain and a database URL with `sslmode`. For full certificate checks, use `sslmode=verify-full` with Supabase's CA certificate.
- Add edge rate limits for `/r/*`, `/api/review/generate`, and `/api/analytics/event` in your host or CDN, about 30 requests per minute per IP. The app caps AI spend itself, but it cannot stop a script from creating scan records.

## Checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Review policy

Customers choose their own rating and post the review themselves. Every rating gets the same path to Google, and drafts use only the rating and chips the customer selected. AI-assisted reviews can still draw scrutiny from Google, so keep chips neutral and never pressure customers or offer rewards for reviews.
