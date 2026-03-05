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
