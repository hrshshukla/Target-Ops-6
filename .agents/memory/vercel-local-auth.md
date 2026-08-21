---
name: Local Vercel development authentication
description: Environment constraint for starting the project's local Vercel API workflow
---

The local Vercel CLI can run without account authentication when the API workflow uses local mode and an API-only build configuration.

**Why:** The imported project is not linked to a Vercel project, and the Expo package `build` script otherwise makes `vercel dev` treat the project as a static app.

**How to apply:** Use `vercel dev --local --listen 0.0.0.0:5000`, with a no-op `buildCommand`, `outputDirectory: "."`, and serverless functions under `api/`. Bind to all interfaces when testing from a physical phone. Do not require a Vercel login for local development.