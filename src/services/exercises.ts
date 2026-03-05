import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { exercises } from "../db/schema";

export function listExercises(muscleGroupId?: number) {
  if (muscleGroupId !== undefined) {
    return db.select().from(exercises).where(eq(exercises.muscle_group_id, muscleGroupId)).all();
  }
  return db.select().from(exercises).all();
}

export function getExercise(id: number) {
  return db.select().from(exercises).where(eq(exercises.id, id)).all()[0];
}

export function createExercise(data: typeof exercises.$inferInsert) {
  return db.insert(exercises).values(data).returning().all()[0];
}

export function updateExercise(id: number, data: Partial<typeof exercises.$inferInsert>) {
  return db.update(exercises).set(data).where(eq(exercises.id, id)).returning().all()[0];
}

export function deleteExercise(id: number) {
  db.delete(exercises).where(eq(exercises.id, id)).run();
}
