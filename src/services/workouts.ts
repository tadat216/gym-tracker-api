import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { workouts, workout_exercises, workout_exercises_details } from "../db/schema";

export function listWorkouts() {
  return db.select().from(workouts).all();
}

export function getWorkout(id: number) {
  return db.select().from(workouts).where(eq(workouts.id, id)).all()[0];
}

export function createWorkout(date: string) {
  return db.insert(workouts).values({ date }).returning().all()[0];
}

export function deleteWorkout(id: number) {
  db.delete(workouts).where(eq(workouts.id, id)).run();
}

export function addExerciseToWorkout(workoutId: number, exerciseId: number) {
  return db
    .insert(workout_exercises)
    .values({ workout_id: workoutId, exercise_id: exerciseId })
    .returning()
    .all()[0];
}

export function getWorkoutDetail(workoutId: number) {
  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).all()[0];
  if (!workout) return undefined;
  const wes = db
    .select()
    .from(workout_exercises)
    .where(eq(workout_exercises.workout_id, workoutId))
    .all();
  const exercises = wes.map((we) => ({
    ...we,
    sets: db
      .select()
      .from(workout_exercises_details)
      .where(eq(workout_exercises_details.workout_exercise_id, we.id))
      .all(),
  }));
  return { ...workout, exercises };
}
