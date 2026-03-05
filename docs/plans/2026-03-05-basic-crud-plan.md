# Implementation Plan: Basic CRUD Endpoints

Date: 2026-03-05
Design doc: docs/plans/2026-03-05-basic-crud-design.md

## Phase 0: Verified API Patterns

### Drizzle ORM (drizzle-orm ^0.45.1 + better-sqlite3)

```typescript
import { db } from "../db/index";
import { eq } from "drizzle-orm";
import { muscle_groups } from "../db/schema";

// SELECT all
db.select().from(muscle_groups).all();

// SELECT one
db.select().from(muscle_groups).where(eq(muscle_groups.id, id)).all(); // returns array, take [0]

// INSERT with returning
const [row] = db.insert(muscle_groups).values({ name, vietnamese_trans, color_hex }).returning().all();

// UPDATE
const [row] = db.update(muscle_groups).set({ name }).where(eq(muscle_groups.id, id)).returning().all();

// DELETE
db.delete(muscle_groups).where(eq(muscle_groups.id, id)).run();
```

Pattern source: `src/db/seed.ts` (insert/returning/all confirmed), Drizzle ORM sqlite-core docs.

### Hono v4 (hono ^4.12.5)

```typescript
import { Hono } from "hono";

const router = new Hono();

// Route handler
router.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  return c.json({ ... });
});

// Middleware
app.use("/*", async (c, next) => {
  // auth check
  await next();
});

// Mount sub-router
app.route("/muscle-groups", muscleGroupsRouter);
```

### Import conventions (CommonJS project)

- `db` from `"../db/index"` (or `"../../db/index"` depending on depth)
- Tables from `"../db/schema"`
- `eq` from `"drizzle-orm"`
- `Hono` from `"hono"`

---

## Phase 1: Project Structure + Auth Middleware

### Tasks

1. Create `src/routes/` directory (by creating first route file)
2. Create `src/middleware/auth.ts` — bearer token check against `process.env.API_KEY`
3. Update `src/index.ts`:
   - Apply auth middleware globally with `app.use("/*", authMiddleware)`
   - Mount all routers

### Files to create/edit

- `src/middleware/auth.ts` (new)
- `src/index.ts` (edit — add middleware + route mounts)

### Auth middleware pattern

```typescript
// src/middleware/auth.ts
import { MiddlewareHandler } from "hono";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const apiKey = process.env.API_KEY;
  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
```

### Verification

- `grep -r "authMiddleware" src/` — confirm imported and used in index.ts
- `grep -r "app.route" src/index.ts` — confirm all routers mounted

---

## Phase 2: Muscle Groups Routes

### File: `src/routes/muscle-groups.ts`

### Endpoints

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | / | `{ name, vietnamese_trans, color_hex }` | 201 on success |
| GET | / | — | Returns array |
| GET | /:id | — | 404 if not found |
| PATCH | /:id | partial `{ name?, vietnamese_trans?, color_hex? }` | 404 if not found |
| DELETE | /:id | — | 204 on success |

### Drizzle patterns to use

- List: `db.select().from(muscle_groups).all()`
- Get: `db.select().from(muscle_groups).where(eq(muscle_groups.id, id)).all()` → check `[0]`
- Create: `db.insert(muscle_groups).values(body).returning().all()`
- Update: `db.update(muscle_groups).set(body).where(eq(muscle_groups.id, id)).returning().all()`
- Delete: `db.delete(muscle_groups).where(eq(muscle_groups.id, id)).run()`

### Verification

- File exists at `src/routes/muscle-groups.ts`
- Router mounted in `src/index.ts` as `app.route("/muscle-groups", muscleGroupsRouter)`

---

## Phase 3: Exercises Routes

### File: `src/routes/exercises.ts`

### Endpoints

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | / | `{ name, vietnamese_trans, muscle_group_id }` | 201 on success |
| GET | / | — | Optional `?muscle_group_id=` query filter |
| GET | /:id | — | 404 if not found |
| PATCH | /:id | partial `{ name?, vietnamese_trans?, muscle_group_id? }` | 404 if not found |
| DELETE | /:id | — | 204 on success |

### Extra pattern: query param filter

```typescript
const muscleGroupId = c.req.query("muscle_group_id");
let query = db.select().from(exercises);
if (muscleGroupId) {
  query = query.where(eq(exercises.muscle_group_id, Number(muscleGroupId)));
}
return c.json(query.all());
```

### Verification

- File exists at `src/routes/exercises.ts`
- Router mounted in `src/index.ts` as `app.route("/exercises", exercisesRouter)`

---

## Phase 4: Workouts Routes

### File: `src/routes/workouts.ts`

### Endpoints

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | / | `{ date }` (ISO string) | 201 on success |
| GET | / | — | Returns array |
| GET | /:id | — | 404 if not found |
| DELETE | /:id | — | 204 on success; cascades to workout_exercises |

No UPDATE — `date` is the only field; delete and recreate if needed.

### Verification

- File exists at `src/routes/workouts.ts`
- Router mounted in `src/index.ts` as `app.route("/workouts", workoutsRouter)`

---

## Phase 5: Workout Exercises + Sets Routes

### Files

- `src/routes/workout-exercises.ts`
- `src/routes/sets.ts`

### Workout exercises endpoints

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | /workouts/:workoutId/exercises | `{ exercise_id }` | 201; validate workoutId exists |
| DELETE | /workout-exercises/:id | — | 204; cascades to sets |

The POST is nested under workouts, so mount it on the workouts router:
```typescript
// in workouts.ts router
workoutsRouter.post("/:workoutId/exercises", ...)
```

The DELETE is on a separate path, so create a separate `workout-exercises` router:
```typescript
app.route("/workout-exercises", workoutExercisesRouter);
```

### Sets endpoints

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | /workout-exercises/:weId/sets | `{ rep_count, weight }` | 201; validate weId exists |
| PATCH | /sets/:id | partial `{ rep_count?, weight? }` | 404 if not found |
| DELETE | /sets/:id | — | 204 on success |

POST is nested under workout-exercises, so mount on workout-exercises router:
```typescript
workoutExercisesRouter.post("/:weId/sets", ...)
```

PATCH and DELETE are on `/sets/:id`, so mount a sets router:
```typescript
app.route("/sets", setsRouter);
```

### Verification

- `grep -r "workout-exercises" src/index.ts` — confirms both routers mounted
- `grep -r "app.route" src/index.ts` — shows all 6 route mounts total

---

## Phase 6: Final Verification

1. Start dev server: `npm run dev`
2. Hit health check: `GET /` → `{ status: "ok" }`
3. Check auth works: request without header → 401
4. Smoke test each resource:
   - `POST /muscle-groups` → 201
   - `GET /muscle-groups` → array
   - `POST /exercises` → 201
   - `GET /exercises?muscle_group_id=1` → filtered array
   - `POST /workouts` → 201
   - `POST /workouts/:id/exercises` → 201
   - `POST /workout-exercises/:id/sets` → 201
   - `PATCH /sets/:id` → updated set
   - `DELETE /sets/:id` → 204

---

## Summary

- 6 files to create: `src/middleware/auth.ts`, `src/routes/muscle-groups.ts`, `src/routes/exercises.ts`, `src/routes/workouts.ts`, `src/routes/workout-exercises.ts`, `src/routes/sets.ts`
- 1 file to edit: `src/index.ts`
- No schema changes, no migrations needed
- No commits until user approves
