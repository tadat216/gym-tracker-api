import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { muscle_groups } from "../db/schema";

export function listMuscleGroups() {
  return db.select().from(muscle_groups).all();
}

export function getMuscleGroup(id: number) {
  return db.select().from(muscle_groups).where(eq(muscle_groups.id, id)).all()[0];
}

export function createMuscleGroup(data: typeof muscle_groups.$inferInsert) {
  return db.insert(muscle_groups).values(data).returning().all()[0];
}

export function updateMuscleGroup(id: number, data: Partial<typeof muscle_groups.$inferInsert>) {
  return db.update(muscle_groups).set(data).where(eq(muscle_groups.id, id)).returning().all()[0];
}

export function deleteMuscleGroup(id: number) {
  db.delete(muscle_groups).where(eq(muscle_groups.id, id)).run();
}
