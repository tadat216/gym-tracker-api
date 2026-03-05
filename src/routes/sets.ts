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
