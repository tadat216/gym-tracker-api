# Service Layer Design

**Date:** 2026-03-05
**Goal:** Extract DB logic from routes and MCP tools into plain service functions, eliminating duplication.

## Approach

Plain named functions in `src/services/`, one file per resource. No classes, no factories. Routes and MCP tools import and call service functions — neither touches `db` directly.

## New Structure

```
src/
  services/
    muscle-groups.ts
    exercises.ts
    workouts.ts
    workout-exercises.ts
    sets.ts
  routes/          (unchanged files, just thinner — no db imports)
  routes/mcp.ts    (no db imports)
```

## Service Signatures

```typescript
// services/muscle-groups.ts
listMuscleGroups()                         → row[]
getMuscleGroup(id: number)                 → row | undefined
createMuscleGroup(data)                    → row
updateMuscleGroup(id: number, data)        → row | undefined
deleteMuscleGroup(id: number)              → void

// services/exercises.ts
listExercises(muscleGroupId?: number)      → row[]
getExercise(id: number)                    → row | undefined
createExercise(data)                       → row
updateExercise(id: number, data)           → row | undefined
deleteExercise(id: number)                 → void

// services/workouts.ts
listWorkouts()                             → row[]
getWorkout(id: number)                     → row | undefined
createWorkout(date: string)                → row
deleteWorkout(id: number)                  → void
addExerciseToWorkout(workoutId, exerciseId) → row
getWorkoutDetail(workoutId: number)        → { ...workout, exercises: [{ ...we, sets: [] }] } | undefined

// services/workout-exercises.ts
deleteWorkoutExercise(id: number)          → void
addSet(workoutExerciseId, repCount, weight) → row

// services/sets.ts
updateSet(id: number, data)                → row | undefined
deleteSet(id: number)                      → void
```

## Route Shape After Refactor

Routes only handle HTTP: parse params/body, call service, return response. Example:

```typescript
router.get("/", (c) => c.json(listMuscleGroups()));
router.get("/:id", (c) => {
  const row = getMuscleGroup(Number(c.req.param("id")));
  return row ? c.json(row) : c.json({ error: "Not found" }, 404);
});
```

## MCP Shape After Refactor

MCP tools import service functions instead of querying `db` directly. Example:

```typescript
async ({ muscle_group_id }) => {
  const rows = listExercises(muscle_group_id);
  return { content: [{ type: "text", text: JSON.stringify(rows) }] };
}
```

## Notable Consolidation

`getWorkoutDetail` currently only exists as inline logic inside `mcp.ts`. After this refactor it lives in `services/workouts.ts` and is available to both REST and MCP.
