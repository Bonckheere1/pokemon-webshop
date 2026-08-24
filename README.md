# Poké Mart

A small full-stack webshop for buying Pokémon. Built as a demo/test app — not a real store.

- **Backend**: Node.js + Express + TypeScript, SQLite (via `better-sqlite3`) for products, cart and orders.
- **Frontend**: React + TypeScript + Vite, served in production via nginx.
- **Containers**: one Dockerfile per service, wired together with `docker-compose.yml`.

## Features

- Product grid seeded with ~16 Pokémon, each with a type, price, description and sprite.
- Product detail page with quantity selector and "Add to cart".
- Session-based cart (a `sessionId` cookie identifies the cart, no login required) stored in SQLite.
- Checkout flow that totals the cart, creates an order row, and clears the cart.
- Graded card marketplace — sellers register/log in, list professionally graded singles (grading
  company, grade, cert number, price) for sale, and buyers browse/search and buy them, optionally
  applying a trade-in credit at checkout. See `/graded-cards` and `/sell`.

## Project structure

```
pokemon-webshop/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.ts        entrypoint, session cookie, route mounting
│   │   ├── db.ts             SQLite connection + schema
│   │   ├── seed.ts           seeds products + a demo seller/listings on first boot
│   │   ├── auth.ts           seller JWT signing + requireSeller middleware (see below)
│   │   └── routes/
│   │       ├── products.ts
│   │       ├── cart.ts
│   │       ├── imageProxy.ts
│   │       ├── gradedCards.ts  listings, search, purchase (see below)
│   │       └── sellerAuth.ts   seller register/login (see below)
│   └── data/                 SQLite file lives here (gitignored)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── pages/            Home, ProductDetail, Cart, GradedCards, GradedCardDetail, Sell
        ├── components/       Navbar, ProductCard
        └── api.ts            axios client for the backend API
```

## Running locally without Docker

```bash
# terminal 1
cd backend
npm install
npm run dev        # http://localhost:4000

# terminal 2
cd frontend
npm install
npm run dev         # http://localhost:3000
```

## Running with Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api (health check at `/api/health`)

The SQLite database persists in a named volume (`backend-data`) so cart/orders survive container restarts. Delete it with `docker compose down -v` to reset the shop.

## Security testing notes (intentional CVEs)

This repo intentionally pins some old, vulnerable dependencies and base images so it can be
used as a fixture for testing security scanners (e.g. Aikido's CVE exploitability / container
reachability analysis). **Do not reuse these Dockerfiles or dependency pins for anything real.**

| Location | Package/Image | Version | Known issues (verified via `npm audit`) | Reachable at runtime? |
|---|---|---|---|---|
| `backend` | `lodash` | 4.17.15 | High severity — command injection ([GHSA-35jh-r3h4-6jhm](https://github.com/advisories/GHSA-35jh-r3h4-6jhm)), prototype pollution ([GHSA-p6mc-m468-83gw](https://github.com/advisories/GHSA-p6mc-m468-83gw), [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)), ReDoS ([GHSA-29mw-wpgm-hmr9](https://github.com/advisories/GHSA-29mw-wpgm-hmr9)) | **Yes** — `routes/cart.ts` calls `merge({}, defaults, req.body.customization)` with unvalidated client input on `POST /api/cart`. |
| `backend` | `axios` | 0.21.1 | High severity — prototype pollution affecting request construction ([GHSA-mmx7-hfxf-jppx](https://github.com/advisories/GHSA-mmx7-hfxf-jppx), [GHSA-7q8q-rj6j-mhjq](https://github.com/advisories/GHSA-7q8q-rj6j-mhjq)), NO_PROXY bypass ([GHSA-pjwm-pj3p-43mv](https://github.com/advisories/GHSA-pjwm-pj3p-43mv)) | **Yes** — `routes/imageProxy.ts` calls `axios.get(url)` on every request to `GET /api/image-proxy`, where `url` is a fully attacker-controlled, non-allowlisted query param — an SSRF sink independent of the axios CVEs, made worse by them. |
| `backend` (devDependency) | `minimist` | 1.2.5 | Critical severity — prototype pollution ([GHSA-xvch-5gv4-984h](https://github.com/advisories/GHSA-xvch-5gv4-984h)) | **No** — pinned as a direct devDependency but never imported by app code; not present in the runtime image's execution path. |
| `frontend` | `axios` | 0.21.1 | Same package, more advisories apply in this tree — adds Proxy-Authorization credential leaks on redirect ([GHSA-p92q-9vqr-4j8v](https://github.com/advisories/GHSA-p92q-9vqr-4j8v), [GHSA-j5f8-grm9-p9fc](https://github.com/advisories/GHSA-j5f8-grm9-p9fc)) and cookie-based ReDoS ([GHSA-hfxv-24rg-xrqf](https://github.com/advisories/GHSA-hfxv-24rg-xrqf)) | **Yes** — used for every API call in `src/api.ts`, shipped in the built JS bundle served by nginx. |
| `frontend` (incidental, not pinned old on purpose) | `react-router-dom` | ^6.28.0 | Moderate — open redirect and SSR hydration issues ([GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg)) | Present in the shipped bundle; surfaced by `npm install` picking up a current-but-still-flagged range. Left as-is since it's real signal, not manufactured. |
| `backend` (build + runtime stage) | `node` base image | `18.0.0` | Multiple OS-level CVEs (Debian package versions frozen at Apr 2022) | Yes, image-level (this is the image that actually runs). |
| `frontend` (serve stage) | `nginx` base image | `1.21.0` | Multiple OS-level CVEs (Debian package versions frozen at May 2021) | Yes, image-level (this is the image that actually runs). |

Note: the frontend's build stage uses a current `node:20-alpine` — it never ships (only its
`/app/dist` output is copied into the nginx image), and Vite 6 doesn't run on `node:18.0.0`
anyway, so pinning it old would add no real CVE surface while breaking the build.

All of the above was verified locally with `npm audit` in both `backend/` and `frontend/` right
after `npm install` — re-run it there to get current advisory data for your own scan comparison.

To reset for normal development, bump these to current versions and swap the base images for
`node:lts` / `nginx:stable` (or alpine variants).

## Injected source-code vulnerabilities (this branch)

On top of the dependency/base-image CVEs above, the graded-card marketplace added in this branch
carries its own set of hand-written vulnerabilities in real, reachable application code, in the
same spirit as (and mostly independent from) the ones in the checkout/admin PR. **Every entry
below was manually exploited against a running instance to confirm it's a real, working bug** —
see the PR description for exact `curl` commands, including a full chain run against the seeded
demo listings.

| # | Vulnerability | CWE | Where | How it's reachable |
|---|---|---|---|---|
| 1 | Broken authentication — signature never verified | CWE-347 | `auth.ts` `requireSeller` | The seller-auth middleware reads the Authorization bearer token with `jwt.decode()` instead of `jwt.verify()`. `decode()` only base64-decodes the payload; it never checks the token against `JWT_SECRET`. Anyone can hand-craft a token with any `sellerId` and an arbitrary/empty signature segment and be treated as that seller — no login, no secret, no valid signature required. |
| 2 | Weak password storage | CWE-916 | `routes/sellerAuth.ts` `hashPassword` | Seller passwords are hashed with unsalted MD5 — fast, unsalted, and trivially reversible with a rainbow table if the hash table is ever read (see #4). |
| 3 | IDOR / broken object-level authorization | CWE-639 | `routes/gradedCards.ts` `PATCH /:id`, `DELETE /:id` | Both routes require *a* valid-shaped seller token (via #1) but never check that the token's `sellerId` actually owns the listing being modified. Any seller — or an attacker with a forged token for a `sellerId` that never even registered — can reprice, mark-sold, or delete any other seller's listing. |
| 4 | SQL injection | CWE-89 | `routes/gradedCards.ts` `GET /graded-cards/search` | `company` and `grade` query params are concatenated directly into the `WHERE` clause. A UNION payload matching `graded_cards`'s 11 columns (e.g. `' UNION SELECT id,id,username,password_hash,'x','x','x',0,'x','listed',created_at FROM sellers --`) dumps every seller's username and password hash through the public search endpoint. |
| 5 | OS command injection | CWE-78 | `routes/gradedCards.ts` `logCertVerification` | Creating a listing logs the submitted `certNumber` via an unquoted, unsanitized `child_process.exec` shell string. A cert number like `PSA1; touch /tmp/pwned #` runs arbitrary commands the moment a seller (or an attacker with a forged token per #1) lists a card. |
| 6 | Business logic flaw — client-supplied trade-in value trusted verbatim | CWE-840 | `routes/gradedCards.ts` `POST /:id/purchase` | `tradeInValue` from the request body is subtracted from the listing's server-side price with no appraisal step, no floor, and no cap, so a buyer can set it equal to (or above) the listing price and acquire a graded card for free. |

Chain example (#1 → #3 → #6), run against the seeded `demo_seller` listings with **no real seller
credentials at any point**: forge a token claiming `sellerId: 1` (the real `demo_seller`) with a
throwaway signature → `PATCH /api/graded-cards/2` to drop the seeded $2,499.00 PSA 10 Blastoise to
$0.01 → `POST /api/graded-cards/2/purchase` as an anonymous buyer. Verified end to end; the
purchase completes for $0.01.

Separately, #4 gives a second, fully independent path to the same seller accounts: the SQLi
dumps `sellers.password_hash`, which (per #2) is crackable offline in seconds.
