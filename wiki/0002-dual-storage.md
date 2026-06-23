# ADR 0002: IndexedDB dev vs Turso production

## Status

Accepted

## Context

~356K+ product rows too heavy for casual IndexedDB dev on every machine; production needs cloud SQL.

## Decision

`dataService` switches on `VITE_TURSO_*` env vars: Dexie locally, libSQL/Turso in production.

## Consequences

Two code paths to test; import scripts required for Turso seed.
