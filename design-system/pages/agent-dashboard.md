# Page Specification: Agent Dashboard (`agent-dashboard.md`)

> **Role:** Delivery Courier Agent
> **Route:** `/agent/dashboard`
> **Goal:** High-efficiency mobile-first courier operations console.

---

## 1. Information Hierarchy & Layout

1. **Shift Header:**
   - Greeting: `Good afternoon, [Agent Name]`
   - Operational Subtitle: `Today's Delivery Workload & Manifest`

2. **Shift Metrics Bar:**
   - 4 compact metrics: `Total Assigned`, `Active in Transit`, `Pending Pickup`, `Completed Today`.

3. **Active Delivery Spotlight (Hero Card):**
   - If agent has an in-progress delivery (`OUT_FOR_DELIVERY`, `IN_TRANSIT`, `PICKED_UP`, `AGENT_ASSIGNED`):
     - Large tracking identifier
     - Route badge: `[Origin City] → [Destination City]`
     - Current state badge: `● Out for Delivery`
     - Destination address & customer recipient name
     - One-handed primary action button: `[ Open Delivery Console → ]` (Full width on mobile, 48px height)

4. **Package Quick Lookup:**
   - Direct package ID / tracking number input with immediate enter-to-navigate action.

5. **Assigned Delivery Queue:**
   - List of assigned deliveries prioritized by scheduled time.
   - Mobile: Responsive card items with clear route, scheduled time, and status badge.
   - Desktop: Dense operational table.
