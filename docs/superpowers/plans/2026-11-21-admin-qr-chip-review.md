# Admin QR + Chip Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the demo SaaS into a secure single-admin product where the admin creates shops, chips, and QR codes, and customers scan, tap chips, copy an AI draft, and post it on Google.

**Architecture:** Admin pages are Server Components that read Prisma directly, with Route Handlers for mutations. The public review page gets a server-issued session, and the generate API derives all shop data from the QR token. Supabase handles admin login only, and RLS blocks direct public database access.

**Tech Stack:** Next.js 16.4 App Router, React 19, Tailwind 4, Prisma 7 with `adapter-pg`, Supabase Auth and Postgres, Gemini/OpenAI, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-admin-qr-chip-review-design.md`

## Global Constraints

- Read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code. `middleware.ts` is deprecated, use `src/proxy.ts`.
- No demo user, demo shop, placeholder credential, or silent database fallback in any path.
- Customers select 1-5 stars and 2-4 chips. Every rating gets the same flow and the same Google button.
- QR codes, shops, and chips are created only through `/api/admin/*`, guarded by `requireAdmin()`.
- No new runtime dependencies.
- Never commit `.env*`. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Nothing is pushed until Task 8. Only the squashed `main` is pushed.

## Review Focus

1. Low rating with a positive-sounding chip such as "Friendly staff": the draft must not praise it.
2. Repeated, excess, or another shop's chip IDs: the API rejects them and makes no AI call.
3. Clipboard blocked in an in-app browser: the Google link still opens and the customer sees the text selected for manual copy.
4. QR or shop deactivated after the page loaded: generate is refused.
5. Admin removes chips until fewer than 2 are active: the API refuses, so a printed QR never becomes unusable.

---

### Task 1: Lock down auth and remove self-serve surfaces

**Files:**
- Setup: local branch `backup/pre-redesign` (never pushed), then `feat/admin-qr-chips`
- Create: `src/lib/auth/guard.ts`, `src/lib/auth/redirect.ts`, `src/lib/env.ts`, `src/instrumentation.ts`, `src/proxy.ts`
- Modify: `src/lib/auth/session.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/server.ts`, `src/lib/prisma.ts`, `src/app/login/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`
- Delete: `src/middleware.ts`, `src/lib/auth/tenant.ts`, `src/app/{signup,onboarding,dashboard,forgot-password}/`, `src/app/api/shops/`, `src/app/api/auth/{signup,callback}/`, `src/app/api/admin/overview/`, `src/app/admin/AdminDashboardClient.tsx`, `prisma7.config.ts`, `tests/tenant-isolation.test.ts`, and `src/lib/supabase/admin.ts` if `grep` shows no importer
- Test: `tests/auth-guard.test.ts`

**Interfaces:**
- Produces: `getCurrentUser(): Promise<CurrentUserSession | null>`; `class AuthError(message: string, status: 401 | 403 | 503)`; `requireAdmin(): Promise<CurrentUserSession>`; `adminErrorResponse(error: unknown): NextResponse`; `safeRedirectPath(value: string | null | undefined, fallback = "/admin"): string`; `assertProductionEnv(env = process.env): void`

- [ ] **Step 1: Snapshot and branch**

```bash
git switch -c backup/pre-redesign && git add -A && git commit -m "chore: snapshot before redesign" && git switch -c feat/admin-qr-chips
```

- [ ] **Step 2: Write failing tests in `tests/auth-guard.test.ts`**

Assert:
- `getCurrentUser` returns `null` with no Supabase user and with a user that has no profile.
- A failed profile lookup rejects with `AuthError` status 503.
- `requireAdmin` rejects anonymous with 401, `SHOP_OWNER` with 403, and resolves for `SUPER_ADMIN`.
- `safeRedirectPath("/admin/shops/1")` is unchanged. `"//evil.com"`, `"https://evil.com"`, `"/\\evil.com"`, and `null` return `"/admin"`.
- `assertProductionEnv` throws naming a missing variable in production, throws if both AI keys are missing, and does nothing outside production.

- [ ] **Step 3: Run and confirm failure**

Run: `npx vitest run tests/auth-guard.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement the interfaces**

Required production variables: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, plus one of `GEMINI_API_KEY` or `OPENAI_API_KEY`. `src/instrumentation.ts` calls `assertProductionEnv()` in `register()`.

Remove placeholder Supabase values and the production database fallback. `src/proxy.ts` redirects anonymous `/admin` requests to `/login?redirectTo=...` and signed-in `/login` requests to `/admin`. The admin layout is the real check: anonymous redirects to `/login`, and a signed-in non-admin sees a no-access screen with sign out, because redirecting them would loop with the proxy. A failed login stays on `/login` with an error.

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/auth-guard.test.ts && npx tsc --noEmit`
Expected: PASS. Fix only type errors caused by this task. The old generate route is replaced in Task 4.

- [ ] **Step 6: Commit** `fix: require real admin auth and remove self-serve routes`

---

### Task 2: Add chips and fix the database rules

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `supabase/migrations/20261121000000_chips_and_security.sql`
- Test: `tests/migration-security.test.ts`

**Interfaces:**
- Produces: Prisma model `ReviewChip { id, shopId, label, sortOrder, isActive, createdAt, updatedAt }`, relation `Shop.chips`, `@@unique([shopId, label])`, `@@index([shopId, isActive, sortOrder])`, table `review_chips`.

- [ ] **Step 1: Write a failing test that reads the migration text**

Assert it creates `review_chips`, enables RLS on it, contains `shop_members.user_id = has_shop_access.user_id`, redefines `handle_new_user` without `raw_user_meta_data->>'role'`, and drops the policies `"Anyone can create review sessions"`, `"Sessions can create review drafts"`, `"Anyone can record analytics events"`, and `"Shop members can view QR codes"`.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/migration-security.test.ts`
Expected: FAIL, file not found.

- [ ] **Step 3: Implement**

Add `@db.Uuid` to every `id` and foreign key in the Prisma schema to match the SQL. Do not edit the existing migration. New signups always get `CUSTOMER`, so only a role set manually in the database can reach admin. Recreate QR read access for shop members only.

- [ ] **Step 4: Verify**

Run: `npx prisma validate && npx prisma generate && npx vitest run tests/migration-security.test.ts && npx tsc --noEmit`
Expected: all pass. If a local `postgres` binary exists, apply both migrations to a disposable database with a stub `auth` schema. Otherwise record the SQL as not executed.

- [ ] **Step 5: Commit** `feat: add review chips and harden database policies`

---

### Task 3: Chip-based AI drafts

**Files:**
- Create: `src/lib/reviews/rules.ts`
- Modify: `src/lib/ai/provider.interface.ts`, `src/lib/ai/prompt-builder.ts`, `src/lib/ai/ai-router.ts`
- Test: `tests/ai-prompt-builder.test.ts`, `tests/ai-router-fallback.test.ts`, `tests/review-rules.test.ts`

**Interfaces:**
- Produces: `MIN_CHIPS = 2`, `MAX_CHIPS = 4`, `MAX_ACTIVE_CHIPS = 12`, `MAX_DRAFTS_PER_SESSION = 5`, `MAX_DRAFTS_PER_SHOP_PER_HOUR = 120`, `isAllowedGoogleReviewUrl(url: string): boolean`.
- `GenerateReviewDraftInput` replaces `verifiedBusinessFacts` and `customerNotes` with `rating: number` and `chips: string[]`. `style` stays and callers pass `"natural"`.

- [ ] **Step 1: Update tests**

Assert:
- The prompt contains the shop, category, rating, and each chip, and forbids invented staff names, purchases, prices, and dates.
- Rating 1 or 2 includes `Do not praise`, rating 3 includes `balanced`, rating 4 or 5 includes `positive`.
- The fallback draft for rating 2 with `["Friendly staff"]` contains the chip and does not contain `great`, `excellent`, or `loved`.
- `isAllowedGoogleReviewUrl` accepts HTTPS on `google.com`, `www.google.com`, `search.google.com`, `maps.google.com`, `g.page`, `maps.app.goo.gl`, and `g.co`. It rejects HTTP, `google.com.evil.com`, and `evil.com/google.com`.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/ai-prompt-builder.test.ts tests/ai-router-fallback.test.ts tests/review-rules.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** the rules, prompt, and fallback template in `en`, `hi`, and `hinglish`. Low-rating text treats chips as topics to improve.

- [ ] **Step 4: Verify** with the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit** `feat: generate review drafts from rating and chips`

---

### Task 4: Secure public review APIs and page data

**Files:**
- Modify: `src/app/api/review/generate/route.ts`, `src/app/api/analytics/event/route.ts`, `src/app/r/[token]/page.tsx`
- Create: `src/app/r/[token]/not-found.tsx`, `src/app/r/[token]/error.tsx`
- Test: `tests/customer-review-flow.test.ts`

**Interfaces:**
- `POST /api/review/generate` body: `{ token: string, sessionId: uuid, rating: 1-5, chipIds: uuid[] }`. Returns `{ draftId, draftText }`.
- `POST /api/analytics/event` body: `{ token, sessionId: uuid, eventType: "copy_click" | "regenerate_click" | "google_review_click", draftId?: uuid }`. The server derives `shopId` and `qrCodeId`.
- Page passes `CustomerReviewClient` props: `{ token, sessionId, shop: { name, businessCategory, logoUrl, primaryColor, googleReviewUrl }, chips: { id, label }[] }`.

- [ ] **Step 1: Rewrite tests**

Assert, with `aiRouter.generateReviewDraft` not called on any rejection:
- Valid request returns 200 and passes chip labels, rating, and the shop's AI provider.
- Unknown token, inactive QR, or inactive shop returns 404.
- Session from another QR returns 403.
- 1 chip, 5 chips, or duplicate chips return 400.
- Inactive or another shop's chip returns 400.
- Session at 5 drafts or shop at 120 drafts in the last hour returns 429.
- A database failure returns 503.
- Analytics with a mismatched token and session returns 403.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/customer-review-flow.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

The page uses React `cache()` for its QR lookup and calls `notFound()` if the QR or shop is inactive, or if fewer than 2 active chips exist. Database errors reach `error.tsx`. The scan increment, session, and events share one transaction. Add `robots: { index: false }`.

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/customer-review-flow.test.ts && npx tsc --noEmit`
Expected: PASS after a minimal prop update in `CustomerReviewClient`, which Task 6 rebuilds.

- [ ] **Step 5: Commit** `feat: secure public review flow`

---

### Task 5: Admin APIs for shops, chips, and QR codes

**Files:**
- Create: `src/app/api/admin/shops/route.ts`, `.../shops/[id]/chips/route.ts`, `.../chips/[chipId]/route.ts`, `.../shops/[id]/qr-codes/route.ts`, `.../qr-codes/[qrId]/route.ts`, `.../qr-codes/[qrId]/download/route.ts`
- Modify: `src/app/api/admin/shops/[id]/route.ts`, `src/lib/qr/generator.ts`
- Test: `tests/admin-api.test.ts`, `tests/qr-generator.test.ts`

**Interfaces:**
- `POST /shops`: `{ name, businessCategory, googleReviewUrl, defaultLanguage, logoUrl?, primaryColor?, chips: string[2..12] }`. Creates the shop, chips, and first QR.
- `PATCH|DELETE /shops/[id]`. `POST|PATCH /shops/[id]/chips`, where PATCH is `{ orderedIds: uuid[] }`. `PATCH|DELETE /chips/[chipId]`.
- `POST /shops/[id]/qr-codes`: `{ name }`. `PATCH|DELETE /qr-codes/[qrId]`. `GET .../download?format=png|svg` returns an attachment.

- [ ] **Step 1: Write failing tests**

Assert:
- Every handler returns 401 anonymously and 403 for non-admins, with no database write.
- Non-Google review URLs return 400.
- A new shop's QR `destinationUrl` ends with its own `publicToken`.
- Case-insensitive duplicate chips return 409.
- Deactivating or deleting a chip that would leave fewer than 2 active returns 409.
- A chip or QR ID from another shop returns 404.
- Download sets `Content-Disposition: attachment` and the right content type.
- Generated QR output uses `#111111` even when a light brand color is passed, so printed codes stay scannable.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/admin-api.test.ts tests/qr-generator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** with `requireAdmin()` first and `adminErrorResponse()` in each catch. Shop `ownerId` is the admin's ID. QR URLs use `NEXT_PUBLIC_APP_URL`, never request headers. Mutations write an audit log.

- [ ] **Step 4: Verify** with the Step 2 command plus `npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: add admin shop, chip, and QR APIs`

---

### Task 6: Research, design system, and customer page

**Files:**
- Create: `docs/design/2026-11-21-design-direction.md`, `src/lib/reviews/copy-draft.ts`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*` as needed, `src/app/r/[token]/CustomerReviewClient.tsx`, `src/app/r/[token]/not-found.tsx`, `src/app/r/[token]/error.tsx`
- Test: `tests/copy-draft.test.ts`

**Interfaces:**
- Produces: `copyDraft(text: string, clipboard: Pick<Clipboard, "writeText"> | undefined): Promise<boolean>`

- [ ] **Step 1: Research**

Open refero.design and Pinterest in a new Chrome tab group. Study mobile review flows, chip selectors, admin tables, and QR print layouts. Record patterns and decisions in the design doc. Take no copied assets or brand identity. If a site requires login, stop and ask the user.

- [ ] **Step 2: Load `frontend-design` and read `13-fonts.md`.** Replace the glass, gradient, and Google-color styling with one token system.

- [ ] **Step 3: Write and fail `tests/copy-draft.test.ts`**, asserting `true` on success and `false` for rejected or missing clipboard.

- [ ] **Step 4: Build the customer page**

One column: shop identity, stars, chips, generate button enabled at 2 chips and capped at 4, editable draft, regenerate, and **Copy & Next**. Copy & Next is a real `<a target="_blank" rel="noopener noreferrer">`, so the browser opens Google within the click while `onClick` starts the copy. On failure, select the textarea and show manual-copy text. Analytics use `keepalive`. Touch targets are at least 44px, with visible focus and reduced-motion support.

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/copy-draft.test.ts && npx tsc --noEmit && npx eslint .`
Check 360px, 390px, and desktop in Chrome. Expected: no overflow, and all states are usable.

- [ ] **Step 6: Commit** `feat: redesign customer review experience`

---

### Task 7: Admin panel and information-only landing page

**Files:**
- Create: `src/app/admin/shops/new/page.tsx`, `src/app/admin/shops/[id]/page.tsx`, focused client components in `src/app/admin/_components/` for shop form, chip manager, and QR manager
- Modify: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/r/page.tsx`
- Test: `tests/public-surface.test.ts`

- [ ] **Step 1: Write a failing test** that reads `src/app/page.tsx` and `src/app/r/page.tsx` and asserts no `/onboarding`, `/signup`, `/dashboard`, `/admin/shops/new`, or `demo-token`, and that `src/` contains no `demo-shop-id`, `demo-user-id`, or `Artisan Coffee`.

- [ ] **Step 2: Run and confirm failure.** Run: `npx vitest run tests/public-surface.test.ts`. Expected: FAIL.

- [ ] **Step 3: Build the admin panel**

`/admin` shows totals and a searchable shop table. `/admin/shops/new` creates a shop with chips. `/admin/shops/[id]` has details, chip add/rename/reorder/toggle/delete, QR create/toggle/delete/PNG/SVG, and scans, drafts, copies, and Google clicks. Include loading, empty, error, and delete-confirmation states.

- [ ] **Step 4: Build the landing page** as information only, with no pricing or creation path.

- [ ] **Step 5: Verify**

Run: `npx vitest run && npx tsc --noEmit && npx eslint . && npm run build`
Expected: all pass. Check `/`, `/login`, and `/admin` at mobile and desktop widths.

- [ ] **Step 6: Commit** `feat: redesign admin panel and landing page`

---

### Task 8: Production verification and GitHub push

**Files:**
- Modify: `README.md`, `.gitignore` (add `!.env.example`), `.env.example`

- [ ] **Step 1: Update docs** with setup, migrations, creating the one admin, disabling public signup in Supabase, and deployment variables. Remove old SaaS claims.

- [ ] **Step 2: Verify a production build with no credentials** using an isolated copy and unreachable local services.

Expected: anonymous `/api/admin/shops` POST returns 401, `/admin` redirects to `/login`, an unknown `/r/<token>` shows the unavailable page, and no response contains demo data.

- [ ] **Step 3: If Supabase keys are in `.env`, run the full flow**

Admin login, create shop, add chips, create QR, scan URL, tap chips, generate, Copy & Next. If keys are missing, report this flow as not verified.

- [ ] **Step 4: Squash and scan**

```bash
git switch main && git merge --squash feat/admin-qr-chips
git diff --cached --name-only | grep -E '(^|/)\.env($|\.)' | grep -v '^\.env\.example$'
```

Expected: the grep prints nothing. Rerun the secret-pattern scan on staged files, then commit `feat: launch admin QR review platform`.

- [ ] **Step 5: Push `main` using the approved `semsorted` login without changing the active account**

```bash
git remote add origin https://github.com/semsorted/reviews.git
git -c credential.helper= -c credential.helper='!f(){ echo username=semsorted; echo password=$(gh auth token --user semsorted); };f' push -u origin main:main
```

Never force-push. If the remote is no longer empty, stop and ask.

- [ ] **Step 6: Confirm** with `gh repo view semsorted/reviews --json defaultBranchRef,isEmpty` and compare the remote `main` SHA with local `HEAD`.
