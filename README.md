# Poké Mart

A small full-stack webshop for buying Pokémon. Built as a demo/test app — not a real store.

- **Backend**: Node.js + Express + TypeScript, SQLite (via `better-sqlite3`) for products, cart and orders.
- **Frontend**: React + TypeScript + Vite, served in production via nginx.
- **Containers**: one Dockerfile per service, wired together with `docker-compose.yml`.

## Features

- Product grid seeded with 26 Pokémon, each with a type, price, description and sprite.
- Pokémon boxes — themed bundles (e.g. "Kanto Starters Box", "Legendary Vault Box") that behave like
  any other product, browsable in a separate "Boxes" tab on the home page.
- Product detail page with quantity selector and "Add to cart".
- Session-based cart (a `sessionId` cookie identifies the cart, no login required) stored in SQLite.
- Checkout flow that totals the cart, creates an order row, and clears the cart.

## Project structure

```
pokemon-webshop/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.ts        entrypoint, session cookie, route mounting
│   │   ├── db.ts             SQLite connection + schema
│   │   ├── seed.ts           seeds products on first boot
│   │   └── routes/
│   │       ├── products.ts
│   │       ├── cart.ts
│   │       └── imageProxy.ts
│   └── data/                 SQLite file lives here (gitignored)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── pages/            Home, ProductDetail, Cart
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
