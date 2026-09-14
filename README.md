# OpsFlow Web

Vue 3 SPA for OpsFlow (`opsflow-web`).

## Stack

- Vue 3 + TypeScript
- Pinia
- Vue Router
- Axios (Sanctum SPA cookies)
- Tailwind CSS (`@tailwindcss/vite`)

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

Default Vite URL: `http://localhost:5173`  
Default API URL: `http://localhost:8000` (`VITE_API_BASE_URL`)

## Scripts

- `npm run dev` — development server
- `npm run type-check` — `vue-tsc`
- `npm run build` — type-check + production build
- `npm run preview` — preview production build
- `npm run test` — Vitest

## Deploy on Vercel

Vite bakes `VITE_*` into the client at **build** time. Changing env vars in Vercel does nothing until you **redeploy**.

### Project settings

| Setting | Value |
| ------- | ----- |
| Root Directory | repository root of `opsflow-web` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | **22.x** (see `.nvmrc` / `package.json` `engines`) |
| Production Branch | `main` (or `staging` if that is the connected branch) |

SPA history mode is handled by `vercel.json` (all routes rewrite to `index.html`).

### Environment variables

Set these for **Production** and **Preview** (not only Development):

| Name | Value |
| ---- | ----- |
| `VITE_API_BASE_URL` | The **SPA origin** in production, e.g. `https://myopsflow.vercel.app` |
| `VITE_APP_NAME` | `OpsFlow` |

Do **not** append `/api`. Do **not** use the Render URL here. `vercel.json` proxies `/api`, `/sanctum`, and `/storage` to Render so Sanctum cookies stay first-party.

Copy `.env.production.example` locally if you run `npm run build` on your machine. Do not commit `.env.production`.

### Redeploy (existing project)

1. Push the latest `opsflow-web` commit (including `vercel.json`) to the branch Vercel is connected to.
2. In Vercel → the **opsflow-web** project → **Settings → Environment Variables**, set `VITE_API_BASE_URL` to `https://myopsflow.vercel.app`.
3. **Settings → General → Node.js Version** → `22.x`.
4. Open **Deployments** → ⋮ on the latest deployment → **Redeploy**. Uncheck “Use existing Build Cache” so Vite picks up the new env vars.
5. After the deploy, open the SPA URL, then hard-refresh. Confirm in DevTools → Network that login goes to `https://myopsflow.vercel.app/api/v1/auth/login` (same origin as the SPA), not `onrender.com`.

### Redeploy from CLI

```sh
cd opsflow-web
npx vercel --prod
```

CLI deploys still need `VITE_API_BASE_URL` set in the Vercel project (or passed as env). Prefer git + dashboard Redeploy so Production and Preview stay in sync.

### Login cookies

Production login uses a same-origin proxy (`vercel.json` → Render). Keep `VITE_API_BASE_URL` on the Vercel SPA host so Axios can read the `XSRF-TOKEN` cookie. Local `npm run dev` still uses `http://localhost:8000`.
