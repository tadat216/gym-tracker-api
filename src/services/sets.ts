import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises_details } from "../db/schema";

export function updateSet(id: number, data: Partial<{ rep_count: number; weight: number }>) {
  return db
    .update(workout_exercises_details)
    .set(data)
    .where(eq(workout_exercises_details.id, id))
    .returning()
    .all()[0];
}

export function deleteSet(id: number) {
  db.delete(workout_exercises_details).where(eq(workout_exercises_details.id, id)).run();
}
