# EcoFlow AI — Project Summary

## What this project is about

**EcoFlow AI** is an operations platform for **large event venues** (e.g. **Qiddiya**-style sites in Saudi Vision 2030). It has two sides:

- **Admin dashboard (web)** — For organization staff to monitor crowds, handle alerts, manage zones and settings, and notify visitors.
- **Visitor app (mobile)** — Planned; for guests to receive push notifications (e.g. congestion warnings) and use venue info.

The product focuses on **real-time crowd density**, **sustainability** (energy/carbon), **alerts**, and **AI-driven predictions** (e.g. congestion in the next ~10 minutes). The current codebase is a **Next.js** web app with the admin dashboard implemented and data currently mocked; the mobile app and backend are planned next.

---

## What’s in the app today

### Public / auth flows

- **Home (`/`)** — Simple landing with a Qiddiya City image.
- **Login (`/login`)** — EcoFlow AI branding, email/password (or step) login, link to Sign up. Tagline: event-driven data and AI predictions for your venue.
- **Sign up (`/signup`)** — Organization onboarding: multi-step **SetupForm** (organization name, venue type, location lat/lng, total capacity, zones, IoT source, refresh rate, HVAC control, baseline kWh, energy source). On submit, data is saved to `localStorage` and user is redirected to the dashboard.

### Admin dashboard (`/dashboard`)

Single-page dashboard with a **sidebar** and **main content**. Data is currently **mock** (e.g. `ZONE_GRID`, `MOCK_ALERT_POOL`); backend integration is planned.

#### Navigation

- **Dashboard** (home view)
- **Alerts Center**
- **Analytics**
- **Zone Configuration**
- **Settings**

#### 1. Dashboard (home view)

- **KPIs (4 cards):**
  - Total Visitors (e.g. 12,450, +12%)
  - Avg Density (e.g. 0.8 p/m², +5%)
  - Carbon Emission (e.g. 450 kg, −8% vs baseline)
  - Active Alerts (count + critical count, live indicator)
- **Real-time Zone Heatmap:** Google Map with density heatmap by zone; filter chips (All / Critical / Warning / Normal); layer toggles (Density, Alerts, Routes); fullscreen; search applies to zones.
- **Zone list:** Zones with name, density, status (Critical / Warning / Normal); click opens a side panel with zone details (name, density, status). Map and list use shared mock zones (e.g. Main Plaza, North Gate, Food Court, East Wing, Concert Hall, VIP Lounge).

#### 2. Alerts Center

- **Filters:** Severity (Critical / High / Medium / Low), Status (Active / Resolved / Acknowledged), Date. Apply / Clear.
- **Table:** Alerts with Severity, Alert Type, Location, Time Stamp, Status; **Ack** and **Resolve** for active alerts.
- **Pagination:** 10 alerts per page.
- **Detail overlay:** Clicking a row opens full alert (title, description, location, time, severity, status) with Ack and Resolve.
- **Resolve = notify visitors + mark resolved:**  
  When the admin clicks **Resolve**, the app (1) sends a “push” payload for visitors: *“Predicted congestion in [zone] in the next ~10 minutes. Consider an alternate route.”* (currently stubbed: `console.info` / optional `window.__ecoflowNotify`; to be replaced by backend API), (2) marks the alert as **Resolved** in the UI. So the Resolve button is the single action that both notifies visitors and resolves the alert.

#### 3. Analytics

- **Crowd Density Trends:** Area chart (mock time-series by hour).
- **Energy Consumption vs Carbon:** Dual line chart with legend (mock).
- **Active Routes table:** Rows with Time Stamp, Type, Zone, Deviation, Status; click opens detail overlay. Mock data (e.g. Power Surge, Crowd Bottleneck, Resolved / Auto-rerouted / Acknowledged).

#### 4. Zone Configuration

- **Venue location & capacity:** Latitude, Longitude, Total capacity — all editable.
- **Zones:** List of zones; each has Name, Type (Indoor/Outdoor), Max capacity. Add zone, remove zone (min one), edit any field.
- **Save:** Persists to dashboard state and `localStorage` (key: `ecoflow-admin-settings`). Same data source as Settings and signup.

#### 5. Settings

- **Organization:** Organization name, Venue type (Stadium, Hotel, Airport, Mall, Outdoor Park).
- **Data & sensors:** IoT data source, Data refresh rate, HVAC control.
- **Sustainability baseline:** Baseline energy (kWh), Energy source (Grid, Solar, Hybrid).
- **Save:** Persists to dashboard state and `localStorage` (same key as Zone Configuration). All fields displayed and editable.

Admin settings (from signup or dashboard) are loaded from `localStorage` on dashboard mount; if missing, demo data (e.g. Qiddiya Main Hub) is used.

---

## Tech stack (current)

- **Next.js** (App Router), **React**, **TypeScript**
- **Framer Motion** for animations
- **Google Maps JavaScript API** for zone/heatmap maps (optional; `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- **Tailwind CSS** for styling
- **localStorage** for admin settings and signup payload (no backend yet)

---

## What’s next

### Backend

- Auth (login/signup, sessions).
- Persist organization, venue, zones, and settings (replace localStorage).
- Real-time density by zone (from IoT/AI pipelines).
- Alert stream with Ack/Resolve and **notify-visitors** API: when admin clicks Resolve, backend sends push to visitors’ devices (FCM/APNs, etc.).
- Energy/carbon metrics and time-series for Analytics.
- APIs for analytics (density trends, energy/carbon, active routes).

### AI

- Crowd density from CCTV/computer vision (e.g. Vertex AI).
- Predictions (e.g. “congestion in zone X in ~10 minutes”) feeding alerts and the Resolve → push flow.
- Optional: eco-routing suggestions when density is high.

### Mobile app (visitor-facing)

- **Push notifications:** Receive congestion alerts sent when admin taps Resolve (e.g. “Predicted congestion in [zone] in the next ~10 minutes. Consider an alternate route.”).
- **Venue/zone info:** View zones, optional map, and real-time or predicted crowding.
- **Optional:** Eco-routes, wayfinding, or preferences (e.g. avoid crowded zones).

---

## One-liner

**EcoFlow AI is a venue operations platform: the admin dashboard (done) monitors real-time zone density, alerts, and analytics, and lets staff configure zones and settings and resolve alerts by notifying visitors via push; next steps are backend, AI pipelines, and a mobile app so visitors get those congestion alerts and can use venue features.**
