import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import {
  muscle_groups,
  exercises,
  workouts,
  workout_exercises,
  workout_exercises_details,
} from "../db/schema";

const router = new Hono();

const mcpServer = new McpServer({
  name: "gym-tracker",
  version: "1.0.0",
});

// --- Tool: list_muscle_groups ---
mcpServer.registerTool(
  "list_muscle_groups",
  {
    description: "List all available muscle groups",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = db.select().from(muscle_groups).all();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

// --- Tool: list_exercises ---
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
    const rows = muscle_group_id
      ? db
          .select()
          .from(exercises)
          .where(eq(exercises.muscle_group_id, muscle_group_id))
          .all()
      : db.select().from(exercises).all();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

// --- Tool: list_workouts ---
mcpServer.registerTool(
  "list_workouts",
  {
    description: "List all workouts ordered by most recent. Returns id and date.",
    inputSchema: z.object({}),
  },
  async () => {
    const rows = db.select().from(workouts).all();
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

// --- Tool: get_workout_detail ---
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
    const [workout] = db
      .select()
      .from(workouts)
      .where(eq(workouts.id, workout_id))
      .all();
    if (!workout) {
      return { content: [{ type: "text", text: "Workout not found" }] };
    }
    const wes = db
      .select()
      .from(workout_exercises)
      .where(eq(workout_exercises.workout_id, workout_id))
      .all();
    const detail = wes.map((we) => ({
      ...we,
      sets: db
        .select()
        .from(workout_exercises_details)
        .where(eq(workout_exercises_details.workout_exercise_id, we.id))
        .all(),
    }));
    return {
      content: [
        { type: "text", text: JSON.stringify({ ...workout, exercises: detail }) },
      ],
    };
  }
);

// --- Tool: create_workout ---
mcpServer.registerTool(
  "create_workout",
  {
    description: "Create a new workout session for a given date.",
    inputSchema: z.object({
      date: z.string().describe("ISO date string, e.g. 2026-03-05"),
    }),
  },
  async ({ date }) => {
    const [row] = db.insert(workouts).values({ date }).returning().all();
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

// --- Tool: add_exercise_to_workout ---
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
    const [row] = db
      .insert(workout_exercises)
      .values({ workout_id, exercise_id })
      .returning()
      .all();
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

// --- Tool: log_set ---
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
    const [row] = db
      .insert(workout_exercises_details)
      .values({ workout_exercise_id, rep_count, weight })
      .returning()
      .all();
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

// --- Tool: update_set ---
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
    const updates: Record<string, number> = {};
    if (rep_count !== undefined) updates.rep_count = rep_count;
    if (weight !== undefined) updates.weight = weight;
    const [row] = db
      .update(workout_exercises_details)
      .set(updates)
      .where(eq(workout_exercises_details.id, set_id))
      .returning()
      .all();
    if (!row) return { content: [{ type: "text", text: "Set not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  }
);

// --- Tool: delete_set ---
mcpServer.registerTool(
  "delete_set",
  {
    description: "Delete a logged set.",
    inputSchema: z.object({
      set_id: z.number().describe("The set ID to delete"),
    }),
  },
  async ({ set_id }) => {
    db.delete(workout_exercises_details)
      .where(eq(workout_exercises_details.id, set_id))
      .run();
    return { content: [{ type: "text", text: "Deleted" }] };
  }
);

// --- Transport ---
const transport = new StreamableHTTPTransport();

router.all("/", async (c) => {
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }
  return transport.handleRequest(c);
});

export default router;
