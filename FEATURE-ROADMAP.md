# Feature Roadmap & Implementation Plan

This document outlines the features we'll add to the Firebase GraphQL API, how we'll implement them, acceptance criteria, and a staged plan so we can execute and reference progress as we go.

---

## Goal
Deliver a production-ready food delivery API for ChopChop with full order lifecycle management, secure user authentication, payments, delivery tracking, notifications, and tooling for operators.

## High-level Phases
1. Core enhancements (auth, payments, menus) — enable full order flow
2. Operations & delivery (riders, tracking, status updates) — logistics features
3. Real-time & notifications (subscriptions, push/SMS) — improve UX
4. Admin & analytics (dashboards, reports) — business tooling
5. Quality & docs (tests, CI, SDKs) — reliability and onboarding

---

## Detailed Feature List & Implementation Plan
Each item below has: scope, deliverables, endpoints (GraphQL), data shapes, acceptance criteria, estimated effort (S/M/L), and test cases.

### 1) User Authentication & Profiles (current priority)
- Scope: Integrate Firebase Auth, profile storage in Firestore, address book, server-side auth context for GraphQL.
- Deliverables:
  - SignUp/Login mutations (email/password, Google/OAuth, phone OTP)
  - `me` query to fetch current profile
  - Profile mutations: update profile, add/remove addresses
  - Auth middleware to inject `userId` into GraphQL context
- GraphQL additions:
  - Mutations: `signUp`, `signIn`, `signOut`, `updateProfile`, `addAddress`, `removeAddress`
  - Queries: `me`, `addresses`
- Data shapes: `User { id, email, displayName, phone, addresses: [Address] }` and `Address { id, label, line1, line2, lat, lng }`
- Acceptance:
  - Successful signUp/signIn returns a valid token and user context is available to other resolvers
  - Address CRUD works and is persisted
- Estimated effort: Medium
- Tests:
  - Unit tests for auth middleware
  - Integration test: sign up -> sign in -> place order uses `me` context

### 2) Payment Processing
- Scope: Integrate Stripe (recommended) or Paystack; support creating payment intents and processing webhooks.
- Deliverables:
  - `createPaymentIntent(orderId, amount)` mutation
  - Webhook endpoint to receive payment events and update order status
  - Reconciliation: mark orders CONFIRMED on successful payment
- Acceptance:
  - Card payments toggle order from `PENDING_PAYMENT` -> `CONFIRMED` after webhook verification
- Estimated effort: Medium
- Tests:
  - Simulated webhook events change order status

### 3) Restaurant & Menu Management
- Scope: APIs for restaurants & menus and search/filter
- Deliverables:
  - `restaurants` and `restaurant(id)` queries
  - `menuItems` per restaurant, menu CRUD
  - Availability flags and daily specials
- Acceptance:
  - Frontend can fetch menus and perform add/remove in admin flows
- Estimated effort: Medium

### 4) Delivery & Rider Tracking
- Scope: Model riders, assign orders, accept/decline, report location, calculate ETA
- Deliverables:
  - `assignRider(orderId, riderId)` mutation
  - `updateRiderLocation(riderId, lat, lng)` mutation
  - Subscriptions: `orderStatusChanged(orderId)` and `riderLocation(riderId)`
- Acceptance:
  - Rider location updates push through subscription; order can be assigned and tracked
- Estimated effort: Large

### 5) Notifications & Real-time Subscriptions
- Scope: Provide GraphQL subscriptions and notification adapters (push, SMS)
- Deliverables:
  - Subscriptions for order status and rider location
  - Push/SMS adapters and preference storage for users
- Acceptance:
  - Client receives subscription events for status updates
- Estimated effort: Medium

### 6) Reviews, Ratings & Feedback
- Scope: Allow customers to rate restaurants/items/drivers
- Deliverables:
  - `submitReview`, `restaurantReviews` queries
  - Moderation flags
- Acceptance:
  - Ratings stored and aggregated, can be fetched and displayed
- Estimated effort: Small

### 7) Admin Dashboard & Management APIs
- Scope: Admin endpoints and audit logs
- Deliverables:
  - Admin-only mutations/queries for user/order/restaurant management
  - Audit trails (who changed what, when)
- Acceptance:
  - Admins can safely modify order statuses with an audit log entry
- Estimated effort: Medium

### 8) Analytics & Reporting
- Scope: Sales, item popularity, delivery performance
- Deliverables:
  - Aggregation jobs (scheduled or on-write), report endpoints
  - Export CSV/JSON
- Estimated effort: Medium

### 9) Testing, CI & Monitoring
- Scope: Add tests and CI, health checks and error monitoring
- Deliverables:
  - Jest/unit tests for resolvers
  - Integration tests using Firestore emulator or test project
  - CI workflow (GitHub Actions): run tests and lint
  - Sentry or equivalent for runtime errors
- Estimated effort: Medium

### 10) Documentation & SDKs
- Scope: Keep docs current; provide client snippets and Postman collection
- Deliverables:
  - Update Developer Integration Guide for each new API
  - Provide example JS client snippets and Postman/Insomnia collection
- Estimated effort: Small

---

## Order of Implementation (recommended)
1. User Authentication & Profiles (blocks payments and personalized carts)
2. Payment Processing (enable card payments and mark orders confirmed)
3. Restaurant & Menu Management (needed for placing realistic orders)
4. Delivery & Rider Tracking (important for UX and operations)
5. Notifications & Real-time Subscriptions (improve customer experience)
6. Admin Dashboard & Management APIs (operations tooling)
7. Analytics & Reporting (business insights)
8. Reviews & Ratings
9. Testing, CI & Monitoring (continuous integration)
10. Documentation & SDKs (ongoing, update per feature)

---

## Process & How We'll Work
- We'll treat each major feature as a tracked todo (the repo TODO list has been updated).
- For each task we will:
  1. Create a small design doc (API surface + data shapes) as a PR
  2. Add required schema changes in `schema.js` and resolvers in `schema-*.js`
  3. Add/adjust Firestore indexes or security rules if needed
  4. Add tests (happy path + 2 edge cases)
  5. Update docs (`DEVELOPER-INTEGRATION-GUIDE.md`, `API-QUICK-REFERENCE.md`)
  6. Merge behind feature flag if risky
- We will reference task IDs and update the repository todo list as we make progress.

---

## Example: Implementation steps for "User Authentication & Profiles"
1. Add `User` and `Address` types to `schema.js`
2. Create Firebase Auth integration in `firebase-auth.js` (server-side helpers)
3. Add mutations: `signUp`, `signIn`, `signOut`, `updateProfile` and `addAddress`
4. Add `auth` middleware in `index.js` to populate GraphQL context with `userId`
5. Tests: signUp/signIn integration test; `me` resolver unit test
6. Docs: add examples and `.env` notes (OAuth client IDs if used)

---

## Acceptance & Quality Gates
Before marking a task complete we must ensure:
- Unit tests and integration tests pass locally
- No console errors in server logs
- Security review for new endpoints (especially payment/auth)
- Docs updated with examples and env variables
- Health checks registered and working in deployed environment

---

## Referencing the Plan
- The canonical plan file is `api/FEATURE-ROADMAP.md` (this file).
- The in-repo todo list is maintained via the repo task tracker (updated). We will always reference todo ID when discussing work, e.g. "Working on todo #1 — User Authentication & Profiles".

---

## Next Immediate Steps (what I'll do if you say "start")
1. Implement todo #1: User Authentication & Profiles (create schema, middleware, basic mutations and tests)
2. Push changes in a feature branch and open a PR with the design doc
3. Run tests and update docs

If you confirm, I'll start implementing item #1 now and update the todo to `in-progress` (already set).
