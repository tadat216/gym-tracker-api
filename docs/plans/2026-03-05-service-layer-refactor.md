# Service Layer Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract all DB logic from routes and the MCP file into plain service functions so routes/mcp.ts contain zero `db` calls.

**Architecture:** Create `src/services/` with one file per resource. Each file exports named functions wrapping Drizzle queries. Routes parse HTTP concerns (params, body, status codes) and delegate to services. MCP tools do the same. No classes, no DI, no abstraction beyond named functions.

**Tech Stack:** Hono, Drizzle ORM, better-sqlite3, TypeScript (existing — no new deps)

---

### Task 1: Create services/muscle-groups.ts and slim the route

**Files:**
- Create: `src/services/muscle-groups.ts`
- Modify: `src/routes/muscle-groups.ts`

**Step 1: Create `src/services/muscle-groups.ts`**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { muscle_groups } from "../db/schema";

export function listMuscleGroups() {
  return db.select().from(muscle_groups).all();
}

export function getMuscleGroup(id: number) {
  return db.select().from(muscle_groups).where(eq(muscle_groups.id, id)).all()[0];
}

export function createMuscleGroup(data: typeof muscle_groups.$inferInsert) {
  return db.insert(muscle_groups).values(data).returning().all()[0];
}

export function updateMuscleGroup(id: number, data: Partial<typeof muscle_groups.$inferInsert>) {
  return db.update(muscle_groups).set(data).where(eq(muscle_groups.id, id)).returning().all()[0];
}

export function deleteMuscleGroup(id: number) {
  db.delete(muscle_groups).where(eq(muscle_groups.id, id)).run();
}
```

**Step 2: Replace `src/routes/muscle-groups.ts` with the slim version**

```typescript
import { Hono } from "hono";
import {
  listMuscleGroups,
  getMuscleGroup,
  createMuscleGroup,
  updateMuscleGroup,
  deleteMuscleGroup,
} from "../services/muscle-groups";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  return c.json(createMuscleGroup(body), 201);
});

router.get("/", (c) => c.json(listMuscleGroups()));

router.get("/:id", (c) => {
  const row = getMuscleGroup(Number(c.req.param("id")));
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.patch("/:id", async (c) => {
  const row = updateMuscleGroup(Number(c.req.param("id")), await c.req.json());
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.delete("/:id", (c) => {
  deleteMuscleGroup(Number(c.req.param("id")));
  return new Response(null, { status: 204 });
});

export default router;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

**Step 4: Commit**

```bash
git add src/services/muscle-groups.ts src/routes/muscle-groups.ts
git commit -m "refactor: extract muscle-groups service"
```

---

### Task 2: Create services/exercises.ts and slim the route

**Files:**
- Create: `src/services/exercises.ts`
- Modify: `src/routes/exercises.ts`

**Step 1: Create `src/services/exercises.ts`**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { exercises } from "../db/schema";

export function listExercises(muscleGroupId?: number) {
  if (muscleGroupId !== undefined) {
    return db.select().from(exercises).where(eq(exercises.muscle_group_id, muscleGroupId)).all();
  }
  return db.select().from(exercises).all();
}

export function getExercise(id: number) {
  return db.select().from(exercises).where(eq(exercises.id, id)).all()[0];
}

export function createExercise(data: typeof exercises.$inferInsert) {
  return db.insert(exercises).values(data).returning().all()[0];
}

export function updateExercise(id: number, data: Partial<typeof exercises.$inferInsert>) {
  return db.update(exercises).set(data).where(eq(exercises.id, id)).returning().all()[0];
}

export function deleteExercise(id: number) {
  db.delete(exercises).where(eq(exercises.id, id)).run();
}
```

**Step 2: Replace `src/routes/exercises.ts` with the slim version**

```typescript
import { Hono } from "hono";
import {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../services/exercises";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  return c.json(createExercise(body), 201);
});

router.get("/", (c) => {
  const muscleGroupId = c.req.query("muscle_group_id");
  return c.json(listExercises(muscleGroupId ? Number(muscleGroupId) : undefined));
});

router.get("/:id", (c) => {
  const row = getExercise(Number(c.req.param("id")));
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.patch("/:id", async (c) => {
  const row = updateExercise(Number(c.req.param("id")), await c.req.json());
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.delete("/:id", (c) => {
  deleteExercise(Number(c.req.param("id")));
  return new Response(null, { status: 204 });
});

export default router;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

**Step 4: Commit**

```bash
git add src/services/exercises.ts src/routes/exercises.ts
git commit -m "refactor: extract exercises service"
```

---

### Task 3: Create services/workouts.ts and slim the route

**Files:**
- Create: `src/services/workouts.ts`
- Modify: `src/routes/workouts.ts`

**Step 1: Create `src/services/workouts.ts`**

Note: `getWorkoutDetail` is extracted from the current inline logic in `src/routes/mcp.ts` — this is the key consolidation.

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workouts, workout_exercises, workout_exercises_details } from "../db/schema";

export function listWorkouts() {
  return db.select().from(workouts).all();
}

export function getWorkout(id: number) {
  return db.select().from(workouts).where(eq(workouts.id, id)).all()[0];
}

export function createWorkout(date: string) {
  return db.insert(workouts).values({ date }).returning().all()[0];
}

export function deleteWorkout(id: number) {
  db.delete(workouts).where(eq(workouts.id, id)).run();
}

export function addExerciseToWorkout(workoutId: number, exerciseId: number) {
  return db
    .insert(workout_exercises)
    .values({ workout_id: workoutId, exercise_id: exerciseId })
    .returning()
    .all()[0];
}

export function getWorkoutDetail(workoutId: number) {
  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).all()[0];
  if (!workout) return undefined;
  const wes = db
    .select()
    .from(workout_exercises)
    .where(eq(workout_exercises.workout_id, workoutId))
    .all();
  const exercises = wes.map((we) => ({
    ...we,
    sets: db
      .select()
      .from(workout_exercises_details)
      .where(eq(workout_exercises_details.workout_exercise_id, we.id))
      .all(),
  }));
  return { ...workout, exercises };
}
```

**Step 2: Replace `src/routes/workouts.ts` with the slim version**

```typescript
import { Hono } from "hono";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  addExerciseToWorkout,
} from "../services/workouts";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  return c.json(createWorkout(body.date), 201);
});

router.get("/", (c) => c.json(listWorkouts()));

router.get("/:id", (c) => {
  const row = getWorkout(Number(c.req.param("id")));
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.delete("/:id", (c) => {
  deleteWorkout(Number(c.req.param("id")));
  return new Response(null, { status: 204 });
});

router.post("/:workoutId/exercises", async (c) => {
  const body = await c.req.json();
  const row = addExerciseToWorkout(Number(c.req.param("workoutId")), body.exercise_id);
  return c.json(row, 201);
});

export default router;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

**Step 4: Commit**

```bash
git add src/services/workouts.ts src/routes/workouts.ts
git commit -m "refactor: extract workouts service"
```

---

### Task 4: Create services/workout-exercises.ts and slim the route

**Files:**
- Create: `src/services/workout-exercises.ts`
- Modify: `src/routes/workout-exercises.ts`

**Step 1: Create `src/services/workout-exercises.ts`**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises, workout_exercises_details } from "../db/schema";

export function deleteWorkoutExercise(id: number) {
  db.delete(workout_exercises).where(eq(workout_exercises.id, id)).run();
}

export function addSet(workoutExerciseId: number, repCount: number, weight: number) {
  return db
    .insert(workout_exercises_details)
    .values({ workout_exercise_id: workoutExerciseId, rep_count: repCount, weight })
    .returning()
    .all()[0];
}
```

**Step 2: Replace `src/routes/workout-exercises.ts` with the slim version**

```typescript
import { Hono } from "hono";
import { deleteWorkoutExercise, addSet } from "../services/workout-exercises";

const router = new Hono();

router.delete("/:id", (c) => {
  deleteWorkoutExercise(Number(c.req.param("id")));
  return new Response(null, { status: 204 });
});

router.post("/:weId/sets", async (c) => {
  const body = await c.req.json();
  const row = addSet(Number(c.req.param("weId")), body.rep_count, body.weight);
  return c.json(row, 201);
});

export default router;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

**Step 4: Commit**

```bash
git add src/services/workout-exercises.ts src/routes/workout-exercises.ts
git commit -m "refactor: extract workout-exercises service"
```

---

### Task 5: Create services/sets.ts and slim the route

**Files:**
- Create: `src/services/sets.ts`
- Modify: `src/routes/sets.ts`

**Step 1: Create `src/services/sets.ts`**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises_details } from "../db/schema";

export function updateSet(id: number, data: Partial<{ rep_count: number; weight: number }>) {
  return db
    .update(workout_exercises_details)
    .set(data)
    .where(eq(workout_exercises_details.id, id))
    .returning()
    .all()[0];
}

export function deleteSet(id: number) {
  db.delete(workout_exercises_details).where(eq(workout_exercises_details.id, id)).run();
}
```

**Step 2: Replace `src/routes/sets.ts` with the slim version**

```typescript
import { Hono } from "hono";
import { updateSet, deleteSet } from "../services/sets";

const router = new Hono();

router.patch("/:id", async (c) => {
  const row = updateSet(Number(c.req.param("id")), await c.req.json());
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});

router.delete("/:id", (c) => {
  deleteSet(Number(c.req.param("id")));
  return new Response(null, { status: 204 });
});

export default router;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

**Step 4: Commit**

```bash
git add src/services/sets.ts src/routes/sets.ts
git commit -m "refactor: extract sets service"
```

---

### Task 6: Replace all DB logic in mcp.ts with service calls

**Files:**
- Modify: `src/routes/mcp.ts`

Replace the entire file contents. All `db`, `eq`, and schema imports are removed. Each tool calls a service function instead.

**Step 1: Replace `src/routes/mcp.ts`**

```typescript
import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { z } from "zod";
import { listMuscleGroups } from "../services/muscle-groups";
import { listExercises } from "../services/exercises";
import {
  listWorkouts,
  createWorkout,
  getWorkoutDetail,
  addExerciseToWorkout,
} from "../services/workouts";
import { addSet } from "../services/workout-exercises";
import { updateSet, deleteSet } from "../services/sets";

const router = new Hono();

const mcpServer = new McpServer({
  name: "gym-tracker",
  version: "1.0.0",
});

mcpServer.registerTool(
  "list_muscle_groups",
  {
    description: "List all available muscle groups",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = listMuscleGroups();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "list_exercises",
  {
    description:
      "List exercises. Optionally filter by muscle_group_id. Returns id, name, vietnamese_trans, muscle_group_id.",
    inputSchema: z.object({
      muscle_group_id: z
        .number()
        .optional()
        .describe("Filter by muscle group ID"),
    }),
  },
  async ({ muscle_group_id }) => {
    const rows = listExercises(muscle_group_id);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "list_workouts",
  {
    description: "List all workouts ordered by most recent. Returns id and date.",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = listWorkouts();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "get_workout_detail",
  {
    description:
      "Get a workout with all its exercises and sets. Use this to review a logged workout.",
    inputSchema: z.object({
      workout_id: z.number().describe("The workout ID"),
    }),
  },
  async ({ workout_id }) => {
    const detail = getWorkoutDetail(workout_id);
    if (!detail) return { content: [{ type: "text", text: "Workout not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(detail) }] };
  }
);

mcpServer.registerTool(
  "create_workout",
  {
    description: "Create a new workout session for a given date.",
    inputSchema: z.object({
      date: z.string().describe("ISO date string, e.g. 2026-03-05"),
    }),
  },
  async ({ date }) => {
    const row = createWorkout(date);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "add_exercise_to_workout",
  {
    description:
      "Add an exercise to a workout. Returns a workout_exercise id needed to log sets.",
    inputSchema: z.object({
      workout_id: z.number().describe("The workout ID"),
      exercise_id: z.number().describe("The exercise ID"),
    }),
  },
  async ({ workout_id, exercise_id }) => {
    const row = addExerciseToWorkout(workout_id, exercise_id);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "log_set",
  {
    description:
      "Log a single set (reps + weight) for a workout exercise. Call once per set.",
    inputSchema: z.object({
      workout_exercise_id: z
        .number()
        .describe("The workout_exercise ID from add_exercise_to_workout"),
      rep_count: z.number().describe("Number of reps"),
      weight: z.number().describe("Weight in kg"),
    }),
  },
  async ({ workout_exercise_id, rep_count, weight }) => {
    const row = addSet(workout_exercise_id, rep_count, weight);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "update_set",
  {
    description: "Correct a set's rep count or weight.",
    inputSchema: z.object({
      set_id: z.number().describe("The set ID to update"),
      rep_count: z.number().optional(),
      weight: z.number().optional(),
    }),
  },
  async ({ set_id, rep_count, weight }) => {
    const data: Partial<{ rep_count: number; weight: number }> = {};
    if (rep_count !== undefined) data.rep_count = rep_count;
    if (weight !== undefined) data.weight = weight;
    const row = updateSet(set_id, data);
    if (!row) return { content: [{ type: "text", text: "Set not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "delete_set",
  {
    description: "Delete a logged set.",
    inputSchema: z.object({
      set_id: z.number().describe("The set ID to delete"),
    }),
  },
  async ({ set_id }) => {
    deleteSet(set_id);
    return { content: [{ type: "text", text: "Deleted" }] };
  }
);

const transport = new StreamableHTTPTransport();

router.all("/", async (c) => {
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }
  return transport.handleRequest(c);
});

export default router;
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

**Step 3: Smoke-test the MCP endpoint**

```bash
npm run dev &
sleep 3
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
kill %1
```

Expected: SSE response listing all 9 tools.

**Step 4: Commit**

```bash
git add src/routes/mcp.ts
git commit -m "refactor: replace inline db calls in mcp.ts with service imports"
```
