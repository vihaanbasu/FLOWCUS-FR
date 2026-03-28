# FlexFlow

Student-focused weekly planner with sleep-aware scheduling, drag-and-drop blocks, onboarding, dashboard analytics, focus mode, and gamification.

**Stack:** React (Vite) + Tailwind CSS + Framer Motion · Express + JSON file store (`server/data/store.json`) — swap for SQLite/Supabase without changing the client contract.

## Quick start

```bash
cd flexflow
npm install
cd server && npm install && cd ../client && npm install && cd ..
npm run dev
```

- **API:** http://localhost:3847  
- **App:** http://localhost:5173  

The client proxies `/api` to the API in dev.

### FlexFlow Coach (assistant)

- **Route:** `/coach` — chat-style coach backed by **rule-based** analysis (no external LLM required for the MVP).
- **API:** `GET /api/users/:userId/assistant/insights`, `POST /api/users/:userId/assistant/chat`
- Uses **weekly blocks**, **sleep logs**, **gamification streaks**, and **`block_activity_log`** (server logs reschedules when blocks move) to surface schedule balance, sleep risk, procrastination hints, “rescue” time suggestions, and weekend **week-in-review** summaries.
- Optional **browser nudges:** enable on the Coach page; requires notification permission (same as block reminders).
- **Energy rhythm** is stored in `user.onboarding.energyPeak` (`morning` | `afternoon` | `evening`) and tunes difficulty-focused suggestions.

### Authentication

- **Sign up** collects username (lowercase letters, numbers, underscores), email, phone (10+ digits), name, optional grade, and password (8+ characters). **Sign in** accepts email or username plus password.
- Sessions are **JWTs** stored in `localStorage` under `flexflow_token`. The client sends `Authorization: Bearer <token>` on API requests.
- For production, set **`JWT_SECRET`** (and optionally `JWT_EXPIRES_IN`) on the server environment. The dev default is insecure by design.
- Users in `server/data/store.json` created before password auth was added **lack `password_hash`** and cannot sign in until you **register a new account** or **remove those user records** from the store.

## Client architecture

High-level layout of `client/src`:

| Area | Purpose |
|------|---------|
| `app/` | `App.jsx`, `AppProviders.jsx` (router + context + error boundary), `AppRoutes.jsx` |
| `services/http/` | `request()`, `ApiError`, base URL (`VITE_API_BASE` optional) |
| `services/api/` | Resource modules (`users`, `schedule`, `sleep`) + `api` facade |
| `domain/schedule/` | Pure logic: constants, time math, scoring, analytics, auto-schedule |
| `components/ui/` | Reusable primitives: `Button`, `Card`, `Modal`, fields, `PageHeader`, etc. |
| `components/layout/` | `AppShell`, `navigationConfig.js` |
| `components/planner/` | Weekly grid split into `TimeRuler`, `DayColumn`, block cards, modals, hooks |
| `components/errors/` | `ErrorBoundary` |
| `features/onboarding/` | Onboarding flow (wizard) |
| `context/` | `AppProvider` / `useApp` |
| `hooks/` | e.g. `usePlannerDrag`, notifications |
| `pages/` | Route-level screens (mostly composition) |

Path alias: `@/` → `src/` (see `vite.config.js` and `jsconfig.json`).

## Server

REST handlers live in `server/index.js` with persistence in `server/store.js`. Replace `readStore`/`mutate` with a database layer when you scale.

## Features (prototype)

- 7-day grid (5:00 AM–1:00 AM) with drag, resize, edit, delete, color-coded types  
- Onboarding → auto-generated week  
- Sleep-aware tips; scores and weekly `/100` breakdown  
- Browser notifications (with permission) for blocks with reminders  
- Dashboard, sleep charts, analytics & achievements, focus timer  

## Reset profile

Sign out from the app, or remove `localStorage` key `flexflow_token` (legacy: `flexflow_user_id` is cleared on logout). To wipe server data, delete `server/data/store.json`.
