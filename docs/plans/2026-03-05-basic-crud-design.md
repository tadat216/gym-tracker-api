# Basic CRUD API Design

Date: 2026-03-05

## Overview

16 REST endpoints covering full CRUD for muscle groups and exercises, and targeted operations for workouts, workout exercises, and sets. Responses are flat JSON. No nested payloads in basic endpoints.

## Endpoints

### Muscle Groups

| Method | Path | Description |
|--------|------|-------------|
| POST | /muscle-groups | Create a muscle group |
| GET | /muscle-groups | List all muscle groups |
| GET | /muscle-groups/:id | Get one muscle group |
| PATCH | /muscle-groups/:id | Update name/vietnamese_trans/color_hex |
| DELETE | /muscle-groups/:id | Delete (cascades to exercises) |

### Exercises

| Method | Path | Description |
|--------|------|-------------|
| POST | /exercises | Create an exercise |
| GET | /exercises | List all exercises (optional ?muscle_group_id= filter) |
| GET | /exercises/:id | Get one exercise |
| PATCH | /exercises/:id | Update name/vietnamese_trans/muscle_group_id |
| DELETE | /exercises/:id | Delete (cascades to workout_exercises) |

### Workouts

| Method | Path | Description |
|--------|------|-------------|
| POST | /workouts | Create a workout (body: { date }) |
| GET | /workouts | List all workouts |
| GET | /workouts/:id | Get one workout (flat: id, date) |
| DELETE | /workouts/:id | Delete (cascades to workout_exercises) |

No UPDATE for workouts — only field is `date`, delete and recreate if needed.

### Workout Exercises (junction)

| Method | Path | Description |
|--------|------|-------------|
| POST | /workouts/:workoutId/exercises | Add an exercise to a workout (body: { exercise_id }) |
| DELETE | /workout-exercises/:id | Remove an exercise from a workout |

No UPDATE — just delete and re-add.

### Sets (workout_exercises_details)

| Method | Path | Description |
|--------|------|-------------|
| POST | /workout-exercises/:weId/sets | Add a set (body: { rep_count, weight }) |
| PATCH | /sets/:id | Update a set's rep_count and/or weight |
| DELETE | /sets/:id | Delete a set |

## Conventions

- All routes return flat JSON objects or arrays
- Error responses: `{ error: "message" }` with appropriate HTTP status
- Auth: `Authorization: Bearer <API_KEY>` middleware on all routes (env: API_KEY)
- Routes organized into separate files under `src/routes/`
- `db` imported directly in route handlers from `src/db/index.ts`
