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
