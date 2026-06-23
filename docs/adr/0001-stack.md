# ADR 0001: Production app in `app/` subdirectory

## Status

Accepted

## Context

Repo grew scraping scripts, protest HTML, and a React SPA. Root `src/` became a stale duplicate.

## Decision

Deploy and develop from **`app/`** only. Vercel root directory = `app`.

## Consequences

Root `package.json` / `src/` may lag; document clearly in ARCHITECTURE.md.
