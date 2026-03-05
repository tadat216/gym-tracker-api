import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { exercises } from "../db/schema";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  const [row] = db.insert(exercises).values(body).returning().all();
  return c.json(row, 201);
});

router.get("/", (c) => {
  const muscleGroupId = c.req.query("muscle_group_id");
  if (muscleGroupId) {
    const rows = db.select().from(exercises).where(eq(exercises.muscle_group_id, Number(muscleGroupId))).all();
    return c.json(rows);
  }
  const rows = db.select().from(exercises).all();
  return c.json(rows);
});

router.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const [row] = db.select().from(exercises).where(eq(exercises.id, id)).all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const [row] = db.update(exercises).set(body).where(eq(exercises.id, id)).returning().all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.delete(exercises).where(eq(exercises.id, id)).run();
  return new Response(null, { status: 204 });
});

export default router;
