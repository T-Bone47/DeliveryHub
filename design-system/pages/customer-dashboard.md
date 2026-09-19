# Page Specification: Customer Dashboard (`customer-dashboard.md`)

> **Role:** Customer
> **Route:** `/customer/dashboard`
> **Goal:** High-clarity shipment status center for consumers.

---

## 1. Information Hierarchy & Layout

1. **Header Area:**
   - Greeting: `Welcome back, [Full Name]`
   - Subtitle: `Track active parcels and book shipments.`
   - Primary CTA: `[ + Create Delivery ]` (Blue button, accessible 44px height)

2. **Active Delivery Spotlight (Hero Card):**
   - If an active package exists (`IN_TRANSIT`, `OUT_FOR_DELIVERY`, `PICKED_UP`, `AGENT_ASSIGNED`):
     - Large tracking identifier with copy badge: `DLV-1024`
     - Status Badge: `● Out for Delivery`
     - Route details: `[Pickup City] → [Destination City]`
     - Courier information: Assigned agent name, rating (e.g. `4.8 ★`), vehicle type
     - Estimated delivery time / scheduled date
     - Direct CTA: `[ Track Delivery → ]`
   - If no active delivery:
     - Calm reassurance card: `All shipments delivered. Ready to send another package?`

3. **Quick Action Grid:**
   - `[ + New Shipment ]`
   - `[ My Deliveries ]`
   - `[ Help / Support ]`

4. **Recent Deliveries Table / Mobile Cards:**
   - Compact table showing: Tracking Number, Type, Destination, Scheduled Date, Status Badge, and Detail Link.
   - On screens `<768px`, renders as tap-friendly cards.

5. **Anti-Patterns Strictly Avoided:**
   - ❌ No overwhelming admin KPI statistics (e.g., total system users, fleet maintenance metrics).
   - ❌ No empty blank areas while fetching data (use skeleton loader or clear loading spinner).
