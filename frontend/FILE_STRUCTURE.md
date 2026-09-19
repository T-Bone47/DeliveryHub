# Frontend file structure

```
frontend/
├── angular.json, package.json, tsconfig*.json, proxy.conf.json
├── src/
│   ├── index.html, main.ts, styles.scss
│   ├── styles/
│   │   ├── _tokens.scss     design tokens (color/spacing/radius/shadow CSS vars)
│   │   └── _mixins.scss     .card, focus-ring, truncate mixins
│   └── app/
│       ├── app.component.ts        root shell — just <router-outlet>
│       ├── app.config.ts           providers: router (+input binding), HttpClient (+interceptors)
│       ├── app.routes.ts           full route tree, all lazy-loaded
│       │
│       ├── core/
│       │   ├── config/api.config.ts        API_BASE_URL injection token
│       │   ├── models/                     TypeScript interfaces mirroring backend
│       │   │   ├── enums.model.ts          UserRole, VehicleType, AgentStatus, PackageType,
│       │   │   │                           DeliveryStatus, BookingStatus (exact backend values)
│       │   │   ├── api-response.model.ts   SuccessResponse<T> / ErrorResponse envelopes
│       │   │   ├── user.model.ts, agent.model.ts, service.model.ts,
│       │   │   │   location.model.ts, package.model.ts
│       │   ├── services/                   one Angular service per backend route group
│       │   │   ├── auth.service.ts               login/register/me, session in localStorage, signals
│       │   │   ├── user.service.ts                /api/users
│       │   │   ├── agent.service.ts               /api/agents (+ :id/status, :id/performance)
│       │   │   ├── delivery-service.service.ts    /api/services (catalog, not DI services)
│       │   │   ├── location.service.ts            /api/locations
│       │   │   └── package.service.ts             /api/packages (+ /my, /:id, /:id/assignment, /:id/assign)
│       │   ├── guards/
│       │   │   ├── auth.guard.ts     must be logged in
│       │   │   ├── role.guard.ts     roleGuard(['ADMIN']) etc.
│       │   │   └── guest.guard.ts    keeps logged-in users off /login, /register
│       │   └── interceptors/
│       │       ├── auth.interceptor.ts    attaches Bearer token
│       │       └── error.interceptor.ts   normalizes errors, toasts them, handles 401
│       │
│       ├── shared/
│       │   ├── components/
│       │   │   ├── app-shell.component.ts     sidebar + topbar + role-based nav + <router-outlet>
│       │   │   ├── icon.component.ts          inline SVG icon set (no icon font/CDN)
│       │   │   ├── status-badge.component.ts  color-coded pill from the exact backend status string
│       │   │   ├── stat-card.component.ts
│       │   │   ├── loading-spinner.component.ts
│       │   │   ├── empty-state.component.ts
│       │   │   ├── error-state.component.ts   with retry output
│       │   │   ├── pagination.component.ts
│       │   │   ├── confirm-dialog.component.ts
│       │   │   ├── toast.service.ts + toast-container.component.ts
│       │   │   ├── profile-view.component.ts  read-only profile (shared by customer & agent)
│       │   │   └── nav-item.model.ts
│       │   └── utilities/                     (reserved; currently no standalone date utils needed —
│       │                                        Angular's DatePipe covers current formatting needs)
│       │
│       └── features/
│           ├── auth/{login,register}/
│           ├── customer/
│           │   ├── dashboard/            stats + recent deliveries
│           │   ├── create-delivery/      full reactive form → POST /api/packages
│           │   ├── deliveries-list/      paginated, status-filterable → GET /api/packages/my
│           │   └── delivery-detail/      package + assignment + booking + history
│           │                             (also reused at /agent/deliveries/:id and /admin/packages/:id —
│           │                              same endpoint, access enforced server-side by role/ownership)
│           ├── agent/
│           │   ├── dashboard/            honest "no listing endpoint yet" state + package-ID lookup
│           │   └── profile/ → reuses shared ProfileViewComponent
│           └── admin/
│               ├── dashboard/            real aggregate counts (users/agents/packages)
│               ├── agents/               roster table
│               ├── agent-detail/         create/edit + status buttons + performance snapshot
│               ├── packages/             all packages, filter by status, retry auto-assignment
│               ├── services/             service-tier CRUD (create + activate/deactivate)
│               ├── locations/            location CRUD (create + activate/deactivate)
│               ├── users/                read-only roster (no self-service edit endpoint to call)
│               └── unavailable/          generic placeholder for Bookings/Deliveries/Assignments/
│                                          Rewards/History nav items (no backend list endpoint yet)
```
