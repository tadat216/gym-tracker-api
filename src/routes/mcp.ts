import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { z } from "zod";
import { listMuscleGroups } from "../services/muscle-groups";
import { listExercises } from "../services/exercises";
import {
  listWorkouts,
  createWorkout,
  getWorkoutDetail,
  addExerciseToWorkout,
} from "../services/workouts";
import { addSet } from "../services/workout-exercises";
import { updateSet, deleteSet } from "../services/sets";

const router = new Hono();

const mcpServer = new McpServer({
  name: "gym-tracker",
  version: "1.0.0",
});

mcpServer.registerTool(
  "list_muscle_groups",
  {
    description: "List all available muscle groups",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = listMuscleGroups();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "list_exercises",
  {
    description:
      "List exercises. Optionally filter by muscle_group_id. Returns id, name, vietnamese_trans, muscle_group_id.",
    inputSchema: z.object({
      muscle_group_id: z
        .number()
        .optional()
        .describe("Filter by muscle group ID"),
    }),
  },
  async ({ muscle_group_id }) => {
    const rows = listExercises(muscle_group_id);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "list_workouts",
  {
    description: "List all workouts ordered by most recent. Returns id and date.",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = listWorkouts();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

mcpServer.registerTool(
  "get_workout_detail",
  {
    description:
      "Get a workout with all its exercises and sets. Use this to review a logged workout.",
    inputSchema: z.object({
      workout_id: z.number().describe("The workout ID"),
    }),
  },
  async ({ workout_id }) => {
    const detail = getWorkoutDetail(workout_id);
    if (!detail) return { content: [{ type: "text", text: "Workout not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(detail) }] };
  }
);

mcpServer.registerTool(
  "create_workout",
  {
    description: "Create a new workout session for a given date.",
    inputSchema: z.object({
      date: z.string().describe("ISO date string, e.g. 2026-03-05"),
    }),
  },
  async ({ date }) => {
    const row = createWorkout(date);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "add_exercise_to_workout",
  {
    description:
      "Add an exercise to a workout. Returns a workout_exercise id needed to log sets.",
    inputSchema: z.object({
      workout_id: z.number().describe("The workout ID"),
      exercise_id: z.number().describe("The exercise ID"),
    }),
  },
  async ({ workout_id, exercise_id }) => {
    const row = addExerciseToWorkout(workout_id, exercise_id);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "log_set",
  {
    description:
      "Log a single set (reps + weight) for a workout exercise. Call once per set.",
    inputSchema: z.object({
      workout_exercise_id: z
        .number()
        .describe("The workout_exercise ID from add_exercise_to_workout"),
      rep_count: z.number().describe("Number of reps"),
      weight: z.number().describe("Weight in kg"),
    }),
  },
  async ({ workout_exercise_id, rep_count, weight }) => {
    const row = addSet(workout_exercise_id, rep_count, weight);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "update_set",
  {
    description: "Correct a set's rep count or weight.",
    inputSchema: z.object({
      set_id: z.number().describe("The set ID to update"),
      rep_count: z.number().optional(),
      weight: z.number().optional(),
    }),
  },
  async ({ set_id, rep_count, weight }) => {
    const data: Partial<{ rep_count: number; weight: number }> = {};
    if (rep_count !== undefined) data.rep_count = rep_count;
    if (weight !== undefined) data.weight = weight;
    const row = updateSet(set_id, data);
    if (!row) return { content: [{ type: "text", text: "Set not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

mcpServer.registerTool(
  "delete_set",
  {
    description: "Delete a logged set.",
    inputSchema: z.object({
      set_id: z.number().describe("The set ID to delete"),
    }),
  },
  async ({ set_id }) => {
    deleteSet(set_id);
    return { content: [{ type: "text", text: "Deleted" }] };
  }
);

const transport = new StreamableHTTPTransport();

router.all("/", async (c) => {
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }
  return transport.handleRequest(c);
});

export default router;
