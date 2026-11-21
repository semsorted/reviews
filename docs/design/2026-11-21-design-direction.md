# Design Direction

## Research

- Refero's public Pinterest style reference: one strong action color on a quiet surface, pill-shaped controls, matte surfaces, and hierarchy through type size.
- Pinterest public search for mobile review UI: stars first, tappable pills below them, and one primary action at the bottom of the screen.
- Pinterest shows a login dialog over its results, so only the publicly visible results were reviewed. No account was used and no assets were copied.

## Concept: the counter slip

The product lives at a shop counter, so the review draft appears as a printed slip. That slip is the one memorable element. Everything around it stays calm.

## Tokens

| Name | Value | Role |
|---|---|---|
| Mist | `#EEF3F0` | Page background |
| Paper | `#FFFFFF` | Slip and form surfaces |
| Ink | `#14211D` | Text |
| Moss | `#52645D` | Secondary text |
| Pine | `#0E4F3F` | Primary action and selected chips |
| Marigold | `#F2A900` | Stars only |
| Line | `#CBD8D2` | Borders |

## Type

- Bricolage Grotesque for headings.
- Mukta for body text, because it covers Latin and Devanagari in one family.

## Layout

```
Customer (one column)          Admin
[logo] Shop name               Shops | + Add shop
How was your visit?            search
★ ★ ★ ★ ★  Good                shop rows with live numbers
What stood out?
(chip) (chip) (chip)           Shop detail
┌ Your review ───┐             details | chips | QR codes
│ editable draft │
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
[ Copy & Next ]  sticky
```

## Principles

- Left-aligned text, one primary action per screen, and sentence case.
- Stars have no preselected value, so the customer's rating is their own.
- Motion appears only when the slip prints after the customer asks for a draft.
