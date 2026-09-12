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
| `VITE_API_BASE_URL` | Public **origin** of the Laravel API, e.g. `https://opsflow-api.vercel.app` |
| `VITE_APP_NAME` | `OpsFlow` |

Do **not** append `/api`. Axios already requests `/api/v1/...` and `/sanctum/csrf-cookie`.

Copy `.env.production.example` locally if you run `npm run build` on your machine. Do not commit `.env.production`.

### Redeploy (existing project)

1. Push the latest `opsflow-web` commit (including `vercel.json`) to the branch Vercel is connected to.
2. In Vercel → the **opsflow-web** project → **Settings → Environment Variables**, set `VITE_API_BASE_URL` to the live API origin (no `/api`).
3. **Settings → General → Node.js Version** → `22.x`.
4. Open **Deployments** → ⋮ on the latest deployment → **Redeploy**. Uncheck “Use existing Build Cache” so Vite picks up the new env vars.
5. After the deploy, open the SPA URL, then hard-refresh. Confirm in DevTools → Network that calls go to `https://<api-host>/api/v1/health` (or `/api/v1/auth/login`), not `/api/api/v1/...`.

### Redeploy from CLI

```sh
cd opsflow-web
npx vercel --prod
```

CLI deploys still need `VITE_API_BASE_URL` set in the Vercel project (or passed as env). Prefer git + dashboard Redeploy so Production and Preview stay in sync.

### Login cookies

The SPA and API are different origins on `*.vercel.app`. Sanctum cookies will not work with default `SameSite=lax` until you put both apps on one parent domain (or proxy `/api` and `/sanctum` through this Vercel project). Routing and the API URL can be verified before that; login may still fail until cookies are configured on the API.
