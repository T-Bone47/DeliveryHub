# Page Specification: Admin Operations Dashboard (`admin-dashboard.md`)

> **Role:** Operations Administrator
> **Route:** `/admin/dashboard`
> **Goal:** High-density, real-time command center for system-wide logistics operations.

---

## 1. Information Hierarchy & Layout

1. **Header:**
   - Title: `Operations Console`
   - Subtitle: `Real-time fleet telemetry, package throughput, and system health.`
   - Quick Refresh Button

2. **Core Operational KPIs (Top Grid):**
   - `Total Packages Handled`
   - `Active in Transit`
   - `Pending Courier Assignment`
   - `Fleet Status` (Available couriers / total)
   - `Active Exceptions` (Highlighted in amber if > 0)

3. **Delivery Status Distribution Visualization:**
   - Multi-segment progress distribution bar displaying the proportion of packages across `Delivered`, `In Transit`, `Pending`, and `Failed`.
   - Accessible text legend with exact counts and percentages.

4. **Active Exceptions Queue (Action Priority):**
   - Prominent alert section when delivery exceptions exist.
   - Shows tracking ID, customer name, courier remarks, attempt timestamp, and immediate `[ View & Resolve ]` button.

5. **Recent Deliveries Log:**
   - Dense operational table with search, status filters, courier assignment badges, and deep links.
