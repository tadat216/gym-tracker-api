import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises, workout_exercises_details } from "../db/schema";

const router = new Hono();

router.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.delete(workout_exercises).where(eq(workout_exercises.id, id)).run();
  return new Response(null, { status: 204 });
});

router.post("/:weId/sets", async (c) => {
  const weId = Number(c.req.param("weId"));
  const body = await c.req.json();
  const [row] = db.insert(workout_exercises_details).values({
    workout_exercise_id: weId,
    rep_count: body.rep_count,
    weight: body.weight,
  }).returning().all();
  return c.json(row, 201);
});

export default router;
