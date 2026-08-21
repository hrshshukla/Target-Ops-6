# Target Ops

Target Ops is an Android-focused React Native + Expo app for managing companies, employees, attendance, salary operations, and account summaries.

## IMPORTANT PROJECT RULES

This is a STANDARD React Native + Expo project.

### DO NOT CONVERT THIS PROJECT TO REPLIT ARTIFACT FORMAT.

The existing project structure is the source of truth.

Never:
- Convert the project into Replit Artifact format
- Rebuild the project as an Artifact
- Convert React Native code into a web/HTML application
- Replace Expo Router with a web router
- Replace React Native components with HTML/web components
- Add Vite as the application framework
- Create a Replit-specific frontend architecture
- Rewrite the existing project structure unnecessarily

If the project is imported, reopened, synced, or modified in Replit, preserve the existing standard React Native + Expo structure.

---

## PACKAGE MANAGER — npm ONLY

This project uses **npm exclusively**.

Allowed:

- `npm install`
- `npm start`
- `npm run android`
- `npm run typecheck`
- `npm run build`
- `npm run api:dev`
- `npm run api:typecheck`
- `npx expo ...`

DO NOT use or introduce:

- pnpm
- pnpm-lock.yaml
- pnpm-workspace.yaml
- yarn
- yarn.lock
- bun
- bun.lockb

`package-lock.json` is the only accepted lockfile.

Never regenerate or replace `package.json` with a pnpm/workspace configuration.

---

## Run & Operate

- `npm install` — install dependencies
- `npm start` — start the Expo development server
- `npm run android` — start Expo for Android
- `npm run typecheck` — typecheck the mobile client
- `npm run build` — export the Android Expo bundle
- `npm run api:dev` — run the API locally when needed
- `npm run api:typecheck` — typecheck the API

For local development, run the Expo app and Vercel API as separate processes:

```text
Expo preview: npx expo start --web --port 8081
Local API:    npm run api:dev
API base URL: EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

The default URL above is for an Android emulator. For a physical Android phone,
set `EXPO_PUBLIC_API_URL` to the PC's local network IP, for example
`http://192.168.1.20:5000`; do not use `localhost`. The API uses the existing
remote PostgreSQL database through the server-only `DATABASE_URL`.

For a remote API:

```text
EXPO_PUBLIC_API_URL=https://your-api.vercel.app