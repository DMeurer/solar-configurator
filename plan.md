# Solar Dashboard — Frontend Application Specification

## Overview

A browser-based single-page application that visualises solar generation, household consumption, and optional battery storage across a 24-hour day or a 7-day forecast. All calculation happens client-side; no backend is required for the core feature set.

---

## 1. Core Architecture

### Technology Stack

- **Framework:** React (or plain TypeScript + Vite for minimal overhead)
- **Charting:** Chart.js or Recharts — both support sub-minute resolution smoothly
- **State management:** Zustand or plain React context (scope is manageable)
- **Styling:** Tailwind CSS

### Data Flow

```
User Parameters
      │
      ▼
Solar Model ──► Battery Model ──► Net Power Model
      │                │                │
      └────────────────┴────────────────┘
                       │
                  Chart Renderer
                  (1-min resolution)
```

All models are pure functions that take parameters and return an array of `{ minuteOfDay: number, watts: number }` data points. The chart layer consumes these arrays directly.

---

## 2. Solar Generation Model

### Current (Proof of Concept) Approach

A Gaussian curve centred on solar noon, clipped at the inverter limit:

```
P(t) = MIN(inverterLimit, peakWatts × exp(−(t − peakTime)² / (2σ²)))
       where σ = (peakTime − sunrise) / 3
```

This runs at **1-minute resolution** (1 440 data points per day), producing a smooth curve with no visible steps.

### Planned Enhancements

#### 2a. Geo-Position + Date Input

Accept latitude, longitude, and a calendar date from the user. Derive:

- **Sunrise / sunset times** — calculated via the standard solar position algorithm (NOAA / SPA). A lightweight JS implementation (e.g. `suncalc`) handles this without a server call.
- **Solar noon** — the midpoint between sunrise and sunset; becomes the automatic peak time.
- **Day length** — directly widens or narrows the generation window.
- **Solar elevation angle** — affects the effective irradiance reaching a tilted panel. A panel tilted at angle β facing south receives maximum irradiance when the sun's elevation matches β. The model scales peak wattage by `sin(elevation) / sin(optimal_elevation)`.
- **Panel orientation inputs** — azimuth (compass direction the panels face) and tilt angle, so the user can model their actual roof.

Result: the user enters their address (or drops a pin), picks a date, and the curve automatically reflects actual local sunrise/sunset and irradiance for that day of the year — no manual time entry needed.

#### 2b. Seasonal Presets

For users who do not want to enter coordinates, offer quick presets:

| Preset | Approximate day length | Peak watts factor |
|---|---|---|
| Summer solstice | ~16 h | 1.00 |
| Spring / Autumn equinox | ~12 h | 0.80 |
| Winter solstice | ~8 h | 0.55 |

---

## 3. Weather Model

### 3a. Weather Presets (Phase 1 — no API required)

The user selects a weather condition per day. Each preset modifies the solar curve with a **scaling factor** and a **noise function**:

| Preset | Base scale | Noise character | Visual effect |
|---|---|---|---|
| ☀️ Sunny | 1.00 | None | Clean Gaussian |
| 🌤 Partially cloudy | 0.75 | Smooth random dips, ±20 % | Gentle fluctuations |
| ☁️ Cloudy | 0.40 | Larger slow fluctuations, ±30 % | Dampened, uneven curve |
| 🌧 Rainy | 0.00 | — | Flat zero |

The noise is generated with a **seeded pseudo-random function** (e.g. a simple LCG seeded by date + preset name). This means the fluctuation pattern is deterministic — refreshing the page does not redraw it randomly, giving a stable planning view.

Partially cloudy and cloudy presets also add occasional sharp dips (simulating cloud passage) using a sum of smooth step functions placed at pseudo-random times.

### 3b. Live Weather Forecast (Phase 2 — optional API)

Integrate a free weather API (Open-Meteo is free, CORS-friendly, and returns hourly cloud cover as a percentage). The cloud cover value maps directly to a scale factor and drives a higher-fidelity noise model. This requires no API key and no backend proxy.

The 7-day view shows one weather condition badge per day (from the API or from the user's preset selection), and the solar curve for each day reflects that day's conditions.

---

## 4. Consumption Model

### Consumer Definition

Each consumer is defined by:

| Field | Type | Description |
|---|---|---|
| Name | string | Display label |
| Start | time | When the load begins (HH:MM) |
| End | time | When the load ends (HH:MM) |
| Watts | number | Constant power draw during active window |
| Days active | multi-select | Which days of the week (for 7-day view) |
| Color | color | Chart series color |

Consumers are rendered as individual series and summed into a **Total Consumption** line placed directly adjacent to the Solar series in the chart legend, matching the Excel layout.

### Adding / Removing Consumers

A sidebar panel lists all consumers. An **Add Consumer** button appends a new row with default values. Rows can be deleted or toggled active/inactive without deleting them (useful for scenario planning).

---

## 5. Battery / Power Storage Model

### Parameters

| Parameter | Description |
|---|---|
| Capacity (Wh) | Total usable energy the battery can store |
| Max charge rate (W) | Maximum watts the battery accepts when surplus exists |
| Max discharge rate (W) | Maximum watts the battery can supply to the house |
| Initial state of charge (%) | Starting charge level for the simulation |
| Round-trip efficiency (%) | Charge/discharge efficiency loss (default 90 %) |

### Simulation Logic (per minute)

```
net = solar(t) − consumption(t)

if net > 0 and battery.soc < capacity:
    charge = min(net, maxChargeRate, capacity − battery.soc)
    battery.soc += charge × efficiency × (1/60)   // Wh per minute
    grid_export = net − charge

if net < 0 and battery.soc > 0:
    discharge = min(−net, maxDischargeRate, battery.soc)
    battery.soc −= discharge × (1/60)
    grid_import = (−net) − discharge

if net < 0 and battery.soc == 0:
    grid_import = −net
```

### Battery Chart Overlay

A secondary Y-axis (right side) shows **State of Charge (%)** as a filled area behind the power curves. This gives an immediate visual of when the battery is full, depleting, or empty.

---

## 6. Charts & Resolution

### Resolution

All curves are computed at **1-minute intervals** (1 440 points for 24 h, 10 080 points for 7 days). Chart.js handles this comfortably with `tension: 0.4` on line series, producing a visually continuous, smooth curve.

For the 7-day view, points can be down-sampled to 5-minute intervals (2 016 points) for rendering performance without visible quality loss.

### Chart Types

| View | Chart | Series |
|---|---|---|
| Day view | Single line chart | Solar, Total Consumption, individual consumers (toggleable), Battery SoC |
| 7-day view | Multi-day line chart or sparkline grid | Solar forecast, Consumption forecast, Battery SoC trajectory |
| Energy summary | Bar chart | Daily: generated (kWh), consumed (kWh), battery charged, grid import/export |

### Interactivity

- Hover tooltip showing all series values at the cursor time
- Click a day in the 7-day bar chart to jump to the day view for that day
- Toggle individual consumer series on/off via the legend
- Zoom/pan on the day view (pinch on mobile, scroll on desktop)

---

## 7. UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: title, date picker, location input, view toggle│
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │   Main Chart Area                        │
│              │                                          │
│  Solar       │   [Day View / 7-Day View]                │
│  parameters  │                                          │
│              │                                          │
│  Consumers   │                                          │
│  (list)      │                                          │
│  + Add       │                                          │
│              │                                          │
│  Battery     ├──────────────────────────────────────────┤
│  parameters  │   Energy Summary Bar Chart               │
│              │                                          │
│  Weather     │   Self-consumption: xx %                 │
│  (per day)   │   Grid import today: x.x kWh             │
│              │   Grid export today: x.x kWh             │
└──────────────┴──────────────────────────────────────────┘
```

The sidebar is collapsible on mobile. All parameter inputs update the chart in real time without a submit button.

---

## 8. Key Metrics Panel

Below the main chart, display a summary row:

| Metric | Description |
|---|---|
| Solar generated | Total kWh produced today / this week |
| Self-consumed | kWh used directly from solar (no battery, no grid) |
| Battery charged | kWh stored |
| Battery discharged | kWh recovered from storage |
| Grid import | kWh drawn from the grid |
| Grid export | kWh fed back to the grid |
| Self-sufficiency | `(solar + battery discharge) / total consumption` as % |

---

## 9. Possible Future Extensions

- **Tariff model** — enter grid import/export prices (including time-of-use tariffs) to calculate daily cost/savings
- **Battery charge strategy** — e.g. "charge from grid at night if price is low, use battery during peak hours"
- **Multiple inverters / strings** — model east-west split roof orientations as two separate Gaussian curves summed together
- **Shading model** — define shading periods (e.g. a tree shadows the panels 09:00–10:30) as manual dip overlays
- **Historical comparison** — load actual meter data (CSV upload) and overlay it against the model
- **Export** — download the computed time series as CSV or PNG of the chart

---

## 10. Development Phases

| Phase | Scope |
|---|---|
| 1 — Core | Solar curve, consumers, smooth 1-min chart, day view |
| 2 — Weather | Weather presets, 7-day view, energy summary bar chart |
| 3 — Battery | Battery simulation, SoC overlay, metrics panel |
| 4 — Geo | Location input, suncalc integration, panel orientation |
| 5 — Live weather | Open-Meteo API integration, forecast auto-fill |
