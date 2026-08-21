# Target Ops

Android-focused React Native + Expo app for internal company, employee, attendance, and salary operations.

## Deployment architecture

- **Android app:** Expo/React Native TypeScript built with EAS into an APK/AAB.
- **API:** The `api/` directory is deployed to Vercel as Node.js serverless functions.
- **Database:** Remote PostgreSQL, accessed only from the API.
- **Client configuration:** Only `EXPO_PUBLIC_API_URL` may be included in the Expo bundle.

The Android app is not deployed to Vercel and never connects directly to PostgreSQL.

EAS profiles are provided for internal distribution (`preview`, APK) and
production distribution (`production`, AAB):

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

## Quick start

```bash
npm install
npx expo start
npx expo start --android
```

The mobile client lives in `app/`, `components/`, `context/`, `hooks/`, `services/`, and `api-client/`.
The separate server/API source lives in `server/`; its only Vercel entrypoint is
`api/[...route].ts`. The catch-all delegates to internal router modules, so all
API endpoints are deployed as one serverless function.

## Useful commands

```bash
npm run typecheck
npm run build
npm run api:typecheck
```

Set `EXPO_PUBLIC_API_URL` to the deployed Vercel API base URL.

For Vercel, configure `DATABASE_URL` as a server-only environment variable. Do not
prefix it or any other server secret with `EXPO_PUBLIC_`. The Vercel deployment
uses only `api/[...route].ts` as its serverless function.

### Deployment split

**Deployed to Vercel**

- `server/lib/`
- `server/routes/`
- `server/db/`
- `api/[...route].ts`
- supporting files under `server/`

**Bundled into the Android app**

- `app/`, `components/`, `context/`, `hooks/`, `services/`, and `api-client/`
- Expo configuration and assets

The mobile bundle must contain only the public API URL. `DATABASE_URL`,
`SESSION_SECRET`, `JWT_SECRET`, and other server-only values belong in Vercel.