# Page Specification: Portal Selection & Authentication (`login.md`)

> **Role:** Public / Unauthenticated Gateway  
> **Routes:** `/`, `/login`, `/customer/login`, `/agent/login`, `/admin/login`, `/customer/register`  
> **Goal:** High-trust, professional entry point communicating one platform with three distinct operational roles.

---

## 1. Information Architecture & Hierarchy

### Core Composition
1. **Authoritative Header Bar:**
   - Left: `[DH]` brand mark + `DeliveryHub` logotype.
   - Right: System status beacon (`● Systems Operational • Network Live`).

2. **Focused Hero Section:**
   - Overline: `ENTERPRISE LOGISTICS SYSTEM`
   - Headline: **One delivery platform. Three operational experiences.**
   - Subtitle: `Select your role to access your dedicated workspace.`

3. **Three Role Gateway Cards (Strictly Purposeful, No Fluff):**
   - **Customer Portal:**
     - Icon: vector SVG `package`
     - Role: `CUSTOMER`
     - Focus: `Track & Manage Deliveries`
     - Summary: Book pickups, track packages en route, and access delivery OTP handover passes.
     - CTA: `Continue as Customer ➔`
     - Register link: `New customer? Create account`
   - **Courier Agent Portal:**
     - Icon: vector SVG `truck`
     - Role: `COURIER AGENT`
     - Focus: `Execute Deliveries & Handover`
     - Summary: Access daily assigned manifests, verify customer OTPs, and capture digital POD photos.
     - CTA: `Continue as Agent ➔`
     - Provisioning note: `Shift manifests provisioned by ops admin`
   - **Operations Console:**
     - Icon: vector SVG `shield`
     - Role: `ADMINISTRATOR`
     - Focus: `Operate & Control Platform`
     - Summary: Algorithmic agent assignment, fleet telemetry, network distribution, and exception triage.
     - CTA: `Continue as Admin ➔`
     - Security note: `Administrative credentials required`

4. **Demonstration & Testing Drawer (Discreet Accordion):**
   - Collapsible panel at the bottom providing pre-configured testing credentials (Admin, Customers, Agents) for faculty and project reviewers.

---

## 2. Visual Rules & Anti-Patterns
- **No excessive cards:** Clean grid of 3 balanced cards with subtle 1px border and hover transition.
- **No AI-slop gradients:** Deep neutral surface (`#FFFFFF`), subtle canvas background (`#F8FAFC`).
- **No emojis:** Vector SVG icons via `<dh-icon>`.
- **Keyboard navigation:** Full Tab indexing and visible focus rings on cards and CTAs.
