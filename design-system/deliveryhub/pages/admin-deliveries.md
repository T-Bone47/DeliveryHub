# Page Specification: Admin Deliveries Management (`admin-deliveries.md`)

> **Role:** Operations Administrator
> **Route:** `/admin/deliveries`
> **Goal:** Comprehensive management, inspection, filtering, and assignment retrying of all shipments.

---

## 1. Information Hierarchy & Layout

1. **Page Header:**
   - Title: `Shipment Manifest`
   - Subtitle: `Search, filter, and manage all customer delivery requests.`

2. **Control & Filter Bar:**
   - Status Dropdown Filter (`All`, `Pending`, `Assigned`, `In Transit`, `Delivered`, `Failed`)
   - Quick search input for tracking ID and recipient

3. **Data Table:**
   - Columns: `Tracking #` (Monospace), `Type`, `Scheduled Date`, `Status Badge`, `Assigned Agent`, `Actions`.
   - On-demand `[ Retry Assignment ]` button for unassigned packages with inline spinner.
   - Clean hover states and pagination controls.
   - Mobile: Transforms into card list view.
