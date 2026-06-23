# ADR 0003: Static JSON boycott registry

## Status

Accepted

## Context

Boycott and “good company” lists change with activism datasets, not per-user.

## Decision

Ship `evil-companies.json`, `good-companies.json`, `brand-aliases.json` in `public/`; fetch at runtime. Products live in DB/Turso only.

## Consequences

List updates require deploy; alias map centralizes brand resolution.
