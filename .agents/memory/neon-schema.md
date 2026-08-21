---
name: Neon database setup
description: External PostgreSQL setup needed by the Target Ops API
---

The API now initializes its required relational tables before login seeding; a newly provisioned external PostgreSQL database can still need a first authenticated request to complete initialization.

**Why:** An empty database caused login to fail before upload authentication could run, so startup/request initialization must precede seed inserts.

**How to apply:** When switching databases, verify `/api/health`, then log in once and confirm the settings/upload auth route responds before testing uploads.