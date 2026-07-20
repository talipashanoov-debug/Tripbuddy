# TripBuddy

> An all-in-one web app for groups of friends to plan a trip together — one shared itinerary and one shared expense ledger, so nobody is left guessing about the schedule or the split.

TripBuddy lets a group manage a **daily itinerary** and track **shared expenses** in a single place, with real-time-friendly data backed by Supabase and a clean, responsive interface built with React and Tailwind CSS.

---

##  Table of Contents

- [General Overview](#-general-overview)
- [The Problem](#-the-problem)
- [Target Audience](#-target-audience)
- [Competitors & Differentiation](#-competitors--differentiation)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [External Services & Integrations](#-external-services--integrations)
- [Running the Project Locally](#-running-the-project-locally)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)

---

##  General Overview

**TripBuddy** is a collaborative trip-planning platform for groups travelling together. It combines a **day-by-day itinerary builder** and a **shared-expense tracker** into one application, giving every member of the group a single source of truth for what the plan is and who paid for what.

---

##  The Problem

Planning a group trip is fragmented and stressful. In practice, a group ends up juggling:

- **A messy group chat** where the itinerary is buried under hundreds of messages and nobody can find "what are we doing on Tuesday?"
- **A spreadsheet** (or a notes app) that one person maintains for expenses, which quickly becomes error-prone and out of date.
- **Awkward end-of-trip math**, where everyone tries to remember who covered dinner, who bought the tickets, and how much each person actually owes.

The result is duplicated effort, lost information, and friction between friends over money.

**TripBuddy solves this** by centralising the two things every group trip actually needs — *the plan* and *the money* — into one shared, always-up-to-date app.

---

##  Target Audience

TripBuddy is built for:

- **Groups of friends** organising a vacation, city break, or road trip together.
- **Families** coordinating a multi-day holiday and shared costs.
- **Roommates or small clubs** planning group outings and splitting the bill.
- Anyone who currently coordinates travel through a mix of chat apps and spreadsheets and wants **one tool that does both**.

The product assumes a group of **non-technical users** who value a simple, visual, mobile-friendly interface over configuration.

---

## 🏆 Competitors & Differentiation

Groups today stitch together several general-purpose tools. Each solves *part* of the problem but none solves all of it:

| Alternative | What it does well | Where it falls short for group travel |
|-------------|-------------------|----------------------------------------|
| **WhatsApp / group chats** | Fast communication | The itinerary and any expense info get buried in the chat history; nothing is structured or queryable. |
| **Excel / Google Sheets** | Flexible expense math | Manual setup, easy to break formulas, no itinerary, poor mobile experience, no per-user access control. |
| **Splitwise** | Expense splitting & settlement | Money only — there is **no itinerary or trip planning** side to it. |
| **Google Docs / Notes** | Simple itinerary text | Unstructured, no expense logic, no automatic totals. |

### Why an all-in-one trip planner is better

TripBuddy's advantage is **consolidation with context**:

- **One app, one trip, one team.** The itinerary and the expenses live under the same trip, shared with the same members — no re-inviting people to three different tools.
- **Structured, not free-text.** Activities have real dates, times, and locations; expenses have real amounts and payers — so the app can group, sort, sum, and (next) calculate settlements automatically.
- **Purpose-built for the trip lifecycle.** Rather than bending a chat app or spreadsheet to fit, every screen is designed around exactly what a travelling group needs to see.

---

##  Features

-  **Authentication** — email/password sign-up and sign-in, with protected routes.
-  **Dashboard** — see all trips you belong to; create a new trip from a modal.
-  **Trip Details** — a dedicated page per trip with a tabbed **Itinerary** / **Expenses** interface.
-  **Itinerary** — add activities (title, date, start time, location); they're grouped by day into a clean timeline.
-  **Expenses** — log **categorised** shared expenses (Food, Transport, Accommodation, Activities, Other) with a live running **Total Expenses** summary.
-  **Settlement plan** — a Supabase Edge Function computes the minimal set of payments to settle the group up.
-  **Trip members** — see who's on a trip and invite collaborators by email or user ID.
-  **Full CRUD** — add and delete activities and expenses, with instant optimistic UI updates.
-  **Instant UI updates** — new trips, activities, and expenses appear immediately without a page refresh.
-  **Responsive design** — built mobile-first with Tailwind CSS.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend framework** | [React 18](https://react.dev/) |
| **Build tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Routing** | [React Router](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend-as-a-Service** | [Supabase](https://supabase.com/) |

---

##  External Services & Integrations

TripBuddy relies on the **Supabase** platform for its entire backend. The individual services used are:

| Service | Purpose in TripBuddy | Status |
|---------|----------------------|--------|
| **Supabase Auth** | Handles user authentication — email/password sign-up, sign-in, and session management. Powers the app's protected routes. | ✅ Implemented |
| **Supabase Database** (PostgreSQL) | Primary data store for `trips`, `trip_members`, `activities`, and `expenses`. **Row-Level Security (RLS)** policies ensure users can only access trips they are a member of. | ✅ Implemented |
| **Supabase Edge Functions** | Hosts two functions: **`calculate-settlement`** (splits expenses equally and computes the minimal **"who owes whom"** payment plan) and **`manage-members`** (lists members with emails and lets the creator invite others). Both run with the service role for secure access to `auth.users`, and authorize the caller against trip membership before responding. | ✅ Implemented |

> **Note:** All three Supabase services are in active use. The settlement calculation is intentionally performed in an Edge Function (not the browser) so the result is authoritative, identical for every member, and able to use the service role without exposing it client-side.

### Deploying the `calculate-settlement` Edge Function

The function lives in [`supabase/functions/calculate-settlement/`](supabase/functions/calculate-settlement/index.ts). To deploy it to your Supabase project:

```bash
# One-time setup
npx supabase login
npx supabase init            # creates supabase/config.toml (safe if the folder already exists)
npx supabase link --project-ref <your-project-ref>

# Deploy both functions
npx supabase functions deploy calculate-settlement
npx supabase functions deploy manage-members
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform — no manual secrets required.

---

## 🚀 Running the Project Locally

### Prerequisites

- **Node.js** v18 or later (developed on v24)
- **npm** (bundled with Node.js)
- A **Supabase project** (free tier is sufficient)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd tripbuddr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

> Both values are found in your Supabase dashboard under **Project Settings → API**. Use the **base project URL** (without any `/rest/v1/` suffix). The `anon` key is safe to expose in a client app — Row-Level Security is what protects your data.

### 4. Set up the database

In the Supabase **SQL Editor**, create the `trips`, `trip_members`, `activities`, and `expenses` tables (see [Database Schema](#-database-schema)) and enable **Row-Level Security** with policies scoped to trip membership.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with hot-module reload. |
| `npm run build` | Create an optimised production build in `dist/`. |
| `npm run preview` | Locally preview the production build. |

---

##  Project Structure

```
tripbuddr/
├── src/
│   ├── components/          # Reusable UI (Modal, Itinerary, Expenses, forms)
│   ├── context/             # AuthContext (session & user state)
│   ├── lib/                 # supabaseClient + formatting helpers
│   ├── pages/               # Route-level screens (Login, Dashboard, TripDetails)
│   ├── App.jsx              # Routes + protected-route guard
│   ├── main.jsx             # App entry (Router + AuthProvider)
│   └── index.css            # Tailwind entry
├── supabase/
│   └── functions/
│       ├── calculate-settlement/   # "Who owes whom" Edge Function
│       └── manage-members/         # List members + invite (Edge Function)
├── .env.example             # Template for Supabase credentials
├── index.html
├── vite.config.js
└── package.json
```

---

##  Database Schema

TripBuddy uses four related tables:

| Table | Key columns | Description |
|-------|-------------|-------------|
| **trips** | `id`, `title`, `destination`, `start_date`, `end_date`, `created_by` | A single trip. |
| **trip_members** | `id`, `trip_id → trips.id`, `user_id → auth.users.id`, `role` | Links users to the trips they belong to (many-to-many). |
| **activities** | `id`, `trip_id → trips.id`, `activity_date`, `start_time`, `title`, `location` | Itinerary items belonging to a trip. |
| **expenses** | `id`, `trip_id → trips.id`, `description`, `amount`, `paid_by → auth.users.id` | Shared expenses belonging to a trip. |

All tables have **Row-Level Security** enabled so that a user can only read or write data for trips they are a member of.

---

<p align="center">Built with ❤️ using React, Tailwind CSS, and Supabase.</p>
