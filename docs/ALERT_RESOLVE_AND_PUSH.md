# Alert Resolve & Push Notifications

This doc explains how the **Resolve** button works in the dashboard and how to make push notifications reach the mobile app.

---

## Current behavior (web dashboard)

1. Admin clicks **Resolve** on an alert in Alerts Center.
2. The app calls **PATCH `/proxy/alerts/:id`** (proxied to backend **PATCH `/alerts/:id/`**) with body `{ "status": "CLOSED" }`.
3. On success: the alert is shown as **Resolved** and a success message is shown.
4. On failure: an error is shown and the alert stays **Active**.

So the **Resolve** button is wired to the backend. For push to work, the backend and the mobile app must be set up as below.

---

## Backend requirements

### 1. Resolve/close the alert

The web app sends:

- **Method:** `PATCH`
- **URL:** `https://<BACKEND>/alerts/:id/`
- **Body:** `{ "status": "CLOSED" }`
- **Headers:** `Content-Type: application/json`, and `Authorization: Bearer <token>` when the user is logged in.

The backend should:

- Update the alert with `status: "CLOSED"` (or equivalent).
- Return 200 (and optionally the updated alert JSON).

### 2. Trigger push when alert is resolved

When an alert is closed, the backend should send a push to mobile devices (e.g. visitors in that venue). Two common patterns:

**Option A – Push inside PATCH handler**

- In the same handler that processes `PATCH /alerts/:id/`:
  1. Update alert status to CLOSED.
  2. Look up which devices/topics to notify (e.g. devices subscribed to this org/venue or this alert).
  3. Call FCM / APNs to send the notification.

**Option B – Separate notify endpoint**

- Keep **PATCH /alerts/:id/** only for closing the alert.
- Add **POST /alerts/:id/notify** (or similar) that:
  1. Marks the alert as “notified” if needed.
  2. Sends push via FCM/APNs to the right devices/topics.

The web app currently only calls **PATCH**; if you use Option B, you can either call **POST …/notify** from the backend right after updating the alert, or add a second call from the web app to **POST …/notify** after a successful PATCH.

**Payload to send to mobile (example)**

- **Title:** e.g. `Alert resolved`
- **Body:** e.g. `Congestion in [Zone name] has been resolved.`
- **Data (optional):** `alertId`, `zone`, `status: "CLOSED"` so the app can deep-link or refresh.

---

## Mobile app requirements

### 1. Register for push

- **Android:** Firebase Cloud Messaging (FCM). Get an FCM token and send it to your backend.
- **iOS:** APNs. Get a device token and send it to your backend.

### 2. Send token to backend

When the user opens the app (or logs in), call your backend to register the device, e.g.:

- **POST /users/me/device-token** or **POST /visitors/register-device**
- Body: `{ "token": "<FCM_or_APNs_token>", "platform": "android" | "ios" }`
- Optionally include `organization_id` or `venue_id` so the backend knows which alerts (e.g. which org) this device cares about.

### 3. Subscribe to the right “channel”

- Either the backend stores `(user_id or device_id, org_id, token)` and when an alert for that org is resolved, it sends push to those tokens.
- Or use FCM **topics** (e.g. `org_9`) and have the app subscribe to the topic for the current venue; the backend sends to that topic when an alert in that org is resolved.

### 4. Handle the notification

- When the app receives the push (foreground or background):
  - **Display:** Show a local notification (e.g. “Alert resolved in Zone X”) if the app is in background.
  - **Data:** Read `alertId`, `zone`, `status` from the data payload and e.g. refresh the alert list or open the relevant screen.

---

## Summary

| Layer   | What to do |
|--------|------------|
| **Web** | Already done: Resolve button calls **PATCH /proxy/alerts/:id** (backend **PATCH /alerts/:id/** with `status: "CLOSED"`). |
| **Backend** | Implement **PATCH /alerts/:id/** to set status to CLOSED; in that handler (or a separate notify step), send push via FCM/APNs to devices/topics for that venue/org. |
| **Mobile** | Register for FCM/APNs, send token (and org/venue) to backend; subscribe to org/venue topic or let backend select devices by org; handle incoming push and show “Alert resolved” + optional deep-link. |

Once the backend sends push when an alert is closed, and the mobile app has registered and subscribed correctly, resolve actions from the web dashboard will result in push notifications on the mobile app.
