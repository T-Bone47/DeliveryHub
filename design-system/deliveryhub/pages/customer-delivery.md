# Page Specification: Customer Delivery Detail (`customer-delivery.md`)

> **Role:** Customer / Courier / Admin (Shared Core View)
> **Route:** `/customer/deliveries/:id` (and `/agent/deliveries/:id`, `/admin/packages/:id`)
> **Goal:** 360-degree real-time shipment transparency and handover verification.

---

## 1. Information Hierarchy & Layout

1. **Header & Context:**
   - Breadcrumb navigation: `← Back to Deliveries`
   - Tracking Header: Tracking number (`DLV-1024`) with status pill and quick refresh button
   - Creation date & booking reference

2. **Delivery State Machine Stepper:**
   - 6-step progression: `Created` → `Agent Assigned` → `Picked Up` → `In Transit` → `Out for Delivery` → `Delivered`
   - Clear icon indicators: completed checkmark (`✓`), active pulse circle (`●`), pending circle (`○`).

3. **Live Tracking & Route Telemetry:**
   - Interactive Leaflet map container with origin pin, destination pin, and courier live position.
   - Fallback state if coordinates are unavailable:
     - Clear card: `Location telemetry offline — Last checkpoint: [City] at [Time]`.

4. **Handover & Proof of Delivery (Feature 1):**
   - When delivered: Verified Digital Proof of Delivery card with official receipt layout, timestamp, delivery agent name, and expandable photo thumbnail.
   - When awaiting pickup/delivery: OTP handover code card with prominent numeric display and countdown timer.

5. **Exception & Rescheduling (Feature 2):**
   - If status is `FAILED`: Alert banner with courier attempt timestamp, failure reason, and self-service datepicker to reschedule.

6. **Courier Assignment Card:**
   - Courier agent name, status badge, rating score, and vehicle type.
   - For admin: Algorithmic assignment score breakdown (distance, workload, rating, on-time percentage).
