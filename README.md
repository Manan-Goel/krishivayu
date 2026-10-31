# KrishiVayu (कृषिवायु) — Burn Alert to Buyer Match

> **One-liner:** Detect crop-residue fires in Punjab/Haryana, rank districts by risk to Delhi air quality, and match each hotspot to the nearest non-burning alternative (residue buyer, biomass/CBG plant, machinery rental), producing a ready-to-send farmer advisory in English, Hindi, and Punjabi.
>
> **Track:** Green Tech / Sustainable Development · Hackathon MVP

---

## The Problem

Every October and November, smoke from agricultural stubble burning (*parali*) in Punjab and Haryana blankets northern India and the Delhi National Capital Region (NCR), pushing the Air Quality Index (AQI) past severe thresholds (>450).

Existing interventions fail because:
1. **Satellite Gaps**: Polar-orbiting satellites (VIIRS and MODIS) pass at fixed times (10:30 AM & 1:30 PM). Many fires are lit in the late afternoon after satellites have passed.
2. **Alerts Without Actions**: Telling authorities or farmers that a fire is burning does not solve the root cause. Farmers face a tight 15–20 day window to prepare fields for the wheat crop and lack immediate, verified contacts for clean alternatives.
3. **Missing Downwind Risk Priority**: An active burn 100 km upwind of Delhi with winds blowing toward the capital poses far greater immediate danger than an isolated burn with crosswinds blowing away.

**KrishiVayu bridges detection directly to action:**
`Active Fire Detection → Downwind Delhi Risk Ranking → Clean Alternative Match → Instant Farmer Advisory`

---

## What KrishiVayu Does

- **🔥 Real-Time Hotspot Detection**: Pulls dual-satellite NASA FIRMS thermal hotspots (VIIRS SNPP + NOAA-20 at 375m NRT resolution), filtering out low-confidence anomalies.
- **💨 Aerodynamic Wind Alignment**: Integrates real-time 10m wind direction and speed from Open-Meteo. Uses a spherical cosine transfer function to compute the exact smoke transport vector heading into Delhi NCR.
- **📊 Transparent Air-Quality Risk Heuristic (0–100)**: Ranks districts based on:
  - **Fire Volume (40%)**: Normalized active fire count and fire radiative power (FRP).
  - **Proximity to Delhi (30%)**: Geodesic Haversine distance scaled between 50 km and 450 km.
  - **Wind Trajectory (30%)**: Normalized alignment of the prevailing plume toward Central Delhi (`28.6129° N, 77.2295° E`).
- **🏭 Nearest Clean Alternatives Match**: Connects each burning district to the nearest:
  - **CBG Bio-CNG Plant** (SATAT initiative buyback)
  - **Biomass Pelletizing Plant** (Thermal power plant co-firing)
  - **Residue Off-Take Aggregator** (Industrial fiber & board procurement)
  - **Custom Hiring Centre (CHC)** (Subsidized Happy Seeder & Super Seeder rental)
- **📱 Trilingual Farmer Advisory Generator**: One-click generation of localized SMS / WhatsApp advisories with exact distances, pricing quotes, and contact numbers in **English**, **हिन्दी (Hindi)**, and **ਪੰਜਾਬੀ (Punjabi)**.
- **🛡️ 100% Venue & Offline Resilience**: Bundled fallback snapshot (`public/data/firms_snapshot.json`) ensures the app functions flawlessly on conference Wi-Fi or with zero external API credentials.

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

### 2. Environment Setup (Optional for Live NASA Data)

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# NASA FIRMS MAP API Key (Free registration at https://firms.modaps.eosdis.nasa.gov/api/)
FIRMS_MAP_KEY=your_key_here
```
*(Note: If no key is provided, KrishiVayu automatically falls back to an authenticated recent VIIRS snapshot with a visible badge).*

### 3. Run Development Server

```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Test Suite

```bash
npm test
```
Runs the 4 verified unit and integration test suites:
- Geodesic benchmarks and bearing calculations
- Aerodynamic wind alignment and risk heuristic bounds
- Keyless Open-Meteo live call and neutral fallback path
- Clean alternatives catalog validation and nearest-neighbor matching
- Demo resilience and offline snapshot fallback

---

## 90-Second Judge Demo Script

| Time | Screen / Action | Spoken Script |
|---|---|---|
| **0:00 – 0:20** | **Headline Metrics** | *"Every harvest season, northern India suffocates under stubble smoke. But detection alone hasn't stopped it because farmers don't burn out of malice — they burn because they have a 2-week window to clear fields and no instant alternative. This is KrishiVayu: Burn Alert to Buyer Match."* |
| **0:20 – 0:45** | **Live Map View** | *"On screen, you see our dark-canvas MapLibre dashboard. KrishiVayu ingest active VIIRS 375m fire hotspots and combines them with live Open-Meteo wind vectors. Right now, winds are blowing from the North-West at 11 km/h straight down into Delhi NCR — shown by our target plume receptor."* |
| **0:45 – 1:10** | **Click High-Risk District (e.g. Karnal or Kaithal)** | *"Instead of just showing red dots, our algorithm ranks every district by threat to Delhi's air. Let's click Karnal. The risk breakdown explains exactly why: 2 fires, 118 km from Delhi, and 98% wind alignment toward NCR."* |
| **1:10 – 1:30** | **Detail Drawer & Farmer Advisory** | *"Here is the breakthrough: KrishiVayu instantly matches Karnal to the nearest non-burning solutions — a Custom Hiring Centre 22 km away with 15 Super Seeders, and a Biomass hub buyback @ ₹2,200/ton. With one click, it generates a personalized, respectful message in English, Hindi, or Punjabi, ready to send via WhatsApp or SMS. We turn a pollution alert into an economic transaction."* |

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router                     │
│  /           Main Dashboard (Map + Ranked List + Drawer)    │
│  /trends     Historical CREAMS Stubble Burning Analysis     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       GET /api/firms                 GET /api/matches
  (NASA VIIRS SNPP + NOAA-20)   (Hotspots + Wind + Risk + Match)
               │                              │
       ┌───────┴──────┐               ┌───────┴───────────────┐
       ▼              ▼               ▼                       ▼
  Live FIRMS     Fallback       Open-Meteo 10m          Clean Alternatives
  Area CSV       Snapshot        Wind Service               Catalog
 (15m Cache)   (2026-10-30)       (1h Cache)           (15 Demo Facilities)
```

---

## Honest Heuristic & Data Disclaimers

1. **Analytical Heuristic, Not Dispersion Simulation**:
   The 0–100 air quality risk score is a deterministic, transparent prioritization heuristic (40% fire volume, 30% proximity, 30% wind alignment). It is designed for civic triage and rapid resource allocation, not regulatory atmospheric modeling.
2. **Synthetic Alternatives Data**:
   To comply with strict anti-hallucination standards, the alternative facilities (CBG plants, biomass depots, and machinery rental centers) are synthetic benchmark records with authentic coordinates in Punjab and Haryana. Every demo record is explicitly tagged with `isDemo: true` and displays a visible **Demo Data** badge in the interface.
3. **NASA FIRMS**:
   Hotspot data is sourced from NASA's Land, Atmosphere Near real-time Capability for EOS (LANCE) / FIRMS using VIIRS 375m NRT products.

---

## Attributions & Licenses

- **NASA FIRMS**: Satellite active fire detections courtesy of NASA EOSDIS FIRMS.
- **Weather Data**: Open-Meteo keyless weather API under CC-BY 4.0.
- **Historical Data**: ICAR-IARI Consortium for Research on Agroecosystem Monitoring and Modeling from Space (CREAMS).
- **Map Tiles**: CARTO Dark Matter vector/raster basemaps © OpenStreetMap contributors, © CARTO.

---

## Deployment (Vercel Free Tier)

KrishiVayu is built to deploy effortlessly to Vercel's free serverless tier:
- Zero heavy C++ binaries or ONNX dependencies
- Sub-minute cold builds
- Pure TypeScript domain functions with zero external runtime overhead
- Add `FIRMS_MAP_KEY` in Vercel Project Settings > Environment Variables
