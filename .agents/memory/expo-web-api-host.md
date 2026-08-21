---
name: Expo web API host
description: Local Expo web preview and Android emulator use different loopback addresses for the separate Vercel API.
---

The shared local development API URL may use `10.0.2.2` for an Android emulator, but the browser preview cannot reach that emulator-only address. The Expo web runtime should map that specific host to `127.0.0.1`; other configured URLs, including a physical phone's LAN IP or a deployed Vercel URL, must remain unchanged.

**Why:** The login request otherwise hangs in the web preview even though the local Vercel API and database are healthy.

**How to apply:** Keep `EXPO_PUBLIC_API_URL` as the source of truth and apply the host substitution only when `Platform.OS === "web"` and the configured URL contains `10.0.2.2`.