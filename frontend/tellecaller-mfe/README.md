# tellecaller-mfe

Telecalling frontend as its own Angular app on **http://localhost:4205**.
No shell, no login page, no backend, no federation.

## Run
```
npm install
npm start      # http://localhost:4205
```
Routes: `/telecalling`, `/calls`, `/follow-ups`, `/qualification`, `/outcomes`.

## Auth
The main app (4200) owns login. This app reads the session it leaves behind
(`markops_token` cookie / `markops_user`). With no session it redirects to the login URL
(default `/login`; set `window.__TELLECALLER_MFE__ = { hostLoginUrl: 'http://localhost:4200/login' }` before bootstrap to change it).

## Linking from the main app (4200)
Open or embed `http://localhost:4205/telecalling` (link, or `<iframe>`).

`proxy.conf.json` (dev only) forwards /api, /uploads, /socket.io to the backend running elsewhere.
