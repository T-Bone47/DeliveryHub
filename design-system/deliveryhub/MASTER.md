# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** DeliveryHub
**Generated:** 2026-09-19 00:56:47
**Category:** Logistics/Delivery

---

## Global Rules

### Color Palette & Semantic Roles

| Role | Hex | CSS Variable | Semantic Purpose |
|------|-----|--------------|------------------|
| **Orange (Brand & Action)** | `#FF5200` / `#EA580C` | `--color-primary` | DeliveryHub brand identity, primary CTAs, dispatch, action buttons |
| **Blue (Operations & Telemetry)** | `#2563EB` / `#0284C7` | `--color-secondary` | Tracking, live route status, navigation, info states, telemetry |
| **Green (Success & Handover)** | `#16A34A` / `#059669` | `--color-success` | Delivered status, OTP verified, positive milestones, success toasts |
| **Red (Error & Destruction)** | `#DC2626` / `#E11D48` | `--color-error` | Errors, failed delivery attempts, destructive cancel actions |
| **Amber/Warning (Exceptions)** | `#D97706` / `#EA580C` | `--color-warning` | Delivery exceptions, customer unavailable, attention alerts |
| **Background Surface** | `#F8FAFC` / `#F6F8FB` | `--color-background` | Clean neutral canvas surface, zero slop gradients |
| **Card Surface** | `#FFFFFF` | `--color-surface` | High-clarity white card surface with subtle 1px border |
| **Border / Dividers** | `#E2E8F0` / `#EDF1F7` | `--color-border` | Subtle structural grid separation |

**Reconciled Color Rule:**
- **BLUE** = Operations, Tracking, Live Telemetry, Information states.
- **ORANGE** = DeliveryHub Brand, Primary Actions, Dispatch, Important CTAs.
- **GREEN** = Success, Verified OTP, Delivered Milestones.
- **AMBER / RED** = Attention, Exceptions, Failed Deliveries requiring Reschedule.

### Typography Discipline

- **Operational UI Font:** `Inter` / `Plus Jakarta Sans`
  - High-density operational surfaces: Data tables, forms, input fields, navigation links, status badges, buttons, small labels, and KPI metrics.
  - **Rule:** Do NOT use decorative or serif typography (e.g. Calistoga) in operational tables, buttons, metrics, or forms. Readability and Swiss grid clarity take precedence.
- **Display Font:** `Outfit` / `Inter` (Bold, clean geometric sans) for primary section headings.
- **Monospace Font:** `JetBrains Mono` for tracking codes (`DLV-1024`), OTP codes, timestamps, and coordinates.

**CSS Font Variables:**
```scss
--font-sans: 'Inter', 'Plus Jakarta Sans', -apple-system, sans-serif;
--font-display: 'Outfit', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #2563EB;
  border: 2px solid #2563EB;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #EFF6FF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #2563EB;
  outline: none;
  box-shadow: 0 0 0 3px #2563EB20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Real-Time / Operations Landing

- **Conversion Strategy:** Offer a demo or sandbox and show trust signals. Label telemetry as live only when backed by a current source, with update time and stale state. Provide pause/hide or update-frequency controls for tickers and previews, stop offscreen/hidden work, support keyboard controls, and render a static final snapshot under reduced motion.
- **CTA Placement:** Primary CTA in nav + After metrics
- **Section Order:** Hero (product + live preview or status) > Key metrics/indicators > How it works > CTA (Start trial / Contact)

---

## Anti-Patterns (Do NOT Use)

- ❌ Static tracking
- ❌ No map integration
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
