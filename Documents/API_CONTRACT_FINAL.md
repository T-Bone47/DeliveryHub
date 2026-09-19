# Delivery Agent System --- API Contract

**Base URL:** `http://localhost:5000/api`

**Protocol:** HTTP/HTTPS + JSON\
**Authentication:** JWT Bearer Token\
**Backend:** Node.js + Express + TypeScript

> This document is the integration contract between the Angular frontend
> and backend. Frontend and backend implementations must follow these
> endpoint names, field names, status values, request structures, and
> response structures.

------------------------------------------------------------------------

# 1. General Rules

## 1.1 Content Type

Requests containing JSON must use:

``` http
Content-Type: application/json
```

Responses use:

``` http
Content-Type: application/json
```

## 1.2 Authentication Header

Protected requests use:

``` http
Authorization: Bearer <JWT_TOKEN>
```

## 1.3 Standard Success Response

``` json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

## 1.4 Standard Error Response

``` json
{
  "success": false,
  "message": "A readable error message",
  "error": "ERROR_CODE"
}
```

The frontend must use `message` for a user-facing message and may use
`error` for programmatic handling.

------------------------------------------------------------------------

# 2. Common HTTP Status Codes

``` text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

------------------------------------------------------------------------

# 3. Authentication API

Base:

``` text
/api/auth
```

## 3.1 Register Customer

``` http
POST /api/auth/register
```

Request:

``` json
{
  "fullName": "Ankitha",
  "email": "ankitha@example.com",
  "phone": "9876543210",
  "password": "Password123"
}
```

Response:

``` json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "USER_ID",
      "fullName": "Ankitha",
      "email": "ankitha@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "isActive": true
    }
  }
}
```

The response must never contain `passwordHash`.

------------------------------------------------------------------------

## 3.2 Login

``` http
POST /api/auth/login
```

Request:

``` json
{
  "email": "ankitha@example.com",
  "password": "Password123"
}
```

Response:

``` json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "USER_ID",
      "fullName": "Ankitha",
      "email": "ankitha@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "isActive": true
    }
  }
}
```

------------------------------------------------------------------------

## 3.3 Current User

``` http
GET /api/auth/me
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "USER_ID",
      "fullName": "Ankitha",
      "email": "ankitha@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "isActive": true
    }
  }
}
```

------------------------------------------------------------------------

# 4. User API

Base:

``` text
/api/users
```

These endpoints are primarily for administrators.

## 4.1 List Users

``` http
GET /api/users
```

Role: `ADMIN`

Optional query parameters:

``` text
role=AGENT
isActive=true
page=1
limit=20
search=Rahul
```

Response:

``` json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

------------------------------------------------------------------------

## 4.2 Get User

``` http
GET /api/users/:id
```

Role: `ADMIN`

------------------------------------------------------------------------

## 4.3 Update User

``` http
PUT /api/users/:id
```

Role: `ADMIN`

Request:

``` json
{
  "fullName": "Updated Name",
  "phone": "9876543210",
  "isActive": true
}
```

Do not allow arbitrary role changes through this endpoint unless
explicitly supported by the backend.

------------------------------------------------------------------------

# 5. Agent API

Base:

``` text
/api/agents
```

## 5.1 List Agents

``` http
GET /api/agents
```

Authentication: Required

Optional query parameters:

``` text
status=AVAILABLE
city=Hyderabad
serviceId=SERVICE_ID
page=1
limit=20
```

Response:

``` json
{
  "success": true,
  "message": "Agents retrieved successfully",
  "data": {
    "agents": [
      {
        "id": "AGENT_ID",
        "userId": "USER_ID",
        "fullName": "Rahul Kumar",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "agentCode": "AGT001",
        "vehicleType": "BIKE",
        "status": "AVAILABLE",
        "rating": 4.7,
        "activeDeliveries": 2,
        "completedDeliveries": 128,
        "onTimeDeliveries": 117,
        "rewardPoints": 840,
        "penaltyPoints": 35
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

------------------------------------------------------------------------

## 5.2 Get Agent

``` http
GET /api/agents/:id
```

Authentication: Required

------------------------------------------------------------------------

## 5.3 Create Agent

``` http
POST /api/agents
```

Role: `ADMIN`

Request:

``` json
{
  "fullName": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "password": "AgentPassword123",
  "agentCode": "AGT001",
  "vehicleType": "BIKE",
  "status": "AVAILABLE"
}
```

The backend creates the user account and agent record.

------------------------------------------------------------------------

## 5.4 Update Agent

``` http
PUT /api/agents/:id
```

Role: `ADMIN`

Request may contain:

``` json
{
  "fullName": "Rahul Kumar",
  "phone": "9876543210",
  "vehicleType": "CAR",
  "status": "AVAILABLE"
}
```

------------------------------------------------------------------------

## 5.5 Update Agent Availability

``` http
PUT /api/agents/:id/status
```

Roles: `ADMIN`, `AGENT` for own status

Request:

``` json
{
  "status": "AVAILABLE"
}
```

Allowed:

``` text
AVAILABLE
BUSY
OFFLINE
SUSPENDED
```

An agent cannot set their own status to `SUSPENDED`.

------------------------------------------------------------------------

## 5.6 Agent Performance

``` http
GET /api/agents/:id/performance
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "Agent performance retrieved successfully",
  "data": {
    "agentId": "AGENT_ID",
    "completedDeliveries": 128,
    "onTimeDeliveries": 117,
    "delayedDeliveries": 11,
    "onTimeRate": 91.4,
    "rating": 4.7,
    "rewardPoints": 840,
    "penaltyPoints": 35
  }
}
```

------------------------------------------------------------------------

# 6. Service API

Base:

``` text
/api/services
```

## 6.1 List Services

``` http
GET /api/services
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "Services retrieved successfully",
  "data": {
    "services": [
      {
        "id": "SERVICE_ID",
        "serviceCode": "EXPRESS",
        "name": "Express Delivery",
        "description": "Fast delivery service",
        "basePrice": 150,
        "isActive": true
      }
    ]
  }
}
```

------------------------------------------------------------------------

## 6.2 Create Service

``` http
POST /api/services
```

Role: `ADMIN`

Request:

``` json
{
  "serviceCode": "EXPRESS",
  "name": "Express Delivery",
  "description": "Fast delivery service",
  "basePrice": 150,
  "isActive": true
}
```

------------------------------------------------------------------------

## 6.3 Update Service

``` http
PUT /api/services/:id
```

Role: `ADMIN`

------------------------------------------------------------------------

## 6.4 Deactivate Service

``` http
PUT /api/services/:id/status
```

Role: `ADMIN`

Request:

``` json
{
  "isActive": false
}
```

------------------------------------------------------------------------

# 7. Location API

Base:

``` text
/api/locations
```

## 7.1 List Locations

``` http
GET /api/locations
```

Authentication: Required

Optional:

``` text
city=Hyderabad
state=Telangana
```

------------------------------------------------------------------------

## 7.2 Create Location

``` http
POST /api/locations
```

Role: `ADMIN`

Request:

``` json
{
  "name": "Hyderabad",
  "city": "Hyderabad",
  "state": "Telangana",
  "postalCode": "500001",
  "latitude": 17.385,
  "longitude": 78.4867,
  "isActive": true
}
```

------------------------------------------------------------------------

## 7.3 Update Location

``` http
PUT /api/locations/:id
```

Role: `ADMIN`

------------------------------------------------------------------------

# 8. Package API

Base:

``` text
/api/packages
```

## 8.1 Create Delivery Request

``` http
POST /api/packages
```

Role: `CUSTOMER`

Request:

``` json
{
  "packageType": "DOCUMENT",
  "description": "College documents",
  "weight": 1.2,
  "sourceLocation": {
    "address": "Vijayawada",
    "city": "Vijayawada",
    "state": "Andhra Pradesh",
    "postalCode": "520001",
    "latitude": 16.5062,
    "longitude": 80.648
  },
  "destinationLocation": {
    "address": "Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "postalCode": "500001",
    "latitude": 17.385,
    "longitude": 78.4867
  },
  "serviceId": "SERVICE_ID",
  "scheduledDate": "2026-09-15T10:00:00.000Z"
}
```

The backend should:

1.  validate the request
2.  create the package
3.  identify eligible agents
4.  automatically assign an agent when possible
5.  create booking/delivery records
6.  generate tracking/booking identifiers
7.  create history records
8.  trigger notifications where enabled

Response:

``` json
{
  "success": true,
  "message": "Delivery request created and agent assigned successfully",
  "data": {
    "package": {
      "id": "PACKAGE_ID",
      "trackingNumber": "DLV-2026-00123",
      "customerId": "USER_ID",
      "packageType": "DOCUMENT",
      "description": "College documents",
      "weight": 1.2,
      "sourceLocation": {},
      "destinationLocation": {},
      "serviceId": "SERVICE_ID",
      "scheduledDate": "2026-09-15T10:00:00.000Z",
      "status": "AGENT_ASSIGNED",
      "assignedAgentId": "AGENT_ID"
    },
    "assignment": {
      "agentId": "AGENT_ID",
      "agentName": "Rahul Kumar",
      "score": 87.5,
      "distanceKm": 3.2,
      "estimatedMinutes": 12
    },
    "booking": {
      "id": "BOOKING_ID",
      "bookingNumber": "BK-2026-00123",
      "confirmationCode": "CNF78291",
      "status": "CONFIRMED"
    }
  }
}
```

If no eligible agent is available, the backend should create the request
with:

``` text
status = PENDING
assignedAgentId = null
```

and return a clear message. It must not invent an agent.

------------------------------------------------------------------------

## 8.2 List Customer Packages

``` http
GET /api/packages/my
```

Role: `CUSTOMER`

Optional:

``` text
status=IN_TRANSIT
page=1
limit=20
```

------------------------------------------------------------------------

## 8.3 List All Packages

``` http
GET /api/packages
```

Role: `ADMIN`

Optional filters:

``` text
status
agentId
customerId
serviceId
fromDate
toDate
page
limit
```

------------------------------------------------------------------------

## 8.4 Get Package

``` http
GET /api/packages/:id
```

Authentication: Required

A customer may only access their own package.

An agent may access packages assigned to them.

An admin may access any package.

------------------------------------------------------------------------

## 8.5 Manually Retry Assignment

``` http
POST /api/packages/:id/assign
```

Roles: `ADMIN`

Use this when a package remained `PENDING` because no agent was
available.

Request body:

``` json
{}
```

The backend runs the normal assignment service again.

Response:

``` json
{
  "success": true,
  "message": "Agent assigned successfully",
  "data": {
    "packageId": "PACKAGE_ID",
    "agentId": "AGENT_ID",
    "agentName": "Rahul Kumar",
    "score": 87.5
  }
}
```

------------------------------------------------------------------------

## 8.6 Get Assignment Details

``` http
GET /api/packages/:id/assignment
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "Assignment details retrieved successfully",
  "data": {
    "packageId": "PACKAGE_ID",
    "agentId": "AGENT_ID",
    "agentName": "Rahul Kumar",
    "score": 87.5,
    "distanceKm": 3.2,
    "estimatedMinutes": 12,
    "assignedAt": "2026-09-15T08:10:00.000Z"
  }
}
```

------------------------------------------------------------------------

# 9. Booking API

Base:

``` text
/api/bookings
```

## 9.1 Get Customer Bookings

``` http
GET /api/bookings/my
```

Role: `CUSTOMER`

------------------------------------------------------------------------

## 9.2 Get Agent Bookings

``` http
GET /api/bookings/agent
```

Role: `AGENT`

------------------------------------------------------------------------

## 9.3 Get All Bookings

``` http
GET /api/bookings
```

Role: `ADMIN`

------------------------------------------------------------------------

## 9.4 Get Booking

``` http
GET /api/bookings/:id
```

Authentication: Required

------------------------------------------------------------------------

## 9.5 Cancel Booking

``` http
PUT /api/bookings/:id/cancel
```

Roles: `CUSTOMER`, `ADMIN`

Request:

``` json
{
  "reason": "Customer requested cancellation"
}
```

Response:

``` json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": "BOOKING_ID",
    "bookingNumber": "BK-2026-00123",
    "status": "CANCELLED",
    "cancellationReason": "Customer requested cancellation"
  }
}
```

------------------------------------------------------------------------

## 9.6 Reschedule Booking

``` http
PUT /api/bookings/:id/reschedule
```

Role: `CUSTOMER`

Request:

``` json
{
  "scheduledDate": "2026-09-17T10:00:00.000Z"
}
```

Response:

``` json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "data": {
    "bookingId": "BOOKING_ID",
    "scheduledDate": "2026-09-17T10:00:00.000Z",
    "status": "RESCHEDULED"
  }
}
```

The backend decides whether the existing agent can continue or whether
reassignment is necessary.

------------------------------------------------------------------------

# 10. Delivery API

Base:

``` text
/api/deliveries
```

## 10.1 List Deliveries

``` http
GET /api/deliveries
```

Role: `ADMIN`

Optional filters:

``` text
status
agentId
customerId
fromDate
toDate
page
limit
```

This endpoint supports the admin delivery-management list.

------------------------------------------------------------------------

## 10.2 Get Delivery

``` http
GET /api/deliveries/:id
```

Authentication: Required

------------------------------------------------------------------------

## 10.3 Get Tracking Information

``` http
GET /api/deliveries/:id/tracking
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "Tracking information retrieved successfully",
  "data": {
    "packageId": "PACKAGE_ID",
    "trackingNumber": "DLV-2026-00123",
    "currentStatus": "IN_TRANSIT",
    "agent": {
      "id": "AGENT_ID",
      "fullName": "Rahul Kumar",
      "phone": "9876543210"
    },
    "scheduledDate": "2026-09-15T10:00:00.000Z",
    "estimatedDeliveryTime": "2026-09-15T17:30:00.000Z",
    "history": [
      {
        "status": "PENDING",
        "remarks": "Delivery request received",
        "timestamp": "2026-09-15T08:00:00.000Z"
      },
      {
        "status": "AGENT_ASSIGNED",
        "remarks": "Agent automatically assigned",
        "timestamp": "2026-09-15T08:10:00.000Z"
      }
    ]
  }
}
```

------------------------------------------------------------------------

## 10.4 Update Delivery Status

``` http
PUT /api/deliveries/:id/status
```

Role: `AGENT` for assigned delivery, `ADMIN`

Request:

``` json
{
  "status": "PICKED_UP",
  "remarks": "Package picked up successfully"
}
```

Allowed status values:

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

The backend validates the transition.

Example:

``` text
AGENT_ASSIGNED → PICKED_UP       valid
PICKED_UP      → IN_TRANSIT      valid
IN_TRANSIT     → DELIVERED       invalid if OTP verification is required
```

Response:

``` json
{
  "success": true,
  "message": "Delivery status updated successfully",
  "data": {
    "deliveryId": "DELIVERY_ID",
    "status": "PICKED_UP",
    "updatedAt": "2026-09-15T12:30:00.000Z"
  }
}
```

------------------------------------------------------------------------

# 11. OTP API

Base:

``` text
/api/deliveries
```

## 11.1 Generate Delivery OTP

``` http
POST /api/deliveries/:id/generate-otp
```

Role: `CUSTOMER`

The backend generates a short-lived OTP and sends it through the
configured notification channel.

Development mode may expose the OTP in server logs or a controlled
development response, but production responses must not expose secrets.

Response:

``` json
{
  "success": true,
  "message": "Delivery OTP generated successfully",
  "data": {
    "expiresAt": "2026-09-15T18:00:00.000Z"
  }
}
```

------------------------------------------------------------------------

## 11.2 Verify Delivery OTP

``` http
POST /api/deliveries/:id/verify-otp
```

Role: `AGENT`

Request:

``` json
{
  "otp": "482913"
}
```

Response:

``` json
{
  "success": true,
  "message": "OTP verified. Delivery completed successfully",
  "data": {
    "deliveryId": "DELIVERY_ID",
    "status": "DELIVERED",
    "actualDeliveryTime": "2026-09-15T18:00:00.000Z"
  }
}
```

The backend must:

1.  verify the OTP
2.  check expiration
3.  ensure the agent is authorized for the delivery
4.  update delivery status
5.  create history
6.  calculate reward/penalty
7.  trigger completion notification

------------------------------------------------------------------------

# 12. History API

Base:

``` text
/api/history
```

## 12.1 List Historical Records

``` http
GET /api/history
```

Role: `ADMIN`

Optional filters:

``` text
agentId
customerId
serviceId
status
fromDate
toDate
page
limit
```

This endpoint supports the admin historical-record search page.

------------------------------------------------------------------------

## 12.2 Package History

``` http
GET /api/history/package/:packageId
```

Authentication: Required

Response:

``` json
{
  "success": true,
  "message": "Delivery history retrieved successfully",
  "data": {
    "history": [
      {
        "id": "HISTORY_ID",
        "packageId": "PACKAGE_ID",
        "agentId": "AGENT_ID",
        "status": "PICKED_UP",
        "remarks": "Package picked up",
        "timestamp": "2026-09-15T12:30:00.000Z"
      }
    ]
  }
}
```

------------------------------------------------------------------------

### Customer history

The customer history screen uses:

``` http
GET /api/packages/my?status=DELIVERED
```

A customer may then open an individual package to view its detailed
event history through `GET /api/history/package/:packageId`.

------------------------------------------------------------------------

## 12.3 Agent History

``` http
GET /api/history/agent/:agentId
```

Roles: `AGENT` for own history, `ADMIN`

Optional:

``` text
fromDate
toDate
status
page
limit
```

------------------------------------------------------------------------

# 13. Reward/Penalty API

Base:

``` text
/api/rewards
```

## 13.1 Agent Rewards and Penalties

``` http
GET /api/rewards/agent/:agentId
```

Authentication: Required

------------------------------------------------------------------------

## 13.2 Add Reward

``` http
POST /api/rewards/agent/:agentId/reward
```

Role: `ADMIN`

Request:

``` json
{
  "reason": "Excellent on-time delivery",
  "points": 10,
  "packageId": "PACKAGE_ID"
}
```

Response:

``` json
{
  "success": true,
  "message": "Reward added successfully",
  "data": {
    "id": "REWARD_ID",
    "agentId": "AGENT_ID",
    "type": "REWARD",
    "reason": "Excellent on-time delivery",
    "points": 10
  }
}
```

------------------------------------------------------------------------

## 13.3 Add Penalty

``` http
POST /api/rewards/agent/:agentId/penalty
```

Role: `ADMIN`

Request:

``` json
{
  "reason": "Late delivery",
  "points": 5,
  "packageId": "PACKAGE_ID"
}
```

------------------------------------------------------------------------

# 14. Notification API

Base:

``` text
/api/notifications
```

## 14.1 Get My Notifications

``` http
GET /api/notifications
```

Authentication: Required

Optional:

``` text
isRead=false
page=1
limit=20
```

------------------------------------------------------------------------

## 14.2 Mark Notification Read

``` http
PUT /api/notifications/:id/read
```

Authentication: Required

------------------------------------------------------------------------

# 15. Admin Dashboard API

Base:

``` text
/api/admin
```

## 15.1 Dashboard Summary

``` http
GET /api/admin/dashboard
```

Role: `ADMIN`

Response:

``` json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "totalDeliveries": 1284,
    "activeDeliveries": 42,
    "deliveredDeliveries": 1198,
    "delayedDeliveries": 44,
    "pendingDeliveries": 17,
    "totalAgents": 50,
    "availableAgents": 21
  }
}
```

The dashboard values should be calculated by the backend from
application data rather than hard-coded in Angular.

------------------------------------------------------------------------

# 16. Maps API Integration

Maps/routing providers are external to the application's REST API.

The Angular frontend should not contain provider secrets.

Preferred flow:

``` text
Angular
   ↓
Backend
   ↓
MapsService
   ↓
External Maps API
```

Possible backend endpoint:

``` http
GET /api/maps/distance
```

Example query:

``` text
/api/maps/distance?originLat=16.5062&originLng=80.648&destinationLat=17.385&destinationLng=78.4867
```

Response:

``` json
{
  "success": true,
  "message": "Route information retrieved successfully",
  "data": {
    "distanceKm": 274.5,
    "estimatedMinutes": 360
  }
}
```

The exact external provider can be selected later.

------------------------------------------------------------------------

# 17. AI Analytics API --- Optional

This feature is optional.

``` http
POST /api/admin/ai/summary
```

Role: `ADMIN`

Request:

``` json
{
  "question": "Why were today's deliveries delayed?"
}
```

The backend gathers appropriate application statistics and sends only
necessary information to the AI provider.

Response:

``` json
{
  "success": true,
  "message": "AI summary generated successfully",
  "data": {
    "summary": "Today's delays were primarily associated with..."
  }
}
```

AI must not directly modify bookings, agents, delivery statuses, or
database records.

------------------------------------------------------------------------

# 18. Authorization Matrix

  Endpoint Area                              CUSTOMER        AGENT         ADMIN
  ------------------------ -------------------------- ------------ -------------
  Register                                          ✓          ---           ---
  Login                                             ✓            ✓             ✓
  Own profile                                       ✓            ✓             ✓
  User management                                 ---          ---             ✓
  View agents                                 limited            ✓             ✓
  Manage agents                                   ---          ---             ✓
  View services                                     ✓            ✓             ✓
  Manage services                                 ---          ---             ✓
  Create package                                    ✓          ---             ✓
  View own packages                                 ✓          ---             ✓
  View assigned packages                          ---            ✓             ✓
  Automatic assignment                         system       system       ✓ retry
  View own bookings                                 ✓   ✓ assigned             ✓
  Cancel booking                           ✓ eligible          ---             ✓
  Reschedule booking                       ✓ eligible          ---             ✓
  Update delivery status                          ---   ✓ assigned             ✓
  Generate OTP                                      ✓          ---   ✓ if needed
  Verify OTP                                      ---   ✓ assigned   ✓ if needed
  View history                                  ✓ own        ✓ own             ✓
  Manage rewards                                  ---          ---             ✓
  View rewards               ✓ own summary if desired            ✓             ✓
  Notifications                                     ✓            ✓             ✓
  Admin dashboard                                 ---          ---             ✓
  AI analytics                                    ---          ---             ✓

The backend is authoritative for authorization.

------------------------------------------------------------------------

# 19. API Field Naming Contract

The following names are fixed.

``` text
fullName
email
phone
password
role
isActive

userId
agentId
agentCode
vehicleType
activeDeliveries
completedDeliveries
onTimeDeliveries
delayedDeliveries
onTimeRate
rewardPoints
penaltyPoints

serviceId
serviceCode
basePrice

packageId
trackingNumber
packageType
description
weight
sourceLocation
destinationLocation
scheduledDate
assignedAgentId

bookingId
bookingNumber
bookingDate
confirmationCode
cancellationReason

deliveryId
currentStatus
pickupTime
estimatedDeliveryTime
actualDeliveryTime

status
remarks
timestamp

type
reason
points

notificationId
title
message
isRead
relatedId
```

Do not introduce alternatives such as:

``` text
username
userName
name
trackingId
deliveryPartnerId
scheduledAt
```

unless the contract is deliberately updated.

------------------------------------------------------------------------

# 20. Standard Angular Data Models

The frontend should create TypeScript interfaces matching the API.

Example:

``` typescript
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'CUSTOMER' | 'AGENT';
  isActive: boolean;
}

interface Agent {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  agentCode: string;
  vehicleType: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'SUSPENDED';
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  rewardPoints: number;
  penaltyPoints: number;
}
```

The complete frontend models will be defined in `UI_SPECIFICATION.md`.

------------------------------------------------------------------------

# 21. Validation Rules

The backend must validate all requests.

Examples:

### Registration

``` text
fullName → required
email → required + valid format + unique
phone → required
password → required + minimum strength
```

### Package

``` text
packageType → required
description → required
weight → > 0
sourceLocation → required
destinationLocation → required
serviceId → must exist and be active
scheduledDate → valid date
```

### Rescheduling

``` text
scheduledDate → required
scheduledDate → must satisfy scheduling rules
```

### Reward/Penalty

``` text
reason → required
points → positive
agentId → must exist
```

------------------------------------------------------------------------

# 22. Error Codes

Recommended stable error codes:

``` text
VALIDATION_ERROR
INVALID_CREDENTIALS
UNAUTHORIZED
FORBIDDEN
USER_NOT_FOUND
AGENT_NOT_FOUND
PACKAGE_NOT_FOUND
BOOKING_NOT_FOUND
DELIVERY_NOT_FOUND
SERVICE_NOT_FOUND
NO_AGENT_AVAILABLE
INVALID_STATUS_TRANSITION
CANCELLATION_NOT_ALLOWED
RESCHEDULE_NOT_ALLOWED
INVALID_OTP
OTP_EXPIRED
DUPLICATE_EMAIL
DUPLICATE_AGENT_CODE
DUPLICATE_TRACKING_NUMBER
EXTERNAL_SERVICE_ERROR
INTERNAL_SERVER_ERROR
```

The frontend may use these codes for specific UI behavior.

------------------------------------------------------------------------

# 23. Status Transition Rules

The backend must enforce the lifecycle.

Recommended valid transitions:

``` text
PENDING
  └──> AGENT_ASSIGNED
  └──> CANCELLED

AGENT_ASSIGNED
  └──> PICKED_UP
  └──> CANCELLED
  └──> RESCHEDULED

PICKED_UP
  └──> IN_TRANSIT
  └──> FAILED

IN_TRANSIT
  └──> OUT_FOR_DELIVERY
  └──> FAILED

OUT_FOR_DELIVERY
  └──> DELIVERED
  └──> FAILED

RESCHEDULED
  └──> AGENT_ASSIGNED

DELIVERED
  └──> no normal transition

CANCELLED
  └──> no normal transition

FAILED
  └──> RESCHEDULED
```

The exact transition policy can be adjusted during implementation, but
it must be defined centrally in the backend.

------------------------------------------------------------------------

# 24. Frontend/Backend Integration Rules

1.  Angular must never call MongoDB directly.
2.  Angular must never call Neo4j directly.
3.  Angular communicates through the REST API.
4.  API field names must match this document.
5.  API status values must match this document.
6.  Authentication uses JWT.
7.  The backend owns business rules.
8.  The backend owns assignment decisions.
9.  The backend owns OTP verification.
10. The backend owns reward/penalty calculations.
11. API keys must remain protected.
12. Error responses follow the standard structure.
13. New endpoints must be documented before frontend implementation.
14. New fields must be added to the database schema and API contract
    before UI implementation.

------------------------------------------------------------------------

# 25. End-to-End Example

## Step 1 --- Customer creates package

``` http
POST /api/packages
```

Frontend sends:

``` json
{
  "packageType": "PARCEL",
  "description": "Books",
  "weight": 2,
  "sourceLocation": {},
  "destinationLocation": {},
  "serviceId": "SERVICE_ID",
  "scheduledDate": "2026-09-15T10:00:00.000Z"
}
```

## Step 2 --- Backend finds agent

``` text
MongoDB + Neo4j + MapsService
             ↓
       AssignmentService
             ↓
         Agent B
```

## Step 3 --- Backend creates records

``` text
Package
Booking
Delivery
DeliveryHistory
Notification
```

## Step 4 --- Frontend displays

``` text
Tracking Number: DLV-2026-00123
Agent: Rahul Kumar
Status: AGENT_ASSIGNED
Booking: BK-2026-00123
```

## Step 5 --- Agent updates status

``` http
PUT /api/deliveries/:id/status
```

``` json
{
  "status": "PICKED_UP",
  "remarks": "Package picked up"
}
```

## Step 6 --- Customer tracks

``` http
GET /api/deliveries/:id/tracking
```

## Step 7 --- OTP verification

``` http
POST /api/deliveries/:id/verify-otp
```

## Step 8 --- Completion

Backend updates:

``` text
Delivery → DELIVERED
Package → DELIVERED
Booking → COMPLETED
History → new completion event
Agent → performance counters
Reward/Penalty → calculated
Notification → sent
```

------------------------------------------------------------------------

# 26. Contract Change Procedure

If a future requirement needs a new field or endpoint:

``` text
1. Update PROJECT_REQUIREMENTS.md
        ↓
2. Update DATABASE_SCHEMA.md if data changes
        ↓
3. Update API_CONTRACT.md
        ↓
4. Update UI_SPECIFICATION.md
        ↓
5. Update backend
        ↓
6. Update frontend
        ↓
7. Update tests/seed data
```

Do not let an AI coding tool silently make breaking changes to the
contract.

------------------------------------------------------------------------

# 27. Final Integration Principle

The four project layers must agree:

``` text
PROJECT REQUIREMENTS
        ↓
DATABASE SCHEMA
        ↓
API CONTRACT
        ↓
UI SPECIFICATION
```

For every frontend feature, there must be:

``` text
UI screen
   ↓
Angular model
   ↓
API endpoint
   ↓
Backend service
   ↓
Database operation
```

Example:

``` text
"Cancel Delivery" button
        ↓
PUT /api/bookings/:id/cancel
        ↓
booking.service.ts
        ↓
MongoDB bookings collection
        ↓
deliveryHistory collection
        ↓
notification service
```

This traceability is required to keep the frontend, backend, and
databases synchronized.
