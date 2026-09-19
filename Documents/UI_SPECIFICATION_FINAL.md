# Delivery Agent System --- UI/UX Specification

**Frontend:** Angular + TypeScript\
**Design goal:** Professional logistics/delivery management application\
**Primary users:** Customer, Delivery Agent, Administrator

> This document is the UI contract. Every screen, field, action, status,
> and displayed data must map to the entities and API endpoints defined
> in `DATABASE_SCHEMA.md` and `API_CONTRACT.md`.

------------------------------------------------------------------------

# 1. UI/UX Goals

The application should look and behave like a modern logistics platform
rather than a basic college CRUD application.

Design priorities:

-   clean and professional
-   responsive on desktop and tablet
-   clear navigation
-   strong visual hierarchy
-   consistent status indicators
-   useful dashboards
-   accessible forms
-   clear loading and error states
-   minimal unnecessary decoration
-   consistent terminology across all roles

The interface should use the product name:

**DeliveryHub**

This is only the UI/product name. It does not change backend entity
names.

------------------------------------------------------------------------

# 2. User Roles

The frontend supports:

``` text
CUSTOMER
AGENT
ADMIN
```

After login, the application redirects users according to role.

``` text
CUSTOMER → /customer/dashboard
AGENT    → /agent/dashboard
ADMIN    → /admin/dashboard
```

The backend remains responsible for authorization. Frontend route guards
are for user experience and early protection, not the final security
boundary.

------------------------------------------------------------------------

# 3. Global Layout

Authenticated pages use:

``` text
┌─────────────────────────────────────────────────────────┐
│ Logo / DeliveryHub             Notifications  User Menu │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│ Sidebar       │              Main Content               │
│               │                                         │
│ Dashboard     │                                         │
│ Deliveries    │                                         │
│ History       │                                         │
│ Profile       │                                         │
│               │                                         │
│               │                                         │
└───────────────┴─────────────────────────────────────────┘
```

On smaller screens:

-   sidebar becomes collapsible
-   tables become horizontally scrollable or card-based
-   forms stack vertically
-   dashboard cards adapt to screen width

------------------------------------------------------------------------

# 4. Global UI Components

Create reusable components for:

``` text
AppShell
Sidebar
Topbar
UserMenu
NotificationBell
StatCard
StatusBadge
DataTable
SearchBar
FilterBar
Pagination
Modal
ConfirmationDialog
Toast
LoadingSpinner
EmptyState
ErrorState
LocationCard
AgentCard
DeliveryTimeline
MapContainer
FormField
DatePicker
```

These should be shared instead of recreated independently for every
page.

------------------------------------------------------------------------

# 5. Authentication Screens

## 5.1 Login

Route:

``` text
/login
```

Fields:

``` text
Email
Password
```

Actions:

``` text
[ Login ]
[ Create Account ]
```

Optional:

``` text
Forgot Password
```

API:

``` text
POST /api/auth/login
```

Success:

``` text
Store authentication state
Redirect according to role
```

Error examples:

``` text
Invalid email or password
Account is inactive
```

------------------------------------------------------------------------

# 6. Customer UI

## 6.1 Customer Dashboard

Route:

``` text
/customer/dashboard
```

API:

``` text
GET /api/packages/my
GET /api/notifications
```

Display:

### Summary cards

``` text
Active Deliveries
Completed
Pending
Total Deliveries
```

### Recent deliveries

Columns/cards:

``` text
Tracking Number
Destination
Service
Agent
Status
Scheduled Date
Action
```

Action:

``` text
[ Track ]
```

### Quick action

``` text
[ + Create Delivery ]
```

------------------------------------------------------------------------

# 7. Customer --- Create Delivery

Route:

``` text
/customer/create-delivery
```

API:

``` text
GET /api/services
POST /api/packages
```

Form:

``` text
Package Type
Description
Weight

Source Address
Source City
Source State
Source Postal Code
Source Latitude
Source Longitude

Destination Address
Destination City
Destination State
Destination Postal Code
Destination Latitude
Destination Longitude

Delivery Service
Scheduled Date
```

Allowed package types:

``` text
DOCUMENT
PARCEL
ELECTRONICS
CLOTHING
FOOD
OTHER
```

Service options come from:

``` text
GET /api/services
```

Do not hard-code service IDs in the UI.

Actions:

``` text
[ Calculate Route ] (optional)
[ Create Delivery ]
[ Cancel ]
```

After successful creation, show:

``` text
Delivery Created Successfully

Tracking Number: DLV-2026-00123
Booking Number: BK-2026-00123
Assigned Agent: Rahul Kumar
Status: AGENT_ASSIGNED
Estimated Distance: 3.2 km
Estimated Time: 12 min

[ View Delivery ]
```

If no agent is available:

``` text
Delivery request created.

Status: PENDING

No suitable agent is currently available.
The administrator can retry assignment later.
```

------------------------------------------------------------------------

# 8. Customer --- My Deliveries

Route:

``` text
/customer/deliveries
```

API:

``` text
GET /api/packages/my
```

Filters:

``` text
Status
Date
Service
```

Search:

``` text
Tracking Number
```

Display:

``` text
Tracking Number
Destination
Service
Assigned Agent
Scheduled Date
Status
Actions
```

Actions:

``` text
[ View ]
[ Track ]
```

For eligible bookings:

``` text
[ Cancel ]
[ Reschedule ]
```

------------------------------------------------------------------------

# 9. Customer --- Delivery Details

Route:

``` text
/customer/deliveries/:id
```

API:

``` text
GET /api/packages/:id
GET /api/packages/:id/assignment
GET /api/deliveries/:id
```

Display:

### Package information

``` text
Tracking Number
Package Type
Description
Weight
Service
Scheduled Date
```

### Locations

``` text
From
To
```

### Agent

``` text
Agent Name
Agent Code
Rating
Vehicle Type
Phone
```

### Booking

``` text
Booking Number
Confirmation Code
Booking Status
Booking Date
```

Actions:

``` text
[ Track Delivery ]
[ Cancel Booking ]
[ Reschedule ]
```

Only display actions when the backend/API indicates they are permitted.

------------------------------------------------------------------------

# 10. Customer --- Tracking

Route:

``` text
/customer/deliveries/:id/track
```

API:

``` text
GET /api/deliveries/:id/tracking
```

Main display:

``` text
Tracking Number: DLV-2026-00123
Current Status: IN_TRANSIT
```

### Timeline

``` text
✓ Request Received
✓ Agent Assigned
✓ Package Picked Up
● In Transit
○ Out for Delivery
○ Delivered
```

Each timeline event displays:

``` text
Status
Remarks
Timestamp
```

### Agent card

``` text
Rahul Kumar
⭐ 4.7
Agent Code: AGT001
Vehicle: BIKE
```

### Map

If maps integration is enabled:

``` text
Source ─────────────── Destination
              🚚
```

Display:

``` text
Distance
Estimated delivery time
```

If the maps API is unavailable, tracking must still work without the
map.

------------------------------------------------------------------------

# 11. Customer --- Cancel Booking

Use a confirmation modal.

``` text
Cancel Delivery?

Are you sure you want to cancel this booking?

Reason:
[____________________________]

[ Confirm Cancellation ] [ Keep Booking ]
```

API:

``` text
PUT /api/bookings/:id/cancel
```

Success:

``` text
Booking cancelled successfully.
```

------------------------------------------------------------------------

# 12. Customer --- Reschedule

Route:

``` text
/customer/deliveries/:id/reschedule
```

Field:

``` text
New Scheduled Date/Time
```

API:

``` text
PUT /api/bookings/:id/reschedule
```

Request:

``` json
{
  "scheduledDate": "2026-09-17T10:00:00.000Z"
}
```

Success:

``` text
Booking rescheduled successfully.
```

Display updated date immediately after successful API response.

------------------------------------------------------------------------

# 13. Customer --- Delivery Verification

The customer receives an OTP through the backend notification system.

The customer does not normally need to enter the OTP.

Optional UI:

``` text
Delivery Verification

A verification OTP has been sent to your registered contact.

OTP expires at: 06:00 PM
```

The agent enters the OTP.

------------------------------------------------------------------------

# 14. Customer --- History

Route:

``` text
/customer/history
```

API:

``` text
GET /api/packages/my?status=DELIVERED
```

Use `GET /api/history/package/:packageId` when the customer opens a
completed delivery to view its detailed event timeline.

Display previous completed deliveries.

Useful columns:

``` text
Tracking Number
Service
Agent
Completed Date
Final Status
```

------------------------------------------------------------------------

# 15. Agent UI

## 15.1 Agent Dashboard

Route:

``` text
/agent/dashboard
```

API:

``` text
GET /api/agents/:id/performance
GET /api/bookings/agent
GET /api/notifications
```

Summary:

``` text
Active Deliveries
Completed Deliveries
On-Time Rate
Rating
Reward Points
Penalty Points
```

### Current assignments

``` text
Tracking Number
Destination
Scheduled Date
Status
Action
```

Action:

``` text
[ View Delivery ]
```

### Availability

Display:

``` text
Current Status: AVAILABLE
```

Action:

``` text
[ Change Status ]
```

------------------------------------------------------------------------

# 16. Agent --- Assigned Deliveries

Route:

``` text
/agent/deliveries
```

API:

``` text
GET /api/bookings/agent
```

Filters:

``` text
Status
Date
```

Display:

``` text
Tracking Number
Customer
Destination
Service
Scheduled Date
Status
```

Action:

``` text
[ View ]
```

------------------------------------------------------------------------

# 17. Agent --- Delivery Details

Route:

``` text
/agent/deliveries/:id
```

API:

``` text
GET /api/deliveries/:id
GET /api/packages/:id
```

Display:

``` text
Tracking Number
Customer
Customer Phone
Package Type
Description
Weight

Pickup Location
Destination Location

Service
Scheduled Date
Current Status
```

Actions depend on current status.

Example:

``` text
AGENT_ASSIGNED
        ↓
[ Confirm Pickup ]

PICKED_UP
        ↓
[ Start Transit ]

IN_TRANSIT
        ↓
[ Out for Delivery ]

OUT_FOR_DELIVERY
        ↓
[ Complete Delivery ]
```

Status changes use:

``` text
PUT /api/deliveries/:id/status
```

------------------------------------------------------------------------

# 18. Agent --- OTP Completion

When the delivery is `OUT_FOR_DELIVERY`:

``` text
Complete Delivery

Enter customer OTP:

[ _ _ _ _ _ _ ]

[ Verify & Complete ]
```

API:

``` text
POST /api/deliveries/:id/verify-otp
```

Success:

``` text
OTP verified.

Delivery completed successfully.
```

Error:

``` text
Invalid OTP
```

or:

``` text
OTP has expired
```

------------------------------------------------------------------------

# 19. Agent --- Performance

Route:

``` text
/agent/performance
```

API:

``` text
GET /api/agents/:id/performance
GET /api/rewards/agent/:agentId
```

Display:

``` text
Completed Deliveries
On-Time Deliveries
Delayed Deliveries
On-Time Rate
Average Rating
Reward Points
Penalty Points
```

Charts may include:

``` text
Deliveries by Status
On-Time vs Delayed
Rewards vs Penalties
```

------------------------------------------------------------------------

# 20. Agent --- History

Route:

``` text
/agent/history
```

API:

``` text
GET /api/history/agent/:agentId
```

Display:

``` text
Tracking Number
Destination
Service
Status
Completed Date
```

------------------------------------------------------------------------

# 21. Admin UI

## 21.1 Admin Dashboard

Route:

``` text
/admin/dashboard
```

API:

``` text
GET /api/admin/dashboard
```

Main statistics:

``` text
Total Deliveries
Active Deliveries
Delivered
Pending
Delayed
Total Agents
Available Agents
```

### Visual analytics

Recommended charts:

``` text
Delivery Status Distribution
Deliveries Over Time
Agent Performance
Pending vs Completed
```

### Recent assignments

``` text
Tracking Number
Agent
Destination
Status
Assigned Time
```

------------------------------------------------------------------------

# 22. Admin --- Agents

Route:

``` text
/admin/agents
```

API:

``` text
GET /api/agents
POST /api/agents
PUT /api/agents/:id
PUT /api/agents/:id/status
```

Display:

``` text
Agent Code
Name
Phone
Vehicle
Status
Rating
Active Deliveries
Completed Deliveries
On-Time Rate
Actions
```

Actions:

``` text
[ View ]
[ Edit ]
[ Activate/Deactivate ]
```

Add agent form:

``` text
Full Name
Email
Phone
Password
Agent Code
Vehicle Type
Status
```

------------------------------------------------------------------------

# 23. Admin --- Agent Details

Route:

``` text
/admin/agents/:id
```

API:

``` text
GET /api/agents/:id
GET /api/agents/:id/performance
GET /api/history/agent/:id
GET /api/rewards/agent/:agentId
```

Sections:

``` text
Profile
Current Status
Performance
Delivery History
Rewards
Penalties
```

------------------------------------------------------------------------

# 24. Admin --- Packages

Route:

``` text
/admin/packages
```

API:

``` text
GET /api/packages
```

Filters:

``` text
Tracking Number
Status
Customer
Agent
Service
Date
```

Display:

``` text
Tracking Number
Customer
Agent
Source
Destination
Service
Status
Scheduled Date
```

Action:

``` text
[ View ]
```

------------------------------------------------------------------------

# 25. Admin --- Bookings

Route:

``` text
/admin/bookings
```

API:

``` text
GET /api/bookings
```

Display:

``` text
Booking Number
Tracking Number
Customer
Agent
Booking Date
Scheduled Date
Status
```

Actions:

``` text
[ View ]
```

------------------------------------------------------------------------

# 26. Admin --- Delivery Management

Route:

``` text
/admin/deliveries
```

API:

``` text
GET /api/deliveries
GET /api/deliveries/:id
```

Use `GET /api/deliveries` for the admin operational list and
`GET /api/deliveries/:id` for an individual delivery view.

Display:

``` text
Tracking Number
Agent
Current Status
Source
Destination
Scheduled Time
ETA
```

------------------------------------------------------------------------

# 27. Admin --- Assignment Management

Route:

``` text
/admin/assignments
```

This is an operational enhancement.

Display:

``` text
Pending Unassigned Packages
Recently Assigned Packages
Agent Availability
```

For a pending package:

``` text
Tracking Number
Source
Destination
Service
Created Time

[ Retry Automatic Assignment ]
```

API:

``` text
POST /api/packages/:id/assign
```

The backend performs the actual assignment.

The admin UI must not choose an agent manually unless a separate manual
override feature is intentionally added later.

------------------------------------------------------------------------

# 28. Admin --- Rewards and Penalties

Route:

``` text
/admin/rewards
```

API:

``` text
GET /api/rewards/agent/:agentId
POST /api/rewards/agent/:agentId/reward
POST /api/rewards/agent/:agentId/penalty
```

Reward form:

``` text
Agent
Reason
Points
Related Package (optional)
```

Submit the form to:

``` text
POST /api/rewards/agent/:agentId/reward
```

Penalty form:

``` text
Agent
Reason
Points
Related Package (optional)
```

Submit the form to:

``` text
POST /api/rewards/agent/:agentId/penalty
```

The UI must not send a `type` field because the API determines whether
the record is a `REWARD` or `PENALTY` from the endpoint path.

Actions:

``` text
[ Add Reward ]
[ Add Penalty ]
```

------------------------------------------------------------------------

# 29. Admin --- Services

Route:

``` text
/admin/services
```

API:

``` text
GET /api/services
POST /api/services
PUT /api/services/:id
PUT /api/services/:id/status
```

Display:

``` text
Service Code
Name
Description
Base Price
Status
```

Example:

``` text
EXPRESS
Express Delivery
Fast delivery service
₹150
ACTIVE
```

------------------------------------------------------------------------

# 30. Admin --- Locations

Route:

``` text
/admin/locations
```

API:

``` text
GET /api/locations
POST /api/locations
PUT /api/locations/:id
```

Display:

``` text
Location
City
State
Postal Code
Coordinates
Status
```

------------------------------------------------------------------------

# 31. Admin --- History

Route:

``` text
/admin/history
```

API:

``` text
GET /api/history
```

Display searchable historical delivery records.

Filters:

``` text
Agent
Customer
Status
Date Range
Service
```

------------------------------------------------------------------------

# 32. Notifications UI

Notification bell appears in the authenticated topbar.

API:

``` text
GET /api/notifications
PUT /api/notifications/:id/read
```

Dropdown:

``` text
Notifications

✓ Delivery DLV-00123 assigned to Rahul
✓ Delivery DLV-00124 delivered
! Delivery DLV-00125 rescheduled

[ View All ]
```

Unread notifications should have a visible indicator.

------------------------------------------------------------------------

# 33. UI Status Colors

Use consistent visual semantics throughout the application.

``` text
PENDING          → neutral/warning
AGENT_ASSIGNED   → informational
PICKED_UP        → informational
IN_TRANSIT       → informational
OUT_FOR_DELIVERY → highlighted
DELIVERED        → success
CANCELLED        → error
RESCHEDULED      → warning
FAILED           → error
```

Do not use different meanings for the same status on different pages.

------------------------------------------------------------------------

# 34. Form Validation

Every form must provide:

-   required-field validation
-   correct email validation
-   phone validation
-   positive weight validation
-   valid date validation
-   clear inline error messages
-   disabled submit state while submitting
-   loading indicator
-   server-error display

Example:

``` text
Weight
[ -2 ]

Weight must be greater than 0.
```

Frontend validation improves UX, but backend validation remains
mandatory.

------------------------------------------------------------------------

# 35. Loading States

Never show an empty page while an API request is running.

Use:

``` text
Skeleton loaders
Spinner
Loading text
Disabled action buttons
```

Example:

``` text
Loading deliveries...
```

------------------------------------------------------------------------

# 36. Empty States

Examples:

### No deliveries

``` text
No deliveries found.

Create your first delivery to get started.

[ + Create Delivery ]
```

### No assigned deliveries

``` text
No deliveries are currently assigned to you.
```

### No notifications

``` text
You're all caught up.
```

------------------------------------------------------------------------

# 37. Error States

API errors should be displayed clearly.

Example:

``` text
Unable to create delivery.

Destination location is required.

[ Try Again ]
```

For external API failures:

``` text
Route information is temporarily unavailable.

Your delivery can still be created.
```

The UI must not expose internal stack traces or database errors.

------------------------------------------------------------------------

# 38. Responsive Design

Desktop:

``` text
Sidebar + content
```

Tablet:

``` text
Collapsible sidebar
```

Mobile:

``` text
Top navigation
Stacked cards
Scrollable tables
Full-width forms
```

All essential functionality should remain usable on smaller screens.

------------------------------------------------------------------------

# 39. UI Data Model Mapping

The frontend must use the exact API/database field names.

Examples:

``` text
API field              UI display

fullName               Full Name
agentCode              Agent Code
trackingNumber         Tracking Number
assignedAgentId        Assigned Agent
scheduledDate          Scheduled Date
currentStatus          Current Status
activeDeliveries       Active Deliveries
completedDeliveries    Completed Deliveries
rewardPoints           Reward Points
penaltyPoints          Penalty Points
```

A UI label may be human-friendly, but the Angular model/property must
follow the API contract.

Example:

``` typescript
agent.assignedAgentId
```

not:

``` typescript
agent.deliveryPartnerId
```

------------------------------------------------------------------------

# 40. API-to-Screen Mapping

  -----------------------------------------------------------------------
  Screen                       Primary API
  ---------------------------- ------------------------------------------
  Login                        `POST /api/auth/login`

  Customer Dashboard           `GET /api/packages/my`

  Create Delivery              `GET /api/services`, `POST /api/packages`

  My Deliveries                `GET /api/packages/my`

  Customer Delivery Details    `GET /api/packages/:id`

  Customer Tracking            `GET /api/deliveries/:id/tracking`

  Cancel                       `PUT /api/bookings/:id/cancel`

  Reschedule                   `PUT /api/bookings/:id/reschedule`

  Agent Dashboard              `GET /api/agents/:id/performance`,
                               `GET /api/bookings/agent`

  Agent Deliveries             `GET /api/bookings/agent`

  Agent Delivery Details       `GET /api/deliveries/:id`

  Update Status                `PUT /api/deliveries/:id/status`

  Verify OTP                   `POST /api/deliveries/:id/verify-otp`

  Agent Performance            `GET /api/agents/:id/performance`

  Agent History                `GET /api/history/agent/:agentId`

  Customer History             `GET /api/packages/my?status=DELIVERED`,
                               `GET /api/history/package/:packageId`

  Admin Dashboard              `GET /api/admin/dashboard`

  Admin Agents                 `GET /api/agents`

  Admin Packages               `GET /api/packages`

  Admin Bookings               `GET /api/bookings`

  Admin Deliveries             `GET /api/deliveries`

  Admin Services               `GET /api/services`

  Admin Locations              `GET /api/locations`

  Admin Rewards                `GET /api/rewards/agent/:agentId`

  Admin History                `GET /api/history`
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 41. Navigation

## Customer

``` text
Dashboard
Create Delivery
My Deliveries
History
Notifications
Profile
Logout
```

## Agent

``` text
Dashboard
My Deliveries
Performance
History
Notifications
Profile
Logout
```

## Admin

``` text
Dashboard
Agents
Packages
Bookings
Deliveries
Assignments
Services
Locations
Rewards & Penalties
History
Notifications
Logout
```

------------------------------------------------------------------------

# 42. Design System

The UI should use a consistent design system.

Define:

``` text
Primary color
Secondary color
Background
Surface
Text
Muted text
Success
Warning
Error
Border
```

Use a modern logistics/dashboard visual language:

-   rounded cards
-   subtle shadows
-   clean typography
-   clear icons
-   consistent spacing
-   restrained animations
-   strong status badges
-   accessible contrast

Do not use excessive gradients, animations, or decorative elements that
reduce usability.

------------------------------------------------------------------------

# 43. Recommended Dashboard Visualizations

Admin:

``` text
Delivery Status Donut/Pie
Deliveries Over Time
Agent Performance Bar Chart
Active vs Completed
```

Agent:

``` text
Completion Rate
On-Time Rate
Reward vs Penalty
```

Customer:

``` text
Active Delivery Timeline
Recent Deliveries
```

Charts should use real API data.

Never hard-code chart values in the final application.

------------------------------------------------------------------------

# 44. Maps UI

When maps integration is enabled, show:

``` text
Source Marker
Destination Marker
Agent Marker (if available)
Route
Distance
ETA
```

The map should be reusable as:

``` text
<app-map-container>
```

If the Maps API is unavailable, the rest of the delivery page must
continue to function.

------------------------------------------------------------------------

# 45. Accessibility

The frontend should include:

-   keyboard-accessible buttons
-   labels for form fields
-   meaningful error messages
-   accessible modal behavior
-   sufficient color contrast
-   icons with labels/tooltips where necessary
-   no information conveyed by color alone

------------------------------------------------------------------------

# 46. Security Rules for Frontend

Never place these in Angular source code:

``` text
MongoDB password
Neo4j password
JWT secret
Private email API key
Private maps API secret
AI provider secret key
```

The frontend only receives data that the backend intentionally exposes.

The JWT should be handled through a dedicated authentication mechanism
and HTTP interceptor.

------------------------------------------------------------------------

# 47. Frontend Architecture Rules

1.  Components handle presentation and user interaction.
2.  Angular services handle API communication.
3.  Models/interfaces represent API data.
4.  Route guards handle navigation restrictions.
5.  HTTP interceptors attach authentication credentials.
6.  Components must not directly access MongoDB or Neo4j.
7.  Components must not contain automatic agent-assignment logic.
8.  Components must not calculate reward/penalty rules.
9.  Components must not verify OTPs locally.
10. Shared UI components should be reused.
11. API field names must match `API_CONTRACT.md`.
12. Status values must match `API_CONTRACT.md`.
13. Forms must match backend request schemas.
14. User-facing labels may differ from technical field names.

------------------------------------------------------------------------

# 48. Recommended UI Build Order

Build the frontend in this order:

``` text
1. Design system
       ↓
2. App shell + navigation
       ↓
3. Authentication
       ↓
4. Customer dashboard
       ↓
5. Create delivery
       ↓
6. Delivery list/details
       ↓
7. Tracking
       ↓
8. Agent dashboard
       ↓
9. Agent delivery workflow
       ↓
10. OTP completion
       ↓
11. Agent performance
       ↓
12. Admin dashboard
       ↓
13. Agent management
       ↓
14. Package/booking management
       ↓
15. Services/locations
       ↓
16. Rewards/penalties
       ↓
17. History
       ↓
18. Notifications
       ↓
19. Maps
       ↓
20. Responsive polish
```

------------------------------------------------------------------------

# 49. Final UI Goal

The final user journey should look like a real delivery platform:

``` text
CUSTOMER

Login
  ↓
Dashboard
  ↓
Create Delivery
  ↓
Enter shipping details
  ↓
System automatically assigns agent
  ↓
Booking confirmation
  ↓
Track delivery
  ↓
Agent delivers
  ↓
OTP verification
  ↓
Delivery completed
  ↓
History
```

Agent:

``` text
Login
  ↓
Dashboard
  ↓
Automatically assigned delivery
  ↓
View package
  ↓
Confirm pickup
  ↓
In transit
  ↓
Out for delivery
  ↓
Enter OTP
  ↓
Delivered
  ↓
Performance updated
```

Admin:

``` text
Login
  ↓
Dashboard
  ↓
Monitor deliveries
  ↓
Manage agents/services/locations
  ↓
Retry assignment for pending deliveries
  ↓
Monitor performance
  ↓
Manage rewards/penalties
  ↓
View historical records
```

------------------------------------------------------------------------

# 50. Final UI/Backend Consistency Rule

For every UI action, there must be a corresponding backend operation.

``` text
UI ACTION
    ↓
Angular Component
    ↓
Angular Service
    ↓
API CONTRACT ENDPOINT
    ↓
Backend Controller
    ↓
Backend Service
    ↓
Repository
    ↓
MongoDB / Neo4j / External API
```

Example:

``` text
[Create Delivery]
       ↓
CreateDeliveryComponent
       ↓
PackageService.createPackage()
       ↓
POST /api/packages
       ↓
package.controller.ts
       ↓
package.service.ts
       ↓
assignment.service.ts
       ↓
MongoDB + Neo4j + MapsService
       ↓
Package + Booking + Delivery + History
       ↓
Angular displays confirmation
```

This traceability is mandatory for the implementation.

------------------------------------------------------------------------

# 51. AI Implementation Instruction

Any AI coding tool working on the frontend must first read:

``` text
PROJECT_REQUIREMENTS.md
ARCHITECTURE.md
DATABASE_SCHEMA.md
API_CONTRACT.md
UI_SPECIFICATION.md
```

The AI must:

-   use the existing contracts
-   not invent fields
-   not invent API endpoints
-   not invent roles
-   not invent statuses
-   not replace API fields with different names
-   not hard-code backend data
-   not create fake API responses in the final implementation
-   ask for clarification or update the specification when a new
    requirement conflicts with the existing contract

The generated Angular application must be runnable locally through VS
Code and must be designed to consume the backend defined in
`API_CONTRACT.md`.
