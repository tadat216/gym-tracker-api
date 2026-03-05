# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A personal gym tracker REST API that integrates with Claude AI chat. Claude chat calls this backend as tools to perform CRUD operations, log workout diaries via natural language, and analyze fitness progress. Deployed on Railway (free plan).

## Stack

- **Runtime**: Node.js + TypeScript (CommonJS)
- **Framework**: Hono with `@hono/node-server`
- **ORM**: Drizzle ORM + `better-sqlite3` (SQLite)
- **Dev execution**: `tsx watch`

## Commands

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Compile TypeScript → dist/
npm start         # Run compiled build (production)
npm run seed      # Seed muscle groups and exercises (run once)
npm run generate  # Generate SQL migration after schema changes
npm run migrate   # Apply pending migrations
npx drizzle-kit studio  # Open local DB GUI
```

## Architecture

```
src/
  index.ts        # Hono app entry point
  db/
    index.ts      # SQLite connection (WAL mode, foreign keys ON)
    schema.ts     # All Drizzle table definitions
    seed.ts       # One-time seed for muscle groups + exercises
drizzle/          # Generated SQL migration files
drizzle.config.ts # Drizzle config (schema path, migrations output)
```

### Data Model

```
muscle_groups ──< exercises ──< workout_exercises >── workouts
                                       │
                               workout_exercises_details
                               (rep_count, weight per set)
```

- `muscle_groups`: name (unique), `vietnamese_trans`, `color_hex`
- `exercises`: name, `vietnamese_trans`, FK → `muscle_groups`
- `workouts`: date (text, ISO format)
- `workout_exercises`: join table linking a workout to an exercise
- `workout_exercises_details`: individual sets (reps + weight) per `workout_exercise`

All FK relationships use `onDelete: "cascade"`.

### Key Conventions

**Database**: `db` is exported from `src/db/index.ts` and imported directly in route handlers. No repository layer.

**Schema changes**: Always run `npm run generate` then `npm run migrate` — never edit migration files manually.

**Claude Integration**: Endpoints are called as tools from Claude AI chat. Responses should be flat JSON with enough context for Claude to generate natural-language replies.

**Authentication**: Static API key (`API_KEY` env var) via `Authorization: Bearer <key>` header — to be enforced in middleware.

## Environment Variables

```
PORT=3000
DATABASE_URL=./gym.db   # Use /data/gym.db on Railway with a Volume mount
API_KEY=<secret>
```

## Railway Deployment

- Build command: `npm run build`; Start command: `npm start`
- Attach a Railway Volume at `/data` and set `DATABASE_URL=/data/gym.db` — without a volume, SQLite data resets on every redeploy
- Free plan sleeps after inactivity; first request after sleep will be slow
