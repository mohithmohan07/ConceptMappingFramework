# Concept mapping — sales demo

Interactive **Parent concept → Grade → Chapter → Topic → Concept** hierarchy with search, summary metrics, CSV export, and a modal for full concept descriptions.

## Quick start

```powershell
cd concept-mapping-viz
npm install
npm run dev
```

Open the URL Vite prints.
- Local machine: `http://localhost:5173`
- Remote/dev-container use: use the forwarded **Network** URL that Vite prints when running with `--host`.

## Data refresh

1. Export your Excel workbook to `public/data/concepts.json` (see [DATA_PIPELINE.md](./DATA_PIPELINE.md)).
2. Reload the page.

## Build

```powershell
npm run build
npm run preview
```

## Netlify deployment

This repo includes `netlify.toml` so Netlify uses a stable production setup:

- Node `20`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA redirect fallback to `index.html`

If a Netlify build fails, open **Deploy logs** and verify the site is building the latest commit SHA from this branch.

## Project layout

- `src/data/transformToHierarchy.ts` — flat rows → nested hierarchy (source of truth for structure).
- `src/lib/filterHierarchy.ts` — search pruning.
- `src/lib/parseDescription.ts` — optional split of Description / Types / Misconception.
- `public/data/concepts.json` — generated from your workbook (690 rows for the bundled Biology sample).

## Performance

The bundled dataset is modest. For very large maps (tens of thousands of concepts), consider lazy-loading JSON, server-side filtering, or list virtualization under each topic.
