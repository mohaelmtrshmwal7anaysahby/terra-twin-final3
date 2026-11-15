# TerraTwin — Planetary Analog Observatory

Explore Earth's extreme geological landscapes and discover their scientific connections to the Moon and Mars. TerraTwin pairs real terrestrial analog sites (Iceland, Hawaii, Death Valley, Atacama, Antarctica, Haughton Crater, the Canadian Arctic) with lunar and Martian terrain, and offers dedicated hubs for explorers, students, scientists, and astronauts.

## Data integrity

Every metric carries a provenance tier: **measured**, **modeled**, **illustrative** (no confirmed source) or **incomplete** (`null`). Only measured/modeled axes count toward a *reliable* similarity score; otherwise the UI shows a clearly labelled *provisional* score. Mineral percentages are `null` until sourced. See [`docs/DATA_AUDIT.md`](docs/DATA_AUDIT.md) for the current status of every value and how to upgrade it. `npm test` enforces these rules.

## Features

- Cinematic 3D observatory landing: real Earth/Moon/Mars maps, night-side city lights, sun-aware atmosphere, bloom, twinkling starfield and nebula, with a camera descent on load (Three.js), a scroll-driven Earth → Moon → Mars journey, an iris "warp" transition into each analog site, instrument-style HUD details, and an analog-site map (Leaflet)
- Side-by-side comparison of Earth analogs with the Moon and Mars
- Persona hubs: Explorer, Student, Scientist, Astronaut
- Live analog-site weather (Open-Meteo) and NASA feeds (Perseverance, EONET)
- 50-language i18n with RTL support (Arabic included), dark/light themes

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Three.js · Leaflet · Motion · Express (optional API proxy)

## Getting started

Requires **Node.js 20.19+** (or 22.12+).

```bash
npm install
cp .env.example .env     # optional, see below
npm run dev              # Express + Vite dev server at http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with the Express API (`/api/*`) and Vite middleware |
| `npm run dev:static` | Plain Vite dev server (no API; the app falls back to direct calls) |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve `dist/` plus the API with Express (run `build` first) |
| `npm run preview` | Preview the static build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run lint:code` | Biome lint, including accessibility rules |
| `npm test` | Unit and render tests (Vitest) |
| `npm run test:e2e` | Playwright smoke tests (needs `npx playwright install chromium`) |
| `npm run fetch:nasa` | Write a static NASA snapshot to `public/data/` |
| `npm run check` | Type-check + lint + unit tests |

## Environment variables

All optional. See [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `NASA_API_KEY` | Higher NASA API rate limits (defaults to `DEMO_KEY`) |
| `PORT` | Server port (default `3000`) |

## Deploying to GitHub Pages

The included workflow (`.github/workflows/deploy-pages.yml`) builds and publishes the site on every push to `main`.

1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site goes live at `https://<user>.github.io/<repo>/`.

The app uses hash-based routing and relative asset paths, so it works under a repo sub-path without extra configuration.

> **Note:** GitHub Pages is static, so the Express API is not available there. Weather falls back to calling Open-Meteo directly from the browser. NASA data comes from a snapshot (`public/data/nasa-feed.json`) that the deploy workflow regenerates every 6 hours and labels as a snapshot, never as live. For truly live data, host the Express server (`npm run build && npm start`) on a Node host such as Render, Railway, or Fly.io.

## Quality

- **CI** (`.github/workflows/ci.yml`): type-check, Biome lint, unit/render tests and build on every PR.
- **E2E** (`.github/workflows/e2e.yml`): Playwright route/RTL/theme/skip-link smoke tests.
- **Dependabot** keeps npm packages and Actions current.
- Routes are code-split; images are pre-optimized WebP; motion respects `prefers-reduced-motion`.

## Project structure

```
src/
  components/   UI, charts, 3D globe, map
  pages/        Welcome, hubs, Moon, Mars, Explorer, Compare, Settings…
  context/      Global observatory state + hash router
  data/         Planetary and experience datasets
  i18n/         Translations and language list
  hooks/        Live telemetry hooks
server.ts       Optional Express server (weather + NASA proxy)
```

## Data sources

[Open-Meteo](https://open-meteo.com/) · [NASA Mars 2020 raw images](https://mars.nasa.gov/) · [NASA EONET](https://eonet.gsfc.nasa.gov/) · [NASA APOD](https://api.nasa.gov/) · Esri map tiles

## Credits

Texture sources and attribution notes live in [`docs/CREDITS.md`](docs/CREDITS.md).

## License

[MIT](LICENSE)
