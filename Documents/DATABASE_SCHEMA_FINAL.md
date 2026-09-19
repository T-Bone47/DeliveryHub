# Delivery Agent System --- Database Schema Specification

**Primary database:** MongoDB\
**Graph database:** Neo4j\
**Purpose:** Define the exact data structures shared by the backend and
frontend.

> This document is the single source of truth for entity names, field
> names, data types, allowed values, and relationships. Frontend models
> and backend models must use these names unless this document is
> intentionally updated.

------------------------------------------------------------------------

# 1. Database Responsibilities

## MongoDB

MongoDB is the primary application database and stores persistent
business records:

-   users
-   agents
-   services
-   packages
-   bookings
-   deliveries
-   deliveryHistory
-   rewardPenalties
-   notifications

MongoDB is the source of truth for transactional application data.

## Neo4j

Neo4j is used for relationship-oriented information required for
automatic agent matching:

-   agents and locations they serve
-   agents and services they offer
-   agent availability relationships where useful

Neo4j does not need to duplicate every MongoDB document.

------------------------------------------------------------------------

# 2. Common ID Convention

MongoDB documents use:

``` text
_id: ObjectId
```

API responses expose the identifier as:

``` text
id: string
```

References between MongoDB documents are stored as ObjectId references.

Example:

``` text
booking.packageId
booking.customerId
booking.agentId
```

In Angular, these values are represented as strings.

------------------------------------------------------------------------

# 3. User Collection

Collection:

``` text
users
```

Schema:

``` text
_id              ObjectId
fullName         String
email            String
phone            String
passwordHash     String
role             String
isActive         Boolean
createdAt        Date
updatedAt        Date
```

Allowed roles:

``` text
ADMIN
CUSTOMER
AGENT
```

Rules:

-   `email` must be unique.
-   `passwordHash` must never be returned to the frontend.
-   `role` must be validated by the backend.
-   `isActive = false` prevents normal authentication/use of the
    account.

Example:

``` json
{
  "_id": "ObjectId",
  "fullName": "Ankitha",
  "email": "ankitha@example.com",
  "phone": "9876543210",
  "passwordHash": "HASHED_VALUE",
  "role": "CUSTOMER",
  "isActive": true,
  "createdAt": "2026-09-11T10:00:00Z",
  "updatedAt": "2026-09-11T10:00:00Z"
}
```

------------------------------------------------------------------------

# 4. Agent Collection

Collection:

``` text
agents
```

Schema:

``` text
_id                  ObjectId
userId               ObjectId
agentCode            String
vehicleType          String
status               String
rating               Number
activeDeliveries     Number
completedDeliveries  Number
onTimeDeliveries     Number
rewardPoints         Number
penaltyPoints        Number
createdAt             Date
updatedAt             Date
```

Allowed `vehicleType` values:

``` text
BIKE
CAR
VAN
TRUCK
```

Allowed `status` values:

``` text
AVAILABLE
BUSY
OFFLINE
SUSPENDED
```

Rules:

-   `userId` references a user with role `AGENT`.
-   `agentCode` must be unique.
-   `rating` is between 0 and 5.
-   delivery counters cannot be negative.
-   `rewardPoints` and `penaltyPoints` cannot be negative.

The `agents` collection stores operational/performance information.
Account information remains in `users`.

------------------------------------------------------------------------

# 5. Service Collection

Collection:

``` text
services
```

Schema:

``` text
_id          ObjectId
serviceCode  String
name         String
description  String
basePrice    Number
isActive     Boolean
createdAt    Date
updatedAt    Date
```

Example services:

``` text
STANDARD
EXPRESS
SAME_DAY
FRAGILE
```

Rules:

-   `serviceCode` must be unique.
-   `basePrice >= 0`.
-   inactive services cannot be selected for new bookings.

------------------------------------------------------------------------

# 6. Location Collection

Collection:

``` text
locations
```

Schema:

``` text
_id          ObjectId
name         String
city         String
state        String
postalCode   String
latitude     Number
longitude    Number
isActive     Boolean
createdAt    Date
updatedAt    Date
```

Example:

``` json
{
  "_id": "ObjectId",
  "name": "Vijayawada",
  "city": "Vijayawada",
  "state": "Andhra Pradesh",
  "postalCode": "520001",
  "latitude": 16.5062,
  "longitude": 80.6480,
  "isActive": true
}
```

Locations are used by the application and also correspond to location
nodes in Neo4j.

------------------------------------------------------------------------

# 7. Package Collection

Collection:

``` text
packages
```

This represents the physical shipment/delivery request.

Schema:

``` text
_id                     ObjectId
trackingNumber          String
customerId              ObjectId
packageType             String
description             String
weight                  Number
sourceLocation          Object
destinationLocation     Object
serviceId               ObjectId
scheduledDate           Date
status                  String
assignedAgentId         ObjectId | null
createdAt               Date
updatedAt               Date
```

## Embedded sourceLocation

``` text
address       String
city          String
state         String
postalCode    String
latitude      Number
longitude     Number
```

## Embedded destinationLocation

Same structure:

``` text
address       String
city          String
state         String
postalCode    String
latitude      Number
longitude     Number
```

Allowed `packageType` values:

``` text
DOCUMENT
PARCEL
ELECTRONICS
CLOTHING
FOOD
OTHER
```

Allowed `status` values:

``` text
PENDING
AGENT_ASSIGNED
PICKED_UP
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
RESCHEDULED
FAILED
```

Rules:

-   `trackingNumber` must be unique.
-   `customerId` references `users._id`.
-   `serviceId` references `services._id`.
-   `assignedAgentId` references `agents._id`.
-   `weight > 0`.
-   source and destination are required.
-   source and destination should not be identical.
-   status changes must be validated by the backend.

------------------------------------------------------------------------

# 8. Booking Collection

Collection:

``` text
bookings
```

Schema:

``` text
_id                  ObjectId
bookingNumber        String
packageId            ObjectId
customerId           ObjectId
agentId              ObjectId
serviceId            ObjectId
bookingDate          Date
scheduledDate        Date
status               String
confirmationCode     String
cancellationReason   String | null
createdAt            Date
updatedAt            Date
```

Allowed booking statuses:

``` text
PENDING
CONFIRMED
CANCELLED
COMPLETED
RESCHEDULED
```

Rules:

-   `bookingNumber` must be unique.
-   `confirmationCode` must be unique.
-   `packageId` references `packages._id`.
-   `customerId` references `users._id`.
-   `agentId` references `agents._id`.
-   `serviceId` references `services._id`.

------------------------------------------------------------------------

# 9. Delivery Collection

Collection:

``` text
deliveries
```

This represents the operational delivery record.

Schema:

``` text
_id                  ObjectId
packageId            ObjectId
bookingId            ObjectId
agentId              ObjectId
currentStatus        String
pickupTime           Date | null
estimatedDeliveryTime Date | null
actualDeliveryTime   Date | null
otpHash              String | null
otpExpiresAt         Date | null
createdAt            Date
updatedAt            Date
```

Allowed `currentStatus` values:

``` text
PENDING
AGENT_ASSIGNED
PICKED_UP
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
RESCHEDULED
FAILED
```

Rules:

-   `otpHash` is never returned to the frontend.
-   OTP expiry must be enforced by the backend.
-   `actualDeliveryTime` is populated only when delivery is completed.
-   invalid status transitions must be rejected.

------------------------------------------------------------------------

# 10. Delivery History Collection

Collection:

``` text
deliveryHistory
```

Each important event produces one history record.

Schema:

``` text
_id             ObjectId
packageId       ObjectId
bookingId       ObjectId | null
agentId         ObjectId | null
status          String
remarks         String
timestamp       Date
changedByUserId ObjectId | null
```

Example:

``` json
{
  "_id": "ObjectId",
  "packageId": "ObjectId",
  "bookingId": "ObjectId",
  "agentId": "ObjectId",
  "status": "PICKED_UP",
  "remarks": "Package picked up from source location",
  "timestamp": "2026-09-11T12:30:00Z",
  "changedByUserId": "ObjectId"
}
```

This collection supports:

-   delivery tracking timelines
-   historical service records
-   agent history
-   auditing

------------------------------------------------------------------------

# 11. Reward/Penalty Collection

Collection:

``` text
rewardPenalties
```

Schema:

``` text
_id          ObjectId
agentId      ObjectId
packageId    ObjectId | null
type         String
reason       String
points       Number
amount       Number | null
createdAt    Date
createdBy    ObjectId
```

Allowed `type` values:

``` text
REWARD
PENALTY
```

Rules:

-   `points > 0`.
-   `agentId` references `agents._id`.
-   `packageId` is optional when the record is not associated with a
    single delivery.
-   `createdBy` references the administrator who created the record when
    manually created.

------------------------------------------------------------------------

# 12. Notification Collection

Collection:

``` text
notifications
```

Schema:

``` text
_id          ObjectId
userId       ObjectId
type         String
title        String
message      String
isRead       Boolean
relatedId    ObjectId | null
createdAt    Date
```

Allowed notification types may include:

``` text
BOOKING_CONFIRMED
AGENT_ASSIGNED
STATUS_UPDATED
BOOKING_CANCELLED
DELIVERY_RESCHEDULED
DELIVERY_COMPLETED
REWARD_ADDED
PENALTY_ADDED
```

Notifications are an application feature and may also be delivered
through an external email provider.

------------------------------------------------------------------------

# 13. MongoDB Relationships

The logical relationships are:

``` text
User
 |
 +---- owns ----> Package
 |
 +---- makes ---> Booking
 |
 +---- receives -> Notification
 |
 +---- performs -> Reward/Penalty (createdBy)

Agent
 |
 +---- receives --> Package
 |
 +---- handles ---> Booking
 |
 +---- handles ---> Delivery
 |
 +---- has -------> DeliveryHistory
 |
 +---- receives --> Reward/Penalty

Package
 |
 +---- has -------> Booking
 |
 +---- has -------> Delivery
 |
 +---- has -------> DeliveryHistory
 |
 +---- may have --> Reward/Penalty

Service
 |
 +---- selected by --> Package
 |
 +---- selected by --> Booking
```

------------------------------------------------------------------------

# 14. Neo4j Graph Model

Neo4j represents relationships used by agent matching.

## Nodes

``` text
(:Agent)
(:Location)
(:Service)
```

## Relationships

``` text
(:Agent)-[:SERVES]->(:Location)

(:Agent)-[:OFFERS]->(:Service)
```

Optional relationship:

``` text
(:Agent)-[:AVAILABLE_IN]->(:Location)
```

Example graph:

``` text
                 +-------------+
                 |   Agent A   |
                 +------+------+ 
                        |
              +---------+---------+
              |                   |
           SERVES              OFFERS
              |                   |
              v                   v
        +-----------+        +---------+
        | Hyderabad |        | EXPRESS |
        +-----------+        +---------+
```

Another example:

``` text
Agent A
  |
  +-- SERVES --> Vijayawada
  |
  +-- SERVES --> Hyderabad
  |
  +-- OFFERS --> EXPRESS
  |
  +-- OFFERS --> STANDARD
```

------------------------------------------------------------------------

# 15. Neo4j and MongoDB Identity Mapping

MongoDB remains the source of truth for agent information.

Neo4j should store the MongoDB agent ID as a property.

Example:

``` text
(:Agent {
    agentId: "MongoDB-Agent-ID",
    name: "Rahul Kumar"
})
```

Location nodes can similarly contain:

``` text
(:Location {
    locationId: "MongoDB-Location-ID",
    city: "Hyderabad"
})
```

Service nodes:

``` text
(:Service {
    serviceId: "MongoDB-Service-ID",
    code: "EXPRESS"
})
```

This prevents the two databases from using unrelated identities.

------------------------------------------------------------------------

# 16. Automatic Assignment Data Flow

Input:

``` text
sourceLocation
destinationLocation
serviceId
scheduledDate
```

Process:

``` text
1. Receive package request
          |
2. Validate MongoDB data
          |
3. Find candidate agents using Neo4j
          |
4. Check candidate agent status in MongoDB
          |
5. Check active workload
          |
6. Obtain distance/ETA when Maps API is enabled
          |
7. Calculate assignment score
          |
8. Select agent
          |
9. Update packages.assignedAgentId
          |
10. Create booking
          |
11. Create delivery
          |
12. Create history record
          |
13. Create notification
```

------------------------------------------------------------------------

# 17. Assignment Score

The initial implementation can use:

``` text
Assignment Score =
    Distance Score       × 40%
  + Workload Score       × 25%
  + Rating Score         × 20%
  + On-Time Score        × 15%
```

This formula is an implementation choice, not an AI/ML requirement.

The backend must own this calculation.

The frontend only displays the result.

------------------------------------------------------------------------

# 18. Required Indexes

Recommended MongoDB indexes:

``` text
users.email                    UNIQUE
agents.agentCode               UNIQUE
services.serviceCode           UNIQUE
packages.trackingNumber        UNIQUE
bookings.bookingNumber         UNIQUE
bookings.confirmationCode      UNIQUE
```

Useful query indexes:

``` text
packages.customerId
packages.assignedAgentId
packages.status
bookings.customerId
bookings.agentId
bookings.status
deliveryHistory.packageId
deliveryHistory.agentId
rewardPenalties.agentId
notifications.userId
```

------------------------------------------------------------------------

# 19. Data Consistency Rules

The following relationships must always remain consistent.

### Package assignment

If:

``` text
packages.assignedAgentId = A
```

then a corresponding agent must exist in `agents`.

### Booking

If:

``` text
booking.packageId = P
```

then package P must exist.

### Delivery

If:

``` text
delivery.bookingId = B
```

then booking B must exist.

### Agent

If:

``` text
agent.userId = U
```

then user U must have role `AGENT`.

The backend is responsible for enforcing these rules.

------------------------------------------------------------------------

# 20. Frontend Model Mapping

Angular models must correspond to these backend fields.

Example:

``` typescript
interface Package {
  id: string;
  trackingNumber: string;
  customerId: string;
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: Location;
  destinationLocation: Location;
  serviceId: string;
  scheduledDate: string;
  status: PackageStatus;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

The frontend must NOT rename:

``` text
trackingNumber → trackingId
```

or:

``` text
assignedAgentId → deliveryPartner
```

unless the API contract is intentionally changed.

User-facing labels can be different from database field names.

For example:

``` text
Database/API: assignedAgentId
UI label: Assigned Agent
```

------------------------------------------------------------------------

# 21. Naming Conventions

Use these conventions consistently:

### Database/API fields

``` text
camelCase
```

Examples:

``` text
fullName
trackingNumber
assignedAgentId
scheduledDate
status / currentStatus
```

### TypeScript interfaces

Use PascalCase:

``` text
User
Agent
Package
Booking
Delivery
DeliveryHistory
RewardPenalty
Notification
```

### Enum values

Use uppercase:

``` text
PENDING
DELIVERED
CANCELLED
```

------------------------------------------------------------------------

# 22. Fields That Must Never Reach the Frontend

Never expose:

``` text
passwordHash
otpHash
JWT secret
database credentials
API provider secret keys
Neo4j password
```

The backend must remove sensitive fields from API responses.

------------------------------------------------------------------------

# 23. Source of Truth Rule

The final relationship between project documents is:

``` text
PROJECT_REQUIREMENTS.md
          |
          v
DATABASE_SCHEMA.md
          |
          v
API_CONTRACT.md
          |
          v
UI_SPECIFICATION.md
```

If a field is changed:

1.  Update this database schema.
2.  Update the API contract.
3.  Update frontend models/forms.
4.  Update backend models/services.
5.  Update seed data/tests.

Never silently introduce a field in only one layer.

------------------------------------------------------------------------

# 24. Initial Seed Data

The development environment should include seed data for demonstration.

Suggested minimum:

``` text
1 Admin
2 Customers
5 Agents
4 Services
6 Locations
10 Packages
several delivery-history records
several reward/penalty records
```

Seed data must be clearly marked as development/demo data.

Passwords must be hashed even for seeded users.

------------------------------------------------------------------------

# 25. Database Design Goal

The database design should support the following complete scenario:

``` text
Customer
   |
   v
Package
   |
   +---- sourceLocation
   +---- destinationLocation
   +---- service
   |
   v
Automatic Agent Assignment
   |
   v
Agent
   |
   v
Booking
   |
   v
Delivery
   |
   +---- Delivery History
   +---- OTP verification
   |
   v
Delivered
   |
   +---- Reward/Penalty
   |
   v
Historical Record
```

This schema is intentionally designed to keep MongoDB as the main
application database while giving Neo4j a focused purpose for
relationship-based agent matching.
