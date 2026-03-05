import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { muscle_groups } from "../db/schema";

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json();
  const [row] = db.insert(muscle_groups).values(body).returning().all();
  return c.json(row, 201);
});

router.get("/", (c) => {
  const rows = db.select().from(muscle_groups).all();
  return c.json(rows);
});

router.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const [row] = db.select().from(muscle_groups).where(eq(muscle_groups.id, id)).all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const [row] = db.update(muscle_groups).set(body).where(eq(muscle_groups.id, id)).returning().all();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.delete(muscle_groups).where(eq(muscle_groups.id, id)).run();
  return new Response(null, { status: 204 });
});

export default router;
