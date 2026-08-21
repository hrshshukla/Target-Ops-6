---
name: Neon database setup
description: External PostgreSQL setup needed by the Target Ops API
---

The API expects its existing relational schema to already exist in the remote PostgreSQL database; a newly provisioned Neon database starts empty and must receive those tables before login can seed data.

**Why:** The API intentionally uses the remote database and does not run schema creation automatically at request time.

**How to apply:** When switching to a new external database, apply the current project schema first, then verify login and read APIs.