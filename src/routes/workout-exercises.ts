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
