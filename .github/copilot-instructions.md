PurposeProvide AI coding agents with essential, actionable knowledge to contribute productively to this repository and the multi-app workspace (MenuVerse, ChopChop, DeliverMi).

Quick Architecture SummaryBackend: Node.js + Express + Apollo Server (see index.js, schema.js). GraphQL endpoint: /graphql (default port: 4000).
Persistence: SQLite via better-sqlite3 (database.js) for core domain data (users, restaurants, orders).
Auth & Messaging: Firebase Admin SDK (firebase.js) for ID token verification and FCM pushes. Firestore used for lightweight storage of rider tokens (riders collection).
Frontends (External Repos): MenuVerse/ (vendor UI, Next.js): Handles vendor interactions.
DeliverMi/ (rider app, Next.js): Manages rider workflows.
Both communicate via GraphQL and select REST endpoints.

Core Files and EndpointsKey Files to Read First (Fast Path)index.js: App entrypoint, auth middleware, REST endpoints.
schema.js: GraphQL schema, types, and resolvers (core business logic for orders and riders).
database.js: SQLite schema and helpers (dbHelpers.* for operations like createOrder, getOrderById).
firebase.js: Firebase Admin SDK init and CI safeguards.
notifyScheduler.js: In-memory scheduler for reminders (dev-only; replace in production).

Integration PointsREST Endpoints (index.js):POST /notify-ready: Vendors notify riders of ready orders (requires Firebase ID token in Authorization: Bearer <token>).
GET /order-driver/:orderId: Returns assigned rider info for a restaurant.

GraphQL Mutations (schema.js):placeOrder, updateOrderStatus, assignRider, riderUpdateOrderStatus, riderReportNotReady, riderCancelOrder.

Notifications: Triggered via Firebase Admin SDK's messaging().sendMulticast. Payloads include data.url for deep-linking into DeliverMi.
Scheduling: In-memory timers in notifyScheduler.js for ~7-min pre-ETA reminders (ephemeral; enqueue to a durable queue in prod).

Environment and SecretsAPI Server:Firebase Admin SDK vars: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID (see ENVIRONMENT-VARIABLES.md).
DELIVERMI_URL: For deep links (default: http://localhost:9010).

Frontends: Use NEXT_PUBLIC_FIREBASE_* and NEXT_PUBLIC_FIREBASE_VAPID_KEY for FCM web push.
Security Note: Always verify Firebase ID tokens to set req.user; handle secrets via env vars only.

Developer Workflows & CommandsDev Setup: cd api && npm install && npm run dev (uses Nodemon; GraphQL at http://localhost:4000/graphql).
Testing: cd api && npm test (tests in tests/; CI in .github/workflows/ci-cd.yml).
Debugging Notifications: Check Firestore riders collection and FCM payloads (ensure data.url for service-worker handling).
Deployment Notes: For production, deploy to a Node-compatible host (e.g., Vercel, Heroku). Replace in-memory scheduler with a durable queue. Monitor SQLite performance; consider migration to PostgreSQL for scale.

Project-Specific Patterns & ConventionsDB Access: Centralized in database.js via dbHelpers. Prefer helpers over raw SQL to maintain JSON encoding for fields like orderItems and statusHistory (stored as strings).
Authentication: Relies on req.user (from decoded Firebase token). Apply authorization checks consistently (e.g., validate restaurant ownerId against req.user.uid).
Notifications: FCM payloads must include both notification and data fields; data.url enables deep-linking.
Error Handling and Logging: Use Apollo's error formatting in GraphQL resolvers. Log via console.error for now; consider adding Winston for prod. Propagate SQLite errors with context (e.g., order ID).

Common GotchasSchema Changes: Use ensureOrderColumns() in database.js for migrations; avoid direct SQLite alterations.
Encoding: orderItems and statusHistory are JSON strings in DB—parse/stringify consistently.
Auth Consistency: Align REST and GraphQL checks using req.user.uid.
GraphQL Errors: Ensure resolvers throw formatted errors (e.g., new ApolloError('Unauthorized')) to avoid leaking internal details.
Cross-Repo Sync: Changes to notifications may require updates in DeliverMi's service worker (public/firebase-messaging-sw.js).

Cross-Repo Notes (MenuVerse & DeliverMi)MenuVerse: Calls POST /notify-ready from src/app/(app)/orders/page.tsx (includes auth token). Highlight late orders by comparing expectedTime to current time.
DeliverMi: FCM listener in src/lib/firebase.js; deep-links via data.url. Service worker at public/firebase-messaging-sw.js.

How to Help: Example TasksAI agents can tackle these immediately (with estimated effort):Add Durable Job Queue (Medium effort): Integrate Redis + Bull. Enqueue jobs with {orderId, sendAt} instead of in-memory timers in notifyScheduler.js.
Enhance MenuVerse UI (Low effort): Add late-order highlighting using Date.now() vs. expectedTime; fetch rider details via GET /order-driver/:orderId.
Strengthen Ownership Checks (Low effort): In /notify-ready, validate caller against restaurant ownerId (see example in index.js).
Add Logging Middleware (Medium effort): Implement request logging in index.js for better debugging.

If Anything is UnclearSpecify the target environment (e.g., local dev with DELIVERMI_URL=http://localhost:9010 and Firebase creds, or deployed). Reference exact files for updates, and I'll apply minimal, safe changes.

ResourcesRepo Docs: ENVIRONMENT-VARIABLES.md, .github/workflows/ci-cd.yml.
External: Firebase Admin SDK docs, Apollo Server error handling guide, Bull queue examples.

 
Implementation Roadmap & Checklist
---------------------------------
This repository (the `api/` subproject) is part of a multi-app workspace where `MenuVerse/` (vendor), `DeliverMi/` (rider) and `ChopChop/` (consumer) coordinate. Below is a pragmatic, ordered plan to finish the outstanding features, make the notification flow production-ready, and prepare the apps for integration and release.

High-level phases (ordered):
- Phase 0 — Prep & CI
- Phase 1 — Durable scheduler & worker
- Phase 2 — API hardening & migrations
- Phase 3 — DeliverMi (rider) polish
- Phase 4 — MenuVerse (vendor) polish
- Phase 5 — Integration tests & staging
- Phase 6 — Release, docs, PRs

Phase 0 — Prep & CI (small, immediate)
- Goal: Ensure environments, CI, and docs are ready to accept larger changes.
- Actions:
	- Confirm required env vars in `ENVIRONMENT-VARIABLES.md` (Firebase admin creds, `DELIVERMI_URL`, Redis URL for later).
	- Add CI job(s) to run unit tests for `api` and linting. Ensure secrets are not required to run unit tests locally.
	- Add a short `README` section describing how to run the workspace tests locally.
- Verification: `npm test` runs in `api/` on CI and locally.

Phase 1 — Durable scheduler & worker (medium effort)
- Goal: Replace `notifyScheduler.js` in-memory timers with a durable queue so reminders survive server restarts.
- Actions:
	- Add Redis dependency and job queue (recommend `bull` or `bullmq`) to `api/package.json`.
	- Implement a `queues/` folder with `remindersQueue.js` (enqueue API) and a separate worker script `workers/reminderWorker.js` that reads jobs and invokes the existing FCM send logic.
	- Add config to `index.js` to enqueue (not schedule) for reminder times; keep small in-memory fallback for local dev if `REDIS_URL` is missing.
	- Add a lightweight health-check endpoint for the worker (or integrate with existing `/health`).
- Verification: Enqueued job persists to Redis, worker picks it up and sends FCM (can be simulated using a test token). Unit tests mock Redis and verify enqueueing/processing logic.

Phase 2 — API hardening & migrations (small/medium)
- Goal: Ensure API is secure and DB schema is consistent across instances.
- Actions:
	- Ensure ownership checks on REST endpoints and GraphQL resolvers (e.g., `/notify-ready` must confirm `req.user.uid` === restaurant ownerId).
	- Add or update tests for authorization failures and successes.
	- Use `ensureOrderColumns()` to apply DB column migrations; write migration tests around `orderItems` and `statusHistory` encoding.
	- Centralize FCM payload creation into a helper (e.g., `notifier.buildPayload(type, order)`) to avoid duplication.
- Verification: Authorization tests pass, migration path succeeds on a copy of the DB.

Phase 3 — DeliverMi (rider) polish (low/medium)
- Goal: Make the rider app robust: FCM registration, SW click deep-links, foreground toasts, and order flows.
- Actions:
	- Confirm `public/firebase-messaging-sw.js` handles `notificationclick` using `data.url` and opens `DELIVERMI_URL + /order/{id}`.
	- Ensure the client saves `fcmToken` to Firestore under `riders/{uid}` and refreshes when token changes.
	- Make foreground `onMessage` handler show in-app toast with an action that links to the deep-link.
	- Verify GraphQL mutations for rider actions (pickup confirm, not ready, cancel) return the updated order state.
- Verification: From MenuVerse, trigger a `placeOrder` or `/notify-ready` and confirm DeliverMi receives push and clicking opens the correct order page.

Phase 4 — MenuVerse (vendor) polish (low)
- Goal: Improve vendor UX and use the API endpoints already added.
- Actions:
	- Add late-order highlighting by comparing `expectedTime` to `Date.now()` in `src/app/(app)/orders/page.tsx`.
	- Add `Driver details` button which calls `GET /order-driver/:orderId` and shows the rider name/phone and their current active order count.
	- Keep `POST /notify-ready` integration and make sure it sends the `Authorization: Bearer <token>` header.
	- Verify image upload fixes (imgbb flow); write a regression test that the vendor logo upload works end-to-end.
- Verification: Vendors can see driver details and late orders visually; notify-ready flows trigger FCM sends.

Phase 5 — Integration & E2E tests (medium)
- Goal: Ensure end-to-end flows work between `api`, `MenuVerse`, and `DeliverMi`.
- Actions:
	- Add integration tests that run the API and simulate GraphQL mutations and REST `/notify-ready` calls; stub FCM calls (or run against a test Firebase project with test tokens).
	- Add E2E tests for the vendor->rider flow: vendor marks ready → rider receives message → rider clicks open and sees order.
	- Use Playwright or Cypress for cross-app E2E (recommended Playwright already appears used in other subprojects).
- Verification: CI runs E2E in a staging environment or using test doubles and reports green.

Phase 6 — Release & docs (small)
- Goal: Create PRs, update docs, and deploy to staging.
- Actions:
	- Create feature branches in each subproject with the same name (e.g., `feature/fcm-notifications-endtoend`) and open PRs targeting `main` with clear descriptions.
	- Update top-level `.github/copilot-instructions.md` (workspace-level) to reference this repo-level plan.
	- Provide a deployment runbook describing required env vars and steps to deploy the API and frontends.
- Verification: PRs created, CI green, staging deployed, smoke tests pass.

Branching & PR workflow (recommended)
- Use the workspace root to coordinate cross-repo work:
	- Create the feature branch locally in each subproject (`git checkout -b feature/xxx`) and push to its remote.
	- Open PRs in each repo. Include cross-linking in PR descriptions so reviewers can see all related changes.

Estimate & priorities (suggested)
- High priority: Phase 1 (durable scheduler), Phase 3 (DeliverMi FCM reliable flows), Phase 2 (security/migrations).
- Medium priority: Phase 4 (MenuVerse polish), Phase 5 (E2E tests).
- Low priority: Further performance tuning and analytics integration.

If you want, I can start with Phase 1 (add Redis + Bull queues and a worker) right now and push a feature branch in `api/` named `feature/durable-reminders`. Tell me to proceed and whether to create the matching branches in `MenuVerse/` and `DeliverMi/` as well.
 
Priority Implementation Plan — Top user tasks
------------------------------------------------
The following tasks are the highest priority (complete these first). After these are green, attend to the remaining roadmap items above.

1) Verify and fix the Order Flow (Top priority)
	 - Goals:
		 - Customer: can place an order and track its status (Placed → Preparing → Ready → Out for Delivery → Delivered).
		 - Vendor: can update order status (mark Ready / Out for Delivery) and trigger notifications to riders.
		 - Rider: receives ride notifications from vendors and can accept/decline and update order status.
	 - Acceptance criteria:
		 - GraphQL `placeOrder` returns an order with `id` and `expectedTime`.
		 - Vendor UI triggers `POST /notify-ready` and assigned rider(s) receive an FCM notification with `data.url` deep-link.
		 - Customer UI (or API) shows real-time or near-real-time order status updates (via subscription or polling).
	 - Quick checks:
		 - Use `curl` to place an order and GraphQL queries to fetch status:
			 - `curl -X POST http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{ "query": "mutation { placeOrder(...) { id status expectedTime } }" }'`
		 - Simulate vendor `POST /notify-ready`:
			 - `curl -X POST http://localhost:4000/notify-ready -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"orderId":123}'`

2) Rider registration & dispatch booking
	 - Goals:
		 - Riders can register to *offer* dispatch services and store `fcmToken` in Firestore under `riders/{uid}`.
		 - Customers can book a dispatch-only ride (DeliverMi users should have a flow to 'Book dispatch' separate from placing a restaurant order).
	 - Acceptance criteria:
		 - Rider sign-up creates a Firestore `riders/{uid}` doc with `fcmToken`, `name`, `phone`, `available` fields.
		 - Customer booking creates a dispatch request that is multicast to matching/available riders via FCM.

3) Fix imgbb photo uploads and retrieval; add Playwright browser tests
	 - Goals:
		 - Vendor image upload (imgbb) must succeed and returned URL is stored on vendor profile/restaurant.
		 - Implement Playwright tests in browser (`--headed`) to validate upload+display flows.
	 - Playwright test commands (run from the relevant app directory):
		 - MenuVerse (example):
			 ```bash
			 cd MenuVerse
			 npm install
			 npx playwright test --project=chromium --headed tests/e2e/upload.spec.ts
			 ```
		 - DeliverMi (to test SW & deep-link handling):
			 ```bash
			 cd DeliverMi
			 npm install
			 npx playwright test --project=chromium --headed tests/e2e/push-notification.spec.ts
			 ```
	 - Notes:
		 - Always confirm you are in the correct directory before running tests (see 'Directory safety' below).

4) Testing & verification
	 - Add integration tests (unit + integration) for GraphQL resolvers and REST endpoints.
	 - Create a small Playwright flow that covers: place order → vendor marks ready → rider receives push → rider opens deep-link → order page shows updated state.

5) Operational safety: run commands from the correct directory
	 - Common directories:
		 - `api/` — run `npm test`, `npm run dev` here for the API.
		 - `MenuVerse/` — Next.js vendor app and its Playwright tests.
		 - `DeliverMi/` — rider app, SW, and client tests.
	 - Always `pwd` before running installs or tests. Example:
		 ```bash
		 cd /workspaces/food-delivery-multivendor/MenuVerse
		 pwd
		 npm install
		 ```

6) Short checklist for each feature to mark done
	 - Unit tests added and passing for changed modules.
	 - Integration test or Playwright scenario demonstrates the flow.
	 - Endpoint docs updated in `API-QUICK-REFERENCE.md` or `API-ENDPOINTS.md`.
	 - PRs created in each modified subproject with linked cross-repo description.

If you'd like, I will start immediately on the top item: "Verify and fix the Order Flow" — I can run the API locally, run a quick integration script that places an order, simulate vendor `notify-ready`, and observe FCM sending (or stub it). Tell me to proceed and whether to run the Playwright browser tests as part of the verification step.

Docs & Progress Discipline
- Whenever you change code or behavior in `api/`, update `api/` docs and the workspace todo list:
	1. Run the relevant tests or a smoke test locally.
	2. Update `API-QUICK-REFERENCE.md` or `API-ENDPOINTS.md` with any new/changed endpoints and usage.
	3. Update `api/.github/copilot-instructions.md` with short notes about the change and link to the PR.
	4. Mark the todo item(s) as completed with `manage_todo_list` and add follow-ups.

This helps keep the repo-level and workspace-level docs synchronized and ensures our team and AI agents can track progress reliably.

