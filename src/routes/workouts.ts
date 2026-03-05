import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workouts, workout_exercises } from "../db/schema";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  const [row] = db.insert(workouts).values({ date: body.date }).returning().all();
  return c.json(row, 201);
});

router.get("/", (c) => {
  const rows = db.select().from(workouts).all();
  return c.json(rows);
});

router.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const [row] = db.select().from(workouts).where(eq(workouts.id, id)).all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.delete(workouts).where(eq(workouts.id, id)).run();
  return new Response(null, { status: 204 });
});

router.post("/:workoutId/exercises", async (c) => {
  const workoutId = Number(c.req.param("workoutId"));
  const body = await c.req.json();
  const [row] = db.insert(workout_exercises).values({
    workout_id: workoutId,
    exercise_id: body.exercise_id,
  }).returning().all();
  return c.json(row, 201);
});

export default router;
