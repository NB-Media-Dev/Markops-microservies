# digital-mfe

Frontend-only micro-frontend for the MarkOps **Digital Marketing** module (Angular 22).
No backend code, database, Prisma, migrations, Docker or server deployment config is included.

## Routes
`/campaigns` (default), `/ads`, `/ad-metrics`, `/leads`, `/lead-source`, `/notifications`, `/downloads`, `/login`

## Structure
- `src/app/features/` – campaigns, ads, leads, notifications, downloads, auth/login
- `src/app/core/` – layout shell, guards, interceptor, models, utils, HTTP client services
- `public/` – static assets

## Run
```
npm install
npm start        # http://localhost:4200
```
The app talks to an external backend over HTTP (client-side service calls only). Point it at one via
`proxy.conf.json` (dev) or `localStorage.markops_backend_url` / `window.__API_URL__`.

Not build-tested in the creation environment (no npm registry access) – run `npm install && npm run build` once.

## Access flow
- Only `ADMINISTRATOR` and `DIGITAL_MARKETING` can enter (`ROLE_DEFAULT_ROUTES` in `auth.service.ts`). Other roles are signed out with a clear message instead of looping between guarded routes.
- After login: `returnUrl` is honoured (same-origin paths only), otherwise the role's landing page (Admin → `/campaigns`, Digital Marketing → `/leads`).
- Notification clicks that point at pages from other modules fall back to `/notifications`.
