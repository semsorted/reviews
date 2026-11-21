# Admin QR + Chip Review Design

Status: approved in conversation on 2026-11-21.

## Intent

A single admin creates shops, review chips, and QR codes. A customer scans a QR code, taps a few chips, gets an AI-written Google review draft based on those chips, copies it, and lands on the shop's Google review page to paste and post. The product must look international-grade and be safe to run in production.

## Goals

- Admin-only creation of shops, chips, and QR codes.
- Customer flow with no login: scan, stars, 2-4 chips, draft, Copy & Next, Google.
- Clean, premium, mobile-first customer page and a simple admin panel, informed by Refero and Pinterest research.
- Real auth, real errors, no demo data in any production path.

## Non-goals

- Public signup, self-serve onboarding, shop owner logins, pricing, billing.
- Posting to Google on the customer's behalf.
- Dropping the unused plan, subscription, and member tables. They stay until a later cleanup migration.

## Anti-goals

- A ready-made positive review shown before the customer gives any input.
- Different treatment for low ratings. Every rating gets the same flow and the same Google button.
- Fake shop data shown when a token is wrong or the database is down.

## Approaches

1. **Chips with stars (picked).** The customer gives a rating and taps 2-4 admin-defined chips. Fast, and the draft reflects real input.
2. **Instant review on scan (rejected).** Fastest, but it supplies wording with no customer experience behind it, which conflicts with Google's fake engagement policy and risks removed reviews or a paused profile.
3. **Typed questions (rejected).** Richer input, but slower on a phone and not what the user chose.

## Customer flow (`/r/[token]`)

1. Server loads the QR code and shop. Unknown token, inactive QR, or inactive shop shows a clean unavailable page. A database failure shows an error state, never demo data.
2. Customer picks 1-5 stars and 2-4 chips. The generate button enables at 2 chips, so a third or fourth tap is not cut off by auto-generation.
3. Server generates the draft from the shop, rating, and selected chips. The customer can edit it or regenerate.
4. **Copy & Next** copies the text and opens the shop's Google review URL inside the same click, so browsers allow both.

## Admin panel (`/admin`)

- One login. Access requires a `SUPER_ADMIN` profile.
- Shops: list, add, edit, activate, deactivate.
- Chips per shop: add, rename, reorder, activate, deactivate, delete.
- QR codes per shop: generate, name, activate, deactivate, download PNG and SVG, see scan counts.
- Basic per-shop numbers: scans, drafts, copies, Google clicks.

## Data

- Add `ReviewChip`: `id`, `shopId`, `label`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`.
- Align Prisma IDs and foreign keys with the UUID columns in the SQL migration.
- New forward migration for chips and security fixes. The existing migration is not edited.

## Security and production rules

- Remove every demo user, demo shop, and auth fallback. No session means 401 or a login redirect.
- Unknown profile means no access. Roles are never read from signup metadata.
- Supabase public signup must be turned off in the Supabase dashboard. The admin account is created there by the user.
- Fix `has_shop_access` and tighten RLS so public clients cannot write directly.
- All admin APIs check `requireSuperAdmin` on the server.
- Public generate API accepts a QR token, session ID, rating, and chip IDs. The server verifies that the QR is active, the session belongs to it, and the chips belong to its shop.
- Generation is capped per session and per shop per hour to bound AI cost.
- Google review URLs must be HTTPS on an allowed Google host.
- Auth redirects accept same-site relative paths only.
- Production fails clearly when required environment variables are missing.

## AI rules

- The prompt uses the shop name, category, rating, and selected chips only.
- It must not invent staff names, purchases, prices, dates, or details.
- The tone follows the rating. Low ratings stay honest.
- If providers fail, a plain template built from the same chips is used.

## Remove

`/signup`, `/onboarding`, `/dashboard`, `/forgot-password`, shop owner APIs, member APIs, pricing sections, and all demo content. The landing page stays as information only, with no creation links.

## Left to the builder

- Final visual system, based on the Refero and Pinterest research.
- Exact rate-limit values, kept in one place.
- Whether admin password reset is handled through the Supabase dashboard for now.

## Known risk

AI-assisted drafts can still draw scrutiny from Google even with real customer input. This design lowers that risk but does not remove it.
