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

## Status

- ✅ Milestone 8 — Frontend Foundation (auth shell, layouts, shared UI)
- ✅ Phase 9.1 — Dashboard UI (`/dashboard`, `GET /api/v1/dashboard`)
- 📋 Next — Phase 9.2 User Management (awaiting approval)
