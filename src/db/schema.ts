import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const muscle_groups = sqliteTable("muscle_groups", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  vietnamese_trans: text("vietnamese_trans").notNull(),
  color_hex: text("color_hex").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  vietnamese_trans: text("vietnamese_trans").notNull(),
  muscle_group_id: int("muscle_group_id")
    .notNull()
    .references(() => muscle_groups.id, { onDelete: "cascade" }),
});

export const workouts = sqliteTable("workouts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
});

export const workout_exercises = sqliteTable("workout_exercises", {
  id: int("id").primaryKey({ autoIncrement: true }),
  workout_id: int("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exercise_id: int("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
});

export const workout_exercises_details = sqliteTable(
  "workout_exercises_details",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    workout_exercise_id: int("workout_exercise_id")
      .notNull()
      .references(() => workout_exercises.id, { onDelete: "cascade" }),
    rep_count: int("rep_count").notNull(),
    weight: int("weight").notNull(),
  },
);
