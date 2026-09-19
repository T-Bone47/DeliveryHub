# DeliveryHub — Frontend

Angular 18 (standalone components) frontend for the Delivery Agent System, built
strictly against the **current** backend implementation in `../backend`.

## Stack

- Angular 18, standalone components (no NgModules)
- TypeScript, SCSS
- Angular Router (functional guards, lazy-loaded routes)
- Reactive Forms
- HttpClient with functional interceptors
- Signals for local/service state (no NgRx — the app is not complex enough to need it yet)

## Getting started

```bash
cd frontend
npm install
npm start          # ng serve, proxies /api -> http://localhost:5000 (see proxy.conf.json)
```

Update `proxy.conf.json` if your backend runs on a different port. In production,
serve this build behind the same origin as the API (or set up a reverse proxy) so
the relative `/api` base URL in `src/app/core/config/api.config.ts` keeps working
without code changes.

```bash
npm run build       # production build to dist/deliveryhub
```

> This environment could not run `npm install` / `ng build` (no network access in
> the sandbox that generated this code), so the build has **not** been verified
> end-to-end. Run the commands above locally and fix any TypeScript/template
> errors that surface — the code was written carefully against Angular 18 APIs,
> but an unverified build is not a passing build.

## Authentication

- `POST /api/auth/login` → `{ token, user }`. Token is stored in `localStorage`
  and attached as `Authorization: Bearer <token>` by `authInterceptor`.
- `POST /api/auth/register` (role `CUSTOMER` or `AGENT`).
- `GET /api/auth/me` — available via `AuthService.fetchCurrentUser()` but not
  required on boot since login already returns the full user object.
- On login, the app redirects by `user.role`:
  - `CUSTOMER` → `/customer/dashboard`
  - `AGENT` → `/agent/dashboard`
  - `ADMIN` → `/admin/dashboard`
- `authGuard` blocks unauthenticated access; `roleGuard([...])` restricts a route
  subtree to specific roles; `guestGuard` keeps logged-in users off `/login` and
  `/register`.
- A 401 response anywhere triggers `errorInterceptor` to clear the session and
  redirect to `/login`.

## Route structure

See `src/app/app.routes.ts`. All feature routes are lazy-loaded
(`loadComponent`). Top-level shape:

```
/login, /register                     (guestGuard)
/customer/...                         (authGuard + roleGuard(['CUSTOMER']))
/agent/...                            (authGuard + roleGuard(['AGENT']))
/admin/...                            (authGuard + roleGuard(['ADMIN']))
```

## Architecture

```
core/        singleton services, guards, interceptors, API base-URL token, models
shared/      app shell (sidebar+topbar), reusable UI (status badge, tables via
             plain <table class="dh-table">, empty/error/loading states, toasts,
             pagination, confirm dialog, stat card, icon set)
features/    one folder per screen, each a standalone component with its own
             .ts / .html / .scss
```

Every HTTP call goes Component → a `core/services/*.ts` service → `HttpClient`.
No component calls `HttpClient` directly, and no business rules (assignment
scoring, OTP, status-transition rules, reward/penalty math, cancellation rules)
are re-implemented in Angular — the UI only collects input, calls the API, and
renders whatever the backend returns.

## API integration honesty

The backend currently implements **auth, users, agents, services, locations,
and packages** — nothing else. Booking, delivery-execution, notification,
reward/penalty, and history data exist only as fields *nested inside a
package's detail response* (`GET /api/packages/:id`); there is no standalone
list endpoint for any of them, and there is no "my assigned deliveries" list
endpoint for the AGENT role (agents can only open a package they're assigned to
if they already know its ID — see the Agent dashboard).

Because of that, several admin nav items (Bookings, Deliveries, Assignments,
Rewards & Penalties, History) render a plain "not available as a standalone
list yet" screen instead of fabricated data, and the Agent dashboard states
its own limitation rather than pretending to have a workload list. See the
final report delivered alongside this code for the full breakdown.

## Configuration

- API base URL: `src/app/core/config/api.config.ts` (`API_BASE_URL` token,
  defaults to `/api`).
- Dev proxy target: `proxy.conf.json`.
