# Soteria — B2B operator dashboard

Vite + TanStack Start + React 19, Tailwind v4, shadcn/ui. The operator-side
front-end for Soteria. Lives next to (but is independent of) the Python
backend in `../../backend/`.

## Prerequisites

- **Bun** (preferred — the lockfile is `bun.lock`):
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- Or **Node 20+** with `npm` / `pnpm` if you'd rather not install Bun.

## Install

```bash
cd frontend/b2b-frontend
bun install         # or: npm install / pnpm install
```

## Run

```bash
bun run dev         # vite dev server, default http://localhost:5173
```

Other scripts (from `package.json`):

| Command | What it does |
|---|---|
| `bun run dev` | Local dev server with HMR |
| `bun run build` | Production build into `dist/` |
| `bun run build:dev` | Dev-mode build (sourcemaps, no minify) |
| `bun run preview` | Serve the production build locally |
| `bun run lint` | ESLint |
| `bun run format` | Prettier write |

## Backend integration

The Python backend (FastAPI + WebSocket pipeline) runs separately:

```bash
# from the project root, in another terminal
cd backend && uvicorn app.main:app --reload --port 8000
```

The dashboard subscribes to pipeline events at `ws://localhost:8000/events`
(when that wiring lands — see the project root `CLAUDE.md` for status). For
now the front-end runs standalone against mocked data.
