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
