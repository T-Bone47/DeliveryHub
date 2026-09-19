# Delivery Agent System --- Architecture Specification

**Project Type:** College Full-Stack Application\
**Execution:** Localhost only\
**Frontend:** Angular + TypeScript\
**Backend:** Node.js + Express + TypeScript\
**Primary Database:** MongoDB\
**Graph Database:** Neo4j\
**External Integrations:** Maps/Routing API, Email/Notification API,
optional AI API

------------------------------------------------------------------------

## 1. Purpose

The Delivery Agent System receives delivery requests from an online
shopping portal and manages the complete delivery lifecycle.

The system must:

-   receive shipping details
-   identify suitable delivery agents automatically
-   assign an available agent to a package
-   create and manage delivery bookings
-   track delivery status
-   support cancellation
-   support rescheduling
-   calculate rewards and penalties
-   maintain historical delivery records
-   allow administrators, customers, and delivery agents to interact
    with the system according to their roles

The architecture is designed so that the entire system can run on one
Windows laptop through VS Code without deploying the application to a
cloud server.

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         DELIVERY AGENT SYSTEM
                                  |
                 +----------------+----------------+
                 |                |                |
                 v                v                v
             CUSTOMER          AGENT            ADMIN
                 |                |                |
                 +----------------+----------------+
                                  |
                                  v
                    +---------------------------+
                    |      ANGULAR FRONTEND     |
                    |       TypeScript          |
                    +-------------+-------------+
                                  |
                             HTTP / REST
                                  |
                                  v
                    +---------------------------+
                    |   NODE.JS + EXPRESS API   |
                    |        TypeScript         |
                    +-------------+-------------+
                                  |
                  +---------------+---------------+
                  |               |               |
                  v               v               v
             Controllers      Middleware      Services
                                  |               |
                                  |               v
                                  |       Business Logic
                                  |               |
                                  +-------+-------+
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
                +------------------+             +------------------+
                |     MongoDB      |             |      Neo4j       |
                | Main application |             | Relationships &  |
                |      data        |             | agent matching   |
                +------------------+             +------------------+
                         |
                         v
              Users / Packages / Bookings /
              Deliveries / History / Rewards

                         External APIs
                              |
             +----------------+----------------+
             |                                 |
             v                                 v
       Maps/Routing API                  Email/Notification API
       Distance + ETA                    Confirmations + Alerts
```

------------------------------------------------------------------------

# 3. Architectural Style

The backend follows a layered architecture.

``` text
Angular Frontend
       |
       v
REST API Routes
       |
       v
Controllers
       |
       v
Services
       |
       v
Repositories
       |
       +----------------------+
       |                      |
       v                      v
    MongoDB                  Neo4j
```

### Responsibilities

**Routes** - define API endpoints - connect endpoints to controllers

**Controllers** - receive HTTP requests - validate/request DTOs at the
API boundary - call appropriate services - return HTTP responses -
should NOT contain major business logic

**Services** - contain business rules - coordinate multiple
repositories - perform automatic agent assignment - manage booking,
cancellation, rescheduling, rewards, and delivery state changes

**Repositories** - isolate database operations - communicate with
MongoDB or Neo4j - prevent controllers from directly handling database
queries

**Middleware** - authentication - authorization - validation - error
handling - request processing

------------------------------------------------------------------------

# 4. Frontend Architecture

The frontend is an Angular application.

``` text
frontend/
└── src/
    └── app/
        ├── core/
        │   ├── guards/
        │   ├── interceptors/
        │   └── services/
        │
        ├── shared/
        │   ├── components/
        │   ├── models/
        │   └── utilities/
        │
        └── features/
            ├── auth/
            ├── customer/
            ├── agent/
            ├── admin/
            ├── packages/
            ├── bookings/
            ├── tracking/
            ├── rewards/
            └── history/
```

### Core

Contains functionality used throughout the application.

Examples:

-   authentication service
-   API service
-   authentication guard
-   role guard
-   HTTP interceptor
-   token handling

### Shared

Contains reusable UI elements and common models.

Examples:

-   buttons
-   cards
-   tables
-   dialogs
-   status badges
-   loading indicators
-   confirmation dialogs
-   location components

### Features

Contains functionality grouped by business area.

This prevents the frontend from becoming one large collection of
unrelated components.

------------------------------------------------------------------------

# 5. User Roles

The system has three primary roles.

``` text
ADMIN
CUSTOMER
AGENT
```

## Customer

Can:

-   register/login
-   create a delivery request
-   provide source and destination
-   view assigned agent
-   view booking confirmation
-   track delivery
-   cancel a booking
-   request rescheduling
-   verify delivery using OTP
-   view previous deliveries

## Agent

Can:

-   login
-   view assigned deliveries
-   view package details
-   update delivery status
-   perform pickup
-   enter delivery OTP
-   complete delivery
-   view delivery history
-   view performance
-   view reward/penalty information

## Admin

Can:

-   view system dashboard
-   manage agents
-   manage service areas
-   manage delivery services
-   view packages
-   view bookings
-   view deliveries
-   inspect agent performance
-   manage rewards and penalties
-   view historical records

------------------------------------------------------------------------

# 6. Main Business Flow

## 6.1 Delivery Request

``` text
Customer
   |
   v
Create Delivery Request
   |
   +--> Package details
   +--> Source location
   +--> Destination location
   +--> Delivery type
   +--> Scheduled date
   |
   v
Backend
```

------------------------------------------------------------------------

## 6.2 Automatic Agent Assignment

This is the main business feature.

``` text
Delivery Request
       |
       v
Find eligible agents
       |
       +--> Agent is active?
       |
       +--> Agent is available?
       |
       +--> Agent serves source area?
       |
       +--> Agent serves destination area?
       |
       +--> Agent provides required service?
       |
       v
Calculate assignment score
       |
       +--> Distance
       +--> Current workload
       +--> Rating
       +--> On-time performance
       |
       v
Select best eligible agent
       |
       v
Assign agent automatically
       |
       v
Create booking
       |
       v
Notify customer and agent
```

The assignment logic is a backend business rule. It does not require
machine learning.

------------------------------------------------------------------------

# 7. Neo4j's Role

Neo4j is used specifically for relationships needed by courier/agent
matching.

It should not replace MongoDB as the main application database.

Conceptually:

``` text
          +-------------+
          |   Agent     |
          +------+------+
                 |
       +---------+---------+
       |                   |
       v                   v
   SERVES              OFFERS
       |                   |
       v                   v
   Location             Service
```

Possible relationships:

``` text
(:Agent)-[:SERVES]->(:Location)
(:Agent)-[:OFFERS]->(:Service)
(:Agent)-[:AVAILABLE_IN]->(:Location)
```

When a delivery request is received, the backend can query Neo4j to find
agents whose relationships satisfy the request.

Neo4j therefore has a clear architectural purpose:

**relationship discovery and candidate-agent matching.**

MongoDB remains responsible for persistent application records.

------------------------------------------------------------------------

# 8. MongoDB's Role

MongoDB is the primary application database.

It stores:

``` text
users
agents
packages
bookings
deliveries
deliveryHistory
rewardPenalties
notifications
```

MongoDB is the source of truth for the application's transactional
records.

The backend should maintain references between related records using
IDs.

Examples:

``` text
package.customerId
booking.packageId
booking.customerId
booking.agentId
delivery.packageId
delivery.agentId
rewardPenalty.agentId
rewardPenalty.packageId
```

The exact schemas and field definitions belong in `DATABASE_SCHEMA.md`.

------------------------------------------------------------------------

# 9. Delivery Lifecycle

The delivery lifecycle is controlled by the backend.

``` text
PENDING
   |
   v
AGENT_ASSIGNED
   |
   v
PICKED_UP
   |
   v
IN_TRANSIT
   |
   v
OUT_FOR_DELIVERY
   |
   v
DELIVERED
```

Alternative states:

``` text
PENDING -> CANCELLED

AGENT_ASSIGNED -> RESCHEDULED

IN_TRANSIT -> FAILED
```

The frontend must use exactly the same status values defined by the
backend contract.

`RESCHEDULED` is a transitional status. After a successful reschedule,
the backend must place the package/delivery back into `AGENT_ASSIGNED`
if the existing agent remains assigned, or `PENDING` if reassignment is
required.

------------------------------------------------------------------------

# 10. Booking Flow

``` text
Create Delivery
      |
      v
Agent Automatically Assigned
      |
      v
Booking Created
      |
      v
Confirmation Number Generated
      |
      v
Customer sees confirmation
      |
      v
Agent receives assignment
```

A booking contains references to:

-   customer
-   package
-   assigned agent
-   scheduled date
-   booking status
-   confirmation number

------------------------------------------------------------------------

# 11. Tracking Flow

``` text
Agent updates status
        |
        v
Backend validates transition
        |
        +--> Update delivery record
        |
        +--> Create history record
        |
        +--> Notify customer
        |
        v
Angular tracking page
```

Each important status update should create a history entry.

Example:

``` text
10:00  Request received
10:05  Agent assigned
11:30  Package picked up
14:10  In transit
17:20  Out for delivery
18:00  Delivered
```

------------------------------------------------------------------------

# 12. OTP Delivery Verification

For an additional security feature:

``` text
Agent reaches destination
        |
        v
Customer receives OTP
        |
        v
Agent enters OTP
        |
        v
Backend verifies OTP
        |
   +----+----+
   |         |
 Correct   Incorrect
   |         |
   v         v
Delivered   Reject
```

The OTP must be generated and verified by the backend.

The frontend should never contain the secret generation logic.

------------------------------------------------------------------------

# 13. Cancellation Flow

``` text
Customer/Admin requests cancellation
             |
             v
Backend checks booking status
             |
             v
Is cancellation allowed?
        +----+----+
        |         |
       Yes        No
        |         |
        v         v
Cancel booking   Error
        |
        v
Create cancellation record/history
        |
        v
Send confirmation
```

The backend, not Angular, decides whether cancellation is allowed.

------------------------------------------------------------------------

# 14. Rescheduling Flow

``` text
Customer requests new date
          |
          v
Backend validates request
          |
          v
Check availability
          |
          v
Update scheduled date
          |
          v
Set status = RESCHEDULED
          |
          v
Create history entry
          |
          v
Notify customer + agent
```

------------------------------------------------------------------------

# 15. Reward and Penalty Flow

After a delivery is completed:

``` text
Delivery Completed
       |
       v
Evaluate performance
       |
       +--> On-time?
       +--> Delayed?
       +--> Successful?
       +--> Failed?
       |
       v
Calculate reward/penalty
       |
       v
Store record
       |
       v
Update agent performance
```

The calculation should be implemented as a backend service so the rules
are consistent regardless of which frontend page triggers the operation.

------------------------------------------------------------------------

# 16. External API Integrations

External APIs are enhancements, not replacements for the core system.

## Maps/Routing API

Purpose:

-   geocode addresses if required
-   calculate distance
-   estimate travel time
-   display routes/maps

Flow:

``` text
Source + Destination
        |
        v
Backend
        |
        v
Maps/Routing API
        |
        v
Distance + ETA
        |
        v
Assignment Service
```

API keys must remain in backend environment variables when the
provider's security model permits it.

## Email/Notification API

Purpose:

-   booking confirmation
-   agent assignment notification
-   rescheduling notification
-   cancellation confirmation
-   delivery completion notification

Flow:

``` text
Backend Event
     |
     v
Notification Service
     |
     v
Email/Notification Provider
```

## Optional AI Integration

An AI API may be added later for an admin analytics assistant or
natural-language reporting.

It is optional and must not be required for core delivery operations.

------------------------------------------------------------------------

# 17. API Layer

The frontend communicates with the backend only through REST APIs.

High-level endpoint groups:

``` text
/api/auth
/api/users
/api/agents
/api/packages
/api/bookings
/api/deliveries
/api/rewards
/api/history
```

Examples:

``` text
POST /api/auth/register
POST /api/auth/login

POST /api/packages
GET  /api/packages/:id

GET  /api/agents
POST /api/agents

POST /api/packages/:id/assign

PUT  /api/bookings/:id/cancel
PUT  /api/bookings/:id/reschedule

GET  /api/deliveries
GET  /api/deliveries/:id/tracking
PUT  /api/deliveries/:id/status
POST /api/deliveries/:id/verify-otp

GET  /api/agents/:id/performance
GET  /api/history/agent/:agentId
```

The complete request/response definitions belong in `API_CONTRACT.md`.

------------------------------------------------------------------------

# 18. Authentication Architecture

``` text
Angular Login
      |
      v
POST /api/auth/login
      |
      v
Backend verifies credentials
      |
      v
JWT generated
      |
      v
Angular stores authentication state
      |
      v
HTTP interceptor adds token
      |
      v
Protected API
```

Authorization:

``` text
JWT
 |
 +--> userId
 +--> role
 |
 v
Role middleware
 |
 +--> ADMIN
 +--> CUSTOMER
 +--> AGENT
```

Passwords must be hashed with bcrypt or an equivalent password-hashing
mechanism.

JWT secrets and database credentials must be stored in `.env`.

------------------------------------------------------------------------

# 19. Local Development Architecture

Everything runs locally.

``` text
Windows Laptop
|
+-- VS Code
|
+-- Angular
|     |
|     +-- localhost:4200
|
+-- Node.js + Express
|     |
|     +-- localhost:5000
|
+-- MongoDB
|     |
|     +-- localhost:27017
|
+-- Neo4j
      |
      +-- localhost:7687
```

The browser communicates with Angular.

Angular communicates with the local Express API.

The Express API communicates with MongoDB, Neo4j, and selected external
APIs.

No cloud hosting is required during development or demonstration.

------------------------------------------------------------------------

# 20. Backend Folder Architecture

``` text
backend/
|
+-- src/
|   |
|   +-- config/
|   |   +-- mongodb.ts
|   |   +-- neo4j.ts
|   |   +-- env.ts
|   |
|   +-- controllers/
|   |   +-- auth.controller.ts
|   |   +-- agent.controller.ts
|   |   +-- package.controller.ts
|   |   +-- booking.controller.ts
|   |   +-- delivery.controller.ts
|   |   +-- reward.controller.ts
|   |   +-- history.controller.ts
|   |
|   +-- services/
|   |   +-- auth.service.ts
|   |   +-- agent.service.ts
|   |   +-- package.service.ts
|   |   +-- assignment.service.ts
|   |   +-- booking.service.ts
|   |   +-- delivery.service.ts
|   |   +-- reward.service.ts
|   |   +-- history.service.ts
|   |   +-- notification.service.ts
|   |
|   +-- repositories/
|   |   +-- user.repository.ts
|   |   +-- agent.repository.ts
|   |   +-- package.repository.ts
|   |   +-- booking.repository.ts
|   |   +-- delivery.repository.ts
|   |
|   +-- models/
|   |
|   +-- routes/
|   |
|   +-- middleware/
|   |
|   +-- utils/
|   |
|   +-- app.ts
|   +-- server.ts
|
+-- seed/
+-- .env
+-- .env.example
+-- package.json
+-- tsconfig.json
```

------------------------------------------------------------------------

# 21. Frontend Feature Architecture

``` text
frontend/
|
+-- src/app/
    |
    +-- core/
    |   +-- guards/
    |   +-- interceptors/
    |   +-- services/
    |
    +-- shared/
    |   +-- components/
    |   +-- models/
    |   +-- utilities/
    |
    +-- features/
        |
        +-- auth/
        +-- customer/
        +-- agent/
        +-- admin/
        +-- packages/
        +-- bookings/
        +-- tracking/
        +-- rewards/
        +-- history/
```

The UI specification should map every screen to an API endpoint and data
model.

------------------------------------------------------------------------

# 22. Architecture Rules

These rules must be followed by every AI tool working on the project.

### Rule 1 --- Single source of truth

The project's documentation files define the agreed names, fields,
roles, statuses, routes, and API contracts.

### Rule 2 --- No invented fields

Do not create frontend fields that do not exist in the agreed data
contract unless the contract is updated first.

### Rule 3 --- No invented API endpoints

The frontend must use endpoints defined in `API_CONTRACT.md`.

### Rule 4 --- Backend owns business logic

Angular should not independently decide:

-   which agent gets assigned
-   whether cancellation is allowed
-   whether an OTP is valid
-   how rewards are calculated
-   whether a status transition is valid

### Rule 5 --- Database access stays in repositories

Controllers and Angular must not directly access MongoDB or Neo4j.

### Rule 6 --- MongoDB and Neo4j have different responsibilities

MongoDB stores application records.

Neo4j handles relationship-oriented agent/location/service matching.

### Rule 7 --- External APIs are isolated

Maps, email, and optional AI integrations should be accessed through
backend services rather than being scattered throughout controllers.

### Rule 8 --- Secrets stay private

API keys, database passwords, JWT secrets, and credentials must not be
committed to GitHub.

------------------------------------------------------------------------

# 23. Development Order

Build in this order rather than generating the entire system at once.

``` text
1. Project structure
       |
2. Backend + Express
       |
3. MongoDB connection
       |
4. Neo4j connection
       |
5. Authentication
       |
6. Users and roles
       |
7. Agents
       |
8. Locations and services
       |
9. Packages
       |
10. Automatic assignment
       |
11. Bookings
       |
12. Delivery status tracking
       |
13. Cancellation
       |
14. Rescheduling
       |
15. OTP verification
       |
16. Rewards and penalties
       |
17. History
       |
18. Maps integration
       |
19. Notifications
       |
20. Angular UI
       |
21. Frontend-backend integration
       |
22. Testing
       |
23. UI/UX polish
```

Frontend screens can be developed in parallel once the API contract is
stable, but they must follow the same models and endpoint definitions.

------------------------------------------------------------------------

# 24. Final System Architecture

``` text
                              USERS
                 +-------------+-------------+
                 |             |             |
              Customer       Agent         Admin
                 |             |             |
                 +-------------+-------------+
                               |
                               v
                    +---------------------+
                    |   Angular Frontend  |
                    +----------+----------+
                               |
                         REST / JSON
                               |
                               v
                    +---------------------+
                    | Node + Express API  |
                    +----------+----------+
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
       Authentication    Business Services   External APIs
                              |
              +---------------+---------------+
              |                               |
              v                               v
       +-------------+                  +-------------+
       |   MongoDB   |                  |    Neo4j   |
       |             |                  |             |
       | Users       |                  | Agents      |
       | Packages    |                  | Locations   |
       | Bookings    |                  | Services    |
       | Deliveries  |                  | Relationships|
       | History     |                  | Matching    |
       | Rewards     |                  |             |
       +-------------+                  +-------------+

                              |
                              v
                  AUTOMATIC AGENT ASSIGNMENT
                              |
                              v
                     DELIVERY LIFECYCLE
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
      Tracking          Rescheduling        Cancellation
          |
          v
    OTP Verification
          |
          v
      Delivered
          |
          v
    History + Rewards/Penalties
```

------------------------------------------------------------------------

# 25. Architectural Goal

The final system should feel like a small real-world logistics platform
rather than a collection of CRUD pages.

The project should demonstrate:

-   modular frontend architecture
-   layered backend architecture
-   REST API design
-   authentication and role-based authorization
-   MongoDB persistence
-   Neo4j relationship-based agent matching
-   automatic agent assignment
-   delivery lifecycle management
-   external API integration
-   delivery verification
-   performance/reward tracking
-   maintainable code structure

The architecture must remain understandable enough for a student to
explain and defend during a project demonstration or viva.
