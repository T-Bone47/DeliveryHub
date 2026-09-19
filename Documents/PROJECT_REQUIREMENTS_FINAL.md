# Delivery Agent System --- Project Requirements Specification

**Project:** Delivery Agent System\
**Purpose:** Full-stack college project based on the professor's P03
Delivery Agent System specification.

------------------------------------------------------------------------

## 1. Project Objective

The system is intended to act as a delivery-management layer for an
online shopping portal.

An online shopping portal sends a delivery request containing shipping
information. The Delivery Agent System receives the request, identifies
suitable delivery agents/courier partners, assigns the delivery, and
manages the delivery lifecycle until completion.

The system must also maintain records needed for cancellation,
rescheduling, reward/penalty calculation, and historical service
queries.

------------------------------------------------------------------------

# 2. Professor-Specified Core Requirements

The following requirements are the core scope of the project.

## 2.1 Shipping Details

The system must accept shipping information including:

-   source location
-   destination location
-   package information
-   requested delivery/service type
-   required delivery date or schedule

The source and destination information must be sufficient for the system
to determine which delivery agents can handle the delivery.

------------------------------------------------------------------------

## 2.2 Courier / Delivery Agent Details

The system must maintain information about delivery agents/courier
agencies, including:

-   agent/courier identity
-   contact information
-   service availability
-   service areas/locations
-   services offered
-   current availability/status
-   delivery performance information

------------------------------------------------------------------------

## 2.3 Service Information

The system must maintain the services offered by courier
agencies/agents.

Examples:

-   Standard delivery
-   Express delivery
-   Same-day delivery
-   Fragile-item delivery
-   Cash-on-delivery support

The exact services used in the final application can be configured by
the administrator.

------------------------------------------------------------------------

# 3. Automatic Courier / Agent Identification and Assignment

This is a central system requirement.

When a delivery request is received, the system must identify the
courier/delivery agent(s) to whom the delivery can be assigned.

The system should automatically select an eligible available agent
rather than requiring an administrator to manually assign every package.

### Eligibility can be based on:

1.  Agent is active.
2.  Agent is currently available.
3.  Agent serves the required source/service area.
4.  Agent can serve the destination area.
5.  Agent provides the requested delivery service.
6.  Agent has acceptable current workload/capacity.

If multiple agents are eligible, the system may select the most suitable
agent using a deterministic assignment rule.

A recommended scoring approach is:

-   distance/proximity
-   current workload
-   rating
-   on-time delivery performance

This is a business-rule-based assignment system. Machine learning is NOT
required.

------------------------------------------------------------------------

# 4. Delivery Booking

The system must support booking a delivery.

A successful booking should:

-   create a booking record
-   associate the package with the customer
-   associate the package with the assigned agent
-   store the scheduled delivery date
-   generate a unique booking number
-   generate a confirmation code/confirmation
-   update the relevant delivery status
-   make the assignment visible to the customer and agent

### Expected result

``` text
Delivery Request
       ↓
Agent Identified
       ↓
Agent Assigned
       ↓
Booking Created
       ↓
Booking Confirmation
```

------------------------------------------------------------------------

# 5. Delivery Status

The system must allow the delivery status to be reported and updated.

The standard lifecycle is:

``` text
PENDING
    ↓
AGENT_ASSIGNED
    ↓
PICKED_UP
    ↓
IN_TRANSIT
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED
```

Other supported states:

``` text
CANCELLED
RESCHEDULED
FAILED
```

The backend is responsible for validating status changes.

The frontend must display the same status values defined by the backend.

------------------------------------------------------------------------

# 6. Delivery Tracking

Customers must be able to view the current state of their delivery.

The tracking view should show:

-   tracking number
-   source
-   destination
-   assigned agent
-   current status
-   scheduled date
-   status timeline
-   important timestamps
-   estimated delivery information when available

Each major status change should be recorded in delivery history.

------------------------------------------------------------------------

# 7. Cancellation of Booking

The system must support cancellation of a delivery booking.

The cancellation process should:

1.  receive a cancellation request
2.  verify that cancellation is permitted
3.  update the booking status
4.  update the delivery/package status where appropriate
5.  record the cancellation in history
6.  generate cancellation confirmation
7.  notify relevant users when notification services are enabled

The backend must make the final decision about whether cancellation is
allowed.

------------------------------------------------------------------------

# 8. Delivery Rescheduling

The system must support rescheduling a delivery.

The rescheduling process should:

1.  receive a new requested date/time
2.  validate the request
3.  check whether the change is permitted
4.  update the scheduled delivery information
5.  update the delivery/booking status
6.  record the previous and new schedule in history
7.  notify relevant users when notification services are enabled

------------------------------------------------------------------------

# 9. Reward and Penalty Calculation

The system must maintain reward and penalty information for delivery
agents/couriers.

The calculation may consider factors such as:

### Rewards

-   successful delivery
-   on-time delivery
-   early delivery
-   consistently high performance

### Penalties

-   delayed delivery
-   failed delivery
-   repeated service issues
-   other administrator-defined violations

Each reward/penalty record should contain:

-   agent
-   related delivery/package when applicable
-   type
-   reason
-   points/value
-   timestamp

The exact scoring rules should be configurable in the backend rather
than hard-coded into the frontend.

------------------------------------------------------------------------

# 10. Historical / Archived Records

The system must maintain records of past delivery services.

Historical records should allow the system to answer questions such as:

-   What deliveries did an agent complete?
-   What was the status of a previous delivery?
-   When was a delivery completed?
-   Was the delivery delayed?
-   What rewards or penalties were associated with an agent?
-   What services has a courier provided?

The system should allow an administrator to query the past service
records of a courier/agent.

------------------------------------------------------------------------

# 11. User Roles

The application will use three roles.

## CUSTOMER

Customers can:

-   register
-   log in
-   create delivery requests
-   view their deliveries
-   view booking confirmations
-   track deliveries
-   cancel eligible bookings
-   request rescheduling
-   verify delivery using OTP
-   view delivery history

## AGENT

Agents can:

-   log in
-   view automatically assigned deliveries
-   view package/delivery information
-   update delivery status
-   confirm pickup
-   complete delivery using OTP verification
-   view delivery history
-   view performance
-   view reward/penalty information

## ADMIN

Administrators can:

-   log in
-   view system dashboard
-   create/update/deactivate agents
-   manage service areas
-   manage services
-   view packages
-   view bookings
-   view deliveries
-   inspect agent performance
-   manage rewards/penalties
-   view historical records

------------------------------------------------------------------------

# 12. Authentication and Authorization

The system must protect user accounts.

Requirements:

-   registration for customers
-   login
-   password hashing
-   JWT-based authentication
-   authenticated API requests
-   role-based authorization
-   protected frontend routes
-   protected backend endpoints

A user must only be allowed to perform operations appropriate for their
role.

For example:

``` text
CUSTOMER → Cannot manage agents
AGENT    → Cannot manage system users
ADMIN    → Can manage system data
```

------------------------------------------------------------------------

# 13. Delivery Verification

As an enhancement to the core delivery workflow, the system will use OTP
verification.

Flow:

``` text
Agent reaches destination
        ↓
Customer receives OTP
        ↓
Agent enters OTP
        ↓
Backend verifies OTP
        ↓
Delivery marked as DELIVERED
```

The backend must generate and verify the OTP.

The frontend must never be responsible for deciding whether an OTP is
valid.

------------------------------------------------------------------------

# 14. Maps and Location Integration

A maps/routing API may be integrated to improve the delivery workflow.

Possible uses:

-   convert addresses into coordinates
-   display source and destination on a map
-   calculate distance
-   estimate travel time
-   display delivery routes
-   provide distance information for agent assignment

Maps functionality is an enhancement and must not prevent the core
system from operating if the external API is unavailable.

------------------------------------------------------------------------

# 15. Notification Integration

An email/notification provider may be integrated.

Possible notifications:

-   booking confirmation
-   agent assignment
-   delivery status update
-   rescheduling confirmation
-   cancellation confirmation
-   delivery completion

Notification failure must not corrupt the main booking or delivery
transaction.

------------------------------------------------------------------------

# 16. Optional AI Enhancement

An AI API may be added only as an optional feature.

Possible use:

### Admin Delivery Analytics Assistant

Example questions:

> "Why were today's deliveries delayed?"

> "Summarize the performance of our delivery agents."

> "Which agents have the highest delay rate?"

The AI feature must operate on application data supplied by the backend.

It must not control core operations such as booking, assignment,
cancellation, or delivery status.

The project does NOT require machine learning or an AI model to perform
automatic agent assignment.

------------------------------------------------------------------------

# 17. Main Functional Modules

The application will contain these modules:

``` text
Authentication
    ↓
User Management
    ↓
Agent Management
    ↓
Location & Service Management
    ↓
Package / Delivery Request Management
    ↓
Automatic Agent Assignment
    ↓
Booking Management
    ↓
Delivery Tracking
    ↓
Cancellation
    ↓
Rescheduling
    ↓
OTP Verification
    ↓
Reward & Penalty Management
    ↓
Delivery History
    ↓
Notifications
    ↓
Reports / Analytics
```

------------------------------------------------------------------------

# 18. Core Entities

The initial system will use these main entities:

``` text
User
Agent
Service
Location
Package
Booking
Delivery
DeliveryHistory
RewardPenalty
Notification
```

The exact field definitions and relationships are specified separately
in `DATABASE_SCHEMA.md`.

------------------------------------------------------------------------

# 19. Core Application Flow

The complete normal delivery flow is:

``` text
1. Customer logs in
          ↓
2. Customer creates delivery request
          ↓
3. System validates shipping details
          ↓
4. System identifies eligible agents
          ↓
5. System automatically assigns an agent
          ↓
6. Booking is created
          ↓
7. Confirmation is generated
          ↓
8. Agent receives assignment
          ↓
9. Agent picks up package
          ↓
10. Delivery moves through status lifecycle
          ↓
11. Customer tracks delivery
          ↓
12. Agent reaches destination
          ↓
13. OTP is verified
          ↓
14. Delivery is marked DELIVERED
          ↓
15. Delivery history is stored
          ↓
16. Reward/penalty is calculated
```

------------------------------------------------------------------------

# 20. Cancellation Flow

``` text
Customer
   ↓
Request cancellation
   ↓
Backend validation
   ↓
Cancellation allowed?
   ├── No → Return error
   │
   └── Yes
         ↓
    Cancel booking
         ↓
    Update delivery
         ↓
    Record history
         ↓
    Generate confirmation
```

------------------------------------------------------------------------

# 21. Rescheduling Flow

``` text
Customer
   ↓
Request new schedule
   ↓
Backend validation
   ↓
Check availability/rules
   ↓
Update schedule
   ↓
Record history
   ↓
Notify customer/agent
```

------------------------------------------------------------------------

# 22. Automatic Assignment Requirements

The assignment service must be independent from the UI.

The frontend may display assignment results, but it must not decide
which agent receives a package.

The backend assignment service should:

``` text
Input:
- source location
- destination location
- requested service
- scheduled date/time
- package information

Output:
- selected agent
- assignment score/reason
- assignment timestamp
```

Example:

``` text
Request:
Vijayawada → Hyderabad
Service: EXPRESS

Eligible:
Agent A
Agent B
Agent C

Selected:
Agent B

Reason:
Available + suitable service area + lowest workload
```

------------------------------------------------------------------------

# 23. Data Ownership

## MongoDB

MongoDB is the primary application data store.

It will contain:

``` text
Users
Agents
Packages
Bookings
Deliveries
DeliveryHistory
RewardPenalties
Notifications
```

## Neo4j

Neo4j is used for relationship-oriented data involved in
agent/service/location matching.

It can represent:

``` text
Agent ──SERVES──> Location
Agent ──OFFERS──> Service
Agent ──AVAILABLE_IN──> Location
```

Neo4j is not required to store every application record.

------------------------------------------------------------------------

# 24. External API Requirements

External integrations must be isolated behind backend services.

Examples:

``` text
MapsService
NotificationService
OptionalAIService
```

API keys must be stored in environment variables.

No secret API key should be committed to the frontend source code or
public Git repository.

------------------------------------------------------------------------

# 25. Local Development Requirement

The complete system must be executable locally.

Required local components:

``` text
VS Code
Node.js
Angular
MongoDB
Neo4j
```

Expected development setup:

``` text
Angular       → localhost:4200
Backend API   → localhost:5000
MongoDB       → localhost:27017
Neo4j         → localhost:7687
```

Internet access is only required for external services/APIs that are
intentionally integrated.

No cloud deployment is required for the college demonstration.

------------------------------------------------------------------------

# 26. Non-Functional Requirements

## Usability

The UI should be:

-   clean
-   responsive
-   easy to navigate
-   consistent across customer, agent, and admin areas

## Security

The application should:

-   hash passwords
-   use JWT authentication
-   enforce role-based authorization
-   validate API input
-   protect secrets
-   handle authentication failures safely

## Reliability

The backend should:

-   validate business rules
-   use centralized error handling
-   prevent invalid delivery status transitions
-   prevent unauthorized operations
-   handle unavailable external APIs gracefully

## Maintainability

The project should:

-   use TypeScript
-   separate controllers/services/repositories
-   use reusable Angular components
-   keep database logic out of controllers
-   keep business logic out of Angular
-   use consistent naming

## Testability

Important backend services should be testable independently.

Priority areas:

-   authentication
-   agent eligibility
-   automatic assignment
-   booking
-   cancellation
-   rescheduling
-   delivery status transitions
-   OTP verification
-   reward/penalty calculation

------------------------------------------------------------------------

# 27. Project Scope

## Mandatory

These must be implemented:

-   authentication
-   shipping details
-   courier/agent information
-   service information
-   automatic agent identification/assignment
-   booking
-   booking confirmation
-   delivery status
-   tracking
-   cancellation
-   cancellation confirmation
-   rescheduling
-   reward/penalty calculation
-   historical records
-   courier/agent history queries
-   role-based access

## Recommended Enhancements

These should be added if implementation time permits:

-   OTP delivery verification
-   maps/routing integration
-   distance and ETA
-   email notifications
-   agent performance dashboard
-   analytics
-   charts
-   polished responsive UI

## Optional Enhancement

-   AI-powered admin analytics assistant

The optional enhancements must never compromise the mandatory
functionality.

------------------------------------------------------------------------

# 28. Out of Scope

The first version does not require:

-   real vehicle GPS hardware
-   actual payment processing
-   real e-commerce order processing
-   machine learning for agent assignment
-   cloud deployment
-   mobile applications
-   real courier-company integrations

These may be simulated or added later if required.

------------------------------------------------------------------------

# 29. Success Criteria

The project will be considered functionally complete when the following
scenario works end-to-end:

``` text
Customer logs in
      ↓
Creates a delivery request
      ↓
Enters source and destination
      ↓
Selects required delivery service
      ↓
System identifies eligible agents
      ↓
System automatically assigns an agent
      ↓
Booking confirmation is generated
      ↓
Agent sees the assignment
      ↓
Agent updates delivery status
      ↓
Customer sees tracking updates
      ↓
Customer/agent completes OTP verification
      ↓
Delivery becomes DELIVERED
      ↓
History is stored
      ↓
Reward/penalty is calculated
      ↓
Admin can view the completed service record
```

Cancellation and rescheduling must also work for eligible bookings.

------------------------------------------------------------------------

# 30. Important Cross-Project Rule

This requirements document is the foundation for the rest of the
project.

The following documents must remain consistent with it:

``` text
PROJECT_REQUIREMENTS.md
        ↓
ARCHITECTURE.md
        ↓
DATABASE_SCHEMA.md
        ↓
API_CONTRACT.md
        ↓
UI_SPECIFICATION.md
```

No AI coding tool should independently invent:

-   entity names
-   field names
-   role names
-   status values
-   API endpoints
-   request properties
-   response properties
-   business rules

If a requirement changes, update the relevant specification documents
before changing the implementation.

This prevents frontend, backend, and database inconsistencies.
