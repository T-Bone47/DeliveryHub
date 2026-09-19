# Phase 5 implementation note

## Scope

Phase 5 adds the customer package/delivery-request workflow and backend-owned
automatic agent assignment. The Angular frontend, OTP, cancellation,
rescheduling, rewards, external notifications, maps integrations, and AI
features remain outside this phase.

## Workflow

1. A customer submits a delivery request.
2. The backend validates the package, locations, service, and schedule.
3. MongoDB stores the package initially as `PENDING`.
4. Neo4j finds agents serving the source and destination locations and
   offering the requested service.
5. MongoDB filters candidates by active user account, `AVAILABLE` agent status,
   and active-delivery capacity.
6. The backend calculates the deterministic assignment score:

   `Distance × 40% + Workload × 25% + Rating × 20% + On-Time × 15%`

7. The highest-scoring candidate is selected with deterministic tie-breaking.
8. Successful assignment creates a confirmed booking, assigned delivery,
   history event, and customer/agent notification records.
9. If no candidate is available, the package remains `PENDING`, a pending
   history record is created, and no fake agent or booking is created.

Assignment capacity is currently five active deliveries per agent. Distance
uses a local Haversine calculation so Phase 5 does not depend on a Maps API.

## APIs

```text
POST /api/packages
GET  /api/packages/my
GET  /api/packages
GET  /api/packages/:id
POST /api/packages/:id/assign
GET  /api/packages/:id/assignment
```

The package document keeps optional assignment metadata so assignment details
remain available after the initial request:

```text
assignmentScore
assignmentDistanceKm
assignmentEstimatedMinutes
assignmentReason
assignedAt
```

## Local testing

Start MongoDB and Neo4j with the existing environment configuration, then run:

```bash
cd backend
npm run typecheck
npm run build
npm start
```

Create an active `CUSTOMER`, an active `AGENT`, an active service, matching
locations, and the Neo4j `SERVES`/`OFFERS` relationships before testing the
successful assignment path. A request with no eligible candidate should
return a successful `PENDING` response.