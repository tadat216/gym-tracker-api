# Project Memory: gym-tracker-api

## Project Overview
Personal gym tracker REST API. Claude AI chat calls this backend as tools to:
- CRUD workouts, exercises, sets
- Log diary entries via natural language
- Analyze fitness progress

Deployed on Railway free plan.

## Stack
- Hono + @hono/node-server
- Drizzle ORM + better-sqlite3 (SQLite)
- TypeScript (CommonJS)
- No test framework yet (add Vitest when needed)

## Key Decisions
- SQLite requires Railway Volume at `/data` (mount path) to persist data
- Auth via static API_KEY in `Authorization: Bearer` header
- Responses should be flat JSON friendly for Claude to parse

## Status
- Project initialized (package.json + node_modules only)
- No source code yet — CLAUDE.md created with intended architecture
