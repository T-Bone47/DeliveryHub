# Page Specification: Agent Delivery Execution (`agent-delivery.md`)

> **Role:** Delivery Courier Agent
> **Route:** `/agent/deliveries/:id`
> **Goal:** Rapid on-site handover, verification, and exception logging with single-hand reachability.

---

## 1. Information Hierarchy & Layout

1. **Delivery Header:**
   - Tracking ID + Status badge
   - Recipient Name & Delivery Address prominently displayed

2. **Next Action Hero Card (Priority Action):**
   - Must make the immediate operational action unmistakable:
     - If `AGENT_ASSIGNED`: `[ Collect Pickup OTP ]`
     - If `PICKED_UP`: `[ Update to In Transit ]`
     - If `IN_TRANSIT`: `[ Start Out for Delivery ]`
     - If `OUT_FOR_DELIVERY`: `[ Verify Delivery OTP ]` (High emphasis)
     - If OTP Verified: `[ Upload Proof of Delivery (Photo) ]` (Camera action)

3. **Secondary Actions (Subordinate):**
   - `[ Report Delivery Exception ]` (Warning styling)
   - `[ Call Recipient / Contact Support ]`

4. **Exception Reporting Modal:**
   - Accessible modal with clear dropdown reasons (`Customer unavailable`, `Wrong address`, etc.)
   - Courier remarks field
   - Explicit `[ Submit Exception ]` button with loading spinner

5. **Proof of Delivery Uploader:**
   - Clear drag-and-drop or camera file selector with immediate image preview.
