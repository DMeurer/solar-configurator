# Solar Dashboard

A browser-based solar energy calculator. Model your solar installation, household consumption, and battery storage across a 24-hour day or 7-day week — all calculations run client-side with no backend required.

**Live demo:** https://dmeurer.github.io/solar-configurator/

## Features

- **Solar generation model** — Gaussian curve fitted to sunrise/sunset with seasonal variation. Supports sunny, partially cloudy, cloudy, and rainy weather presets with deterministic noise (stable across page refreshes).
- **Consumer management** — add devices with custom name, wattage, active window, and color. 25 device templates across 6 categories (Kitchen, Laundry, Entertainment, Climate, Water, Mobility). Drag to reorder.
- **Battery simulation** — per-minute charge/discharge simulation with configurable capacity, charge/discharge rate, initial state of charge, and round-trip efficiency. SoC shown as a separate chart below the main power chart.
- **7-day view** — energy bar chart showing solar generated, self-consumed, battery charged, grid import/export per day, each with its own weather preset.
- **Energy metrics** — solar generated, self-consumed, grid import/export, battery charged/discharged, and self-sufficiency percentage.
- **Share button** — encodes the full configuration into the URL (`?c=`). Copy the link and anyone opening it gets your exact setup.
- **Resizable sidebar** — drag the divider to adjust the sidebar width.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via GitHub Actions. To enable it on a new fork:

1. Go to **Settings → Pages** in your repository
2. Set the source to **GitHub Actions**

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
