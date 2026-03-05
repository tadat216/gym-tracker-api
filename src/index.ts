import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";
import muscleGroupsRouter from "./routes/muscle-groups";
import exercisesRouter from "./routes/exercises";
import workoutsRouter from "./routes/workouts";
import workoutExercisesRouter from "./routes/workout-exercises";
import setsRouter from "./routes/sets";
import mcpRouter from "./routes/mcp";

const app = new Hono();

app.get("/", (c) => c.json({ status: "ok" }));

app.route("/mcp", mcpRouter);

app.use("/*", authMiddleware);

app.route("/muscle-groups", muscleGroupsRouter);
app.route("/exercises", exercisesRouter);
app.route("/workouts", workoutsRouter);
app.route("/workout-exercises", workoutExercisesRouter);
app.route("/sets", setsRouter);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on port ${port}`);
});
