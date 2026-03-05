import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises_details } from "../db/schema";

const router = new Hono();

router.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const [row] = db.update(workout_exercises_details).set(body).where(eq(workout_exercises_details.id, id)).returning().all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.delete(workout_exercises_details).where(eq(workout_exercises_details.id, id)).run();
  return new Response(null, { status: 204 });
});

export default router;
