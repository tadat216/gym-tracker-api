import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workout_exercises, workout_exercises_details } from "../db/schema";

export function deleteWorkoutExercise(id: number) {
  db.delete(workout_exercises).where(eq(workout_exercises.id, id)).run();
}

export function addSet(workoutExerciseId: number, repCount: number, weight: number) {
  return db
    .insert(workout_exercises_details)
    .values({ workout_exercise_id: workoutExerciseId, rep_count: repCount, weight })
    .returning()
    .all()[0];
}
