<!-- Copilot instructions for working on the Food Delivery API (repository: api) -->

Purpose
- Give AI coding agents the essential, actionable knowledge to be productive in this repository and in the multi-app workspace (MenuVerse, ChopChop, DeliverMi).

Quick architecture summary
- Backend: Node.js + Express + Apollo Server (see `index.js`, `schema.js`). GraphQL endpoint: `/graphql` (default port 4000).
- Persistence: SQLite via `better-sqlite3` (`database.js`) for primary domain data (users, restaurants, orders).
- Auth & Messaging: Firebase Admin (`firebase.js`) used for ID token verification and FCM pushes; Firestore used as a lightweight store for rider tokens (`riders` collection).
- Frontends (outside this repo): `MenuVerse/` (vendor UI, Next.js) and `DeliverMi/` (rider app, Next.js). They communicate with this API via GraphQL and a few REST endpoints.

Key integration points (files & endpoints)
- `index.js`:
  - Express app + auth middleware that verifies Firebase ID tokens and sets `req.user`.
  - REST endpoints: `POST /notify-ready` (vendors call this to notify riders) and `GET /order-driver/:orderId` (returns assigned rider info for a restaurant).
- `schema.js`:
  - GraphQL schema and resolvers. Important mutations: `placeOrder`, `updateOrderStatus`, `assignRider`, `riderUpdateOrderStatus`, `riderReportNotReady`, `riderCancelOrder`.
  - Notifications: code paths that call Firebase Admin `messaging().sendMulticast` and include `data.url` (deep-link into DeliverMi).
- `database.js`:
  - SQLite schema, helper functions `dbHelpers.*` (e.g., `createOrder`, `getOrderById`, `getAvailableOrders`). Use these helpers rather than raw SQL where possible.
- `notifyScheduler.js` (dev scheduler): lightweight in-memory scheduler used to schedule a reminder ~7 minutes before ETA. For production replace with durable queue.

Environment and secrets (important)
- Server-side (API): expects typical Firebase Admin env vars / service account via `firebase.js` (see `ENVIRONMENT-VARIABLES.md` in repo root). Also:
  - `DELIVERMI_URL` — used to build deep links to the rider app (default `http://localhost:9010`).
  - `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID` (for admin SDK).
- Frontends: `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_VAPID_KEY` are required for FCM web push.

Developer workflows & commands
- Run API in dev: `cd api && npm install && npm run dev` (uses `nodemon index.js`). GraphQL available at `http://localhost:4000/graphql`.
- Tests: `cd api && npm test` (some tests are under `tests/` and there are CI scripts in `.github/workflows/ci-cd.yml`).
- When modifying notifications, inspect `admin.firestore().collection('riders')` usage and payload `data.url` (SW click opens that URL in DeliverMi).

Project-specific patterns & conventions
- DB access centralised in `database.js` through `dbHelpers` — prefer those helpers for consistency and to preserve JSON encoding conventions (`orderItems` and `statusHistory` are stored as JSON strings).
- Authentication: resolvers and REST endpoints expect `req.user` (decoded Firebase token) — use this for authorization checks (e.g., restaurant owner guard in `/notify-ready`).
- Notifications: server sends FCM payloads with both `notification` and `data` fields. `data.url` must be present for service-worker deep-link handling.
- Scheduling: the repo contains a simple in-memory scheduler (`notifyScheduler.js`) — this is intentionally ephemeral (dev). For production, add a durable queue (Redis + Bull or similar) and enqueue jobs instead of using in-process timers.

Files to read first (fast path)
- `index.js` — app entry, auth middleware, REST endpoints
- `schema.js` — GraphQL types and business logic for orders and riders
- `database.js` — schema and helper methods (how orders are stored/encoded)
- `firebase.js` — Admin SDK initialization and CI guard patterns
- `notifyScheduler.js` — small scheduler used by current codebase (dev-only)

Common gotchas for automatic edits
- Avoid modifying the SQLite schema directly without using `ensureOrderColumns()` migration helper (see `database.js`).
- Maintain JSON/string encoding conventions: `orderItems` and `statusHistory` are stored as JSON strings in the `orders` table.
- Keep REST and GraphQL auth checks consistent (use `req.user.uid` and restaurant `ownerId` from `restaurants` for ownership checks).

Cross-repo notes (MenuVerse & DeliverMi)
- MenuVerse (vendor UI) calls `POST /notify-ready` after marking an order ready; ensure the request includes a Firebase ID token in `Authorization: Bearer <token>` (MenuVerse sets this). See `MenuVerse/src/app/(app)/orders/page.tsx` for example.
- DeliverMi (rider) listens for FCM and expects `data.url` to deep-link; service worker is at `DeliverMi/public/firebase-messaging-sw.js` and client FCM helpers live in `DeliverMi/src/lib/firebase.js`.

How to help: examples AI agents can do immediately
- Add a durable job queue: scaffold Redis + Bull worker that processes reminder jobs. Replace `notifyScheduler.js` usage with enqueueing a job with payload `{orderId, sendAt}`.
- Add MenuVerse UI: highlight late orders by comparing `expectedTime` to `Date.now()` and call `GET /order-driver/:orderId` to show driver details.
- Harden ownership checks: ensure `/notify-ready` validates the caller is restaurant owner (example code in `index.js`).

If anything is unclear
- Ask for the runtime environment you will target (local dev with `DELIVERMI_URL=http://localhost:9010` and Firebase admin credentials, or a deployed environment). Point to specific files you want updated and I will make minimal, safe edits.

---
Please review this file and tell me which area you want extended (more examples, PR templates, or a runbook for replacing the in-memory scheduler with Bull).
