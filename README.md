# KrishiVayu (कृषिवायु) — Burn Alert to Buyer Match & Residue Market

> **One-liner:** Detect crop-residue fires in Punjab/Haryana, rank districts by risk to Delhi air quality, match hotspots to clean alternatives, and connect farmers with industrial residue off-takers through a privacy-first, trilingual paddy straw marketplace.
>
> **Track:** Green Tech / Sustainable Development · Civic Tech MVP
>
> **Live Deployment:** [https://krishivayu-dw9o.vercel.app/](https://krishivayu-dw9o.vercel.app/)

---

## The Problem

Every October and November, smoke from agricultural stubble burning (*parali*) in Punjab and Haryana blankets northern India and the Delhi National Capital Region (NCR), pushing the Air Quality Index (AQI) past severe thresholds (>450).

Existing interventions fail because:
1. **Satellite Gaps**: Polar-orbiting satellites (VIIRS and MODIS) pass at fixed times (10:30 AM & 1:30 PM). Many fires are lit in the late afternoon after satellites have passed.
2. **Alerts Without Actions**: Telling authorities or farmers that a fire is burning does not solve the root cause. Farmers face a tight 15–20 day window to prepare fields for the wheat crop and lack immediate, verified economic off-takers for their straw.
3. **Missing Downwind Risk Priority**: An active burn 100 km upwind of Delhi with winds blowing toward the capital poses far greater immediate danger than an isolated burn with crosswinds blowing away.
4. **Market Friction & Privacy Fears**: Farmers fear harassment or cold calls if they publish contact numbers publicly, while biomass pellet plants and CBG plants struggle with fragmented supply chains and unpredictable availability.

**KrishiVayu bridges detection directly to economic action:**
`Active Fire Detection → Downwind Delhi Risk Ranking → WhatsApp Advisory with Deep Link → Farmer Residue Listing → Buyer Offer Matching → Private Unguessable Off-Take Lifecycle`

---

## What KrishiVayu Does

### 1. 🔥 Detection & Risk Modeling
- **Real-Time Hotspot Detection**: Pulls dual-satellite NASA FIRMS thermal hotspots (VIIRS SNPP + NOAA-20 at 375m NRT resolution), filtering out low-confidence anomalies.
- **Aerodynamic Wind Alignment**: Integrates real-time 10m wind direction and speed from Open-Meteo. Uses a spherical cosine transfer function to compute the exact smoke transport vector heading into Delhi NCR.
- **Transparent Air-Quality Risk Heuristic (0–100)**: Ranks districts based on:
  - **Fire Volume (40%)**: Normalized active fire count and fire radiative power (FRP).
  - **Proximity to Delhi (30%)**: Geodesic Haversine distance scaled between 50 km and 450 km.
  - **Wind Trajectory (30%)**: Normalized alignment of prevailing plume toward Central Delhi (`28.6129° N, 77.2295° E`).
- **Residue Demand Signals**: Aggregates active, uncollected paddy straw supply per district directly into district cards, giving officials and off-takers real-time visibility into harvest readiness.

### 2. 🌾 Farmer-Facing Residue Marketplace (`/market`)
- **Trilingual Sell Wizard (`/market/sell`)**: Mobile-first 3-step listing flow in **English**, **हिन्दी (Hindi)**, and **ਪੰਜਾਬੀ (Punjabi)**. Automatically pre-fills district and village from WhatsApp advisory deep links (`?district=...&village=...&ref=wa`).
- **Official Price Benchmarking**: Displays the CPCB/PEDA benchmark guide for ex-situ stubble (₹180–₹220/quintal farmgate) while granting farmers complete flexibility to specify custom asking prices.
- **Browse & Offer Feed (`/market`)**: Split-screen desktop feed and map synchronization with MapLibre GL. Off-takers can filter by district, straw form (loose, baled, chopped), and minimum quantity, and submit formal purchase offers.
- **Nearby Clean Alternatives**: Surfaces verified clean alternatives (CBG plants, pellet hubs, CHCs) with geodesic distance calculations and confidence verification tags.

### 3. 🔐 Privacy-Preserving Farmer Dashboard (`/market/manage/[token]`)
- **Zero Public PII**: Farmer phone numbers are strictly stripped from all public browse APIs and detail views.
- **Unguessable Management Token**: On listing creation, the farmer receives an unguessable 32-character random access token (`token=...`). The backend stores only a one-way SHA-256 hash (`editTokenHash`).
- **Gated Contact Reveal**: Farmer and buyer phone numbers are revealed to each other **only** after the farmer reviews and accepts the buyer's offer.
- **End-to-End Lifecycle State Machine**: Enforces valid lifecycle transitions: `listed` → `offered` → `accepted` → `pickup_scheduled` → `collected` (or `withdrawn`).

### 4. 🔑 Simulated Auth (`/auth`)
- A zero-friction role switcher allowing judges and users to toggle between **Farmer**, **Buyer / Off-taker**, and **Observer** modes without passwords or credentials.

---

## Quickstart

### Prerequisites
- Node.js 20+ (tested on Node v24 LTS)
- npm 10+

### 1. Clone & Install

```bash
git clone https://github.com/Manan-Goel/krishivayu.git
cd krishivayu
npm install
```

### 2. Environment Setup

Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Configure `.env.local`:
```env
# NASA FIRMS MAP API Key (Optional: defaults to authentic bundled snapshot if unset)
FIRMS_MAP_KEY=your_key_here

# Public site URL used to construct WhatsApp deep links
NEXT_PUBLIC_SITE_URL=https://krishivayu-dw9o.vercel.app
```

### 3. Run Development Server

```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Test Suite

```bash
npm test
```
Executes all **10 automated unit, integration, and security test suites**:
1. `domain.test.ts`: Geodesic distance, bearing benchmarks, and aerodynamic wind alignment.
2. `weather.test.ts`: Live Open-Meteo API ingestion and error fallback paths.
3. `alternatives.test.ts`: Clean alternatives dataset validation and nearest-neighbor matching.
4. `resilience.test.ts`: Offline NASA snapshot resilience and risk score stability.
5. `market.test.ts`: Marketplace contracts, quantity/phone validations, and state machine transition rules.
6. `repo.test.ts`: In-memory and file persistence round-trips, seed idempotency, and demo flag integrity.
7. `api-matrix.test.ts`: API security matrix, PII redaction, token-hash authorization, and rate limiting.
8. `lifecycle.test.ts`: 10-step farmer lifecycle (listing creation, offer receipt, acceptance, contact unlock, pickup, collection).
9. `whatsapp-integration.test.ts`: Multilingual WhatsApp message templates and deep-link generation.
10. `demand-signal.test.ts`: District-level demand signal aggregation without PII leaks.

---

## End-to-End 2-Minute Demo Script

| Step | Action | What to Notice |
|---|---|---|
| **1. Threat Ranking** | Open homepage (`/`), view high-risk districts (e.g. Sangrur or Bathinda). | MapLibre wind plume vectors indicate smoke transport trajectory directly into Delhi NCR. |
| **2. Advisory Generation** | Click on a district card to open the Detail Drawer. | View nearest clean alternatives, local stubble demand signals, and click **Share on WhatsApp**. Pre-fills a trilingual message with a deep link to `/market/sell?district=Sangrur&ref=wa`. |
| **3. Farmer Sell Flow** | Open the WhatsApp deep link in your browser (`/market/sell`). | Notice pre-filled district/village, language switcher (EN/HI/PA), CPCB/PEDA benchmark indicator (₹180–₹220/qtl), and phone privacy guarantee. Fill out form and submit. |
| **4. Private Management Link** | Copy the generated private management link from the confirmation screen. | Farmer receives `https://krishivayu-dw9o.vercel.app/market/manage/<32-char-token>`. |
| **5. Marketplace Browse** | Navigate to `/market`. Notice your newly listed stubble on the feed and map. | Phone number is completely hidden. Real clean facilities appear under *Nearby Clean Alternatives* with verification tags, while demo buyers carry visible `Demo` badges. |
| **6. Submit an Offer** | Click your listing, fill in buyer name, offer price, and contact in the offer form. | Listing status smoothly transitions from `listed` to `offered`. |
| **7. Private Acceptance** | Open your private management link saved in Step 4. | Farmer sees the offer. Click **Accept Offer**. The buyer's phone number is unlocked for the farmer, and the farmer's contact is unlocked for the buyer. |
| **8. Pickup & Collection** | Click **Schedule Pickup**, then **Confirm Collected**. | State transitions to `collected`, and stubble is removed from active market supply. |

---

## Project Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router                           │
│  /           Main Dashboard (Fire Map + Risk Rank + Detail Drawer)     │
│  /market     Residue Marketplace Feed & Interactive Map                │
│  /market/sell Mobile-First Trilingual Sell Flow (EN / HI / PA)         │
│  /market/manage/[token] Farmer Private Dashboard (Token Auth)          │
│  /auth       Simulated Zero-Password Role Switcher                     │
│  /trends     Historical ICAR-IARI Stubble Burning Analysis             │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │                              │
       GET /api/firms                 GET /api/matches
  (NASA VIIRS SNPP + NOAA-20)    (Hotspots + Wind + Risk + Demand Signals)
               │                              │
               ▼                              ▼
     GET & POST /api/market/listings  GET & POST /api/market/offers
     (Privacy-Masked Browse & Detail) (Offer Ingestion & Transitions)
               │                              │
               └──────────────┬───────────────┘
                              ▼
                Market Repository Singleton
        (In-Memory + /tmp Fallback on Vercel Serverless)
```

---

## Data Privacy & Security Guarantees

1. **Strict PII Redaction**: Farmer phone numbers are never returned by public browse (`/api/market/listings`) or public detail (`/api/market/listings/[id]`) endpoints before an offer is accepted.
2. **One-Way Token Hashing**: Management tokens generated during listing creation (`list_tok_...`) are unguessable 32-character cryptographically random strings. Only their SHA-256 hash is stored on disk and in memory.
3. **Mutual Contact Exchange**: Contact information is mutual and conditional: buyer and farmer phone numbers are only unlocked after the farmer explicitly verifies and accepts the buyer's offer.
4. **Rate Limiting**: Write endpoints (`POST /api/market/listings`, `POST /api/market/offers`, `PATCH /api/market/*`) are protected by an in-memory sliding window rate limiter (20 requests/minute per client).

---

## Honest Disclaimers & Limitations

1. **No Direct Financial Escrow**:
   KrishiVayu is a civic-tech discovery and coordination platform. It facilitates price discovery, negotiation, and pickup scheduling; it does not process financial payments, banking transactions, or hold escrow funds.
2. **Synthetic Demo Buyers vs. Real Alternatives**:
   Active bidders in the marketplace are synthetic benchmark profiles tagged with `isDemo: true` and display visible **Demo** badges to prevent hallucination. Official clean alternatives (such as Verbio India, SAEL, and Punjab CHCs) are sourced from official state registries and are presented separately under *Nearby Clean Alternatives* with approximate distances and verification prompts.
3. **Centroid Coordinates**:
   Districts use approximate geographic centroids for proximity calculation.
4. **No Automated WhatsApp / SMS Dispatch**:
   The platform generates authenticated, pre-filled `wa.me` links for user-initiated sharing. It does not spam or automatically dispatch third-party SMS/WhatsApp messages.

---

## Attributions & Licenses

- **NASA FIRMS**: Satellite active fire detections courtesy of NASA EOSDIS FIRMS (VIIRS 375m NRT).
- **Weather Data**: Open-Meteo keyless weather API under CC-BY 4.0.
- **Historical Data**: ICAR-IARI Consortium for Research on Agroecosystem Monitoring and Modeling from Space (CREAMS).
- **Map Tiles**: CARTO Dark Matter vector/raster basemaps © OpenStreetMap contributors, © CARTO.

---

## Deployment (Vercel Free Tier)

KrishiVayu is continuously deployed on Vercel:
- Production URL: [https://krishivayu-dw9o.vercel.app/](https://krishivayu-dw9o.vercel.app/)
- Serverless Node.js runtime with Turbopack build optimization
- In-memory persistence with `/tmp` filesystem fallback for serverless state continuity
- Environment variables: `NEXT_PUBLIC_SITE_URL` and `FIRMS_MAP_KEY`
