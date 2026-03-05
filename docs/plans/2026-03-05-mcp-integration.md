# MCP Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a remote MCP server endpoint to the existing Hono app so claude.ai can call it as a custom connector from any device.

**Architecture:** Mount a `/mcp` route (before the global auth middleware) that exposes gym tracker operations as MCP tools. Tools call the database directly — same pattern as existing routes. The `/mcp` endpoint is intentionally unauthenticated for simplicity (personal project, Railway URL is private by default).

**Tech Stack:** `@modelcontextprotocol/sdk`, `@hono/mcp`, `zod` (new); Hono, Drizzle ORM, better-sqlite3 (existing)

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
npm install @modelcontextprotocol/sdk @hono/mcp zod
```

**Step 2: Verify install**

```bash
node -e "require('@modelcontextprotocol/sdk/server/mcp'); console.log('ok')"
```

Expected: `ok`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add MCP SDK and Hono MCP packages"
```

---

### Task 2: Create the MCP route

**Files:**
- Create: `src/routes/mcp.ts`

This file creates an `McpServer`, registers all tools, and exports a Hono router that handles the `/mcp` endpoint using `StreamableHTTPTransport`.

**Step 1: Create `src/routes/mcp.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/routes/mcp.ts
git commit -m "feat: add MCP route with gym tracker tools"
```

---

### Task 3: Mount the MCP route in `src/index.ts`

**Files:**
- Modify: `src/index.ts`

The MCP route must be mounted **before** `app.use("/*", authMiddleware)` so it bypasses Bearer token auth.

**Step 1: Add the import and route**

In [src/index.ts](src/index.ts), add the import after the existing imports:

```typescript
import mcpRouter from "./routes/mcp";
```

And mount it before the auth middleware line:

```typescript
app.route("/mcp", mcpRouter);  // <-- add this

app.use("/*", authMiddleware);  // existing line
```

The final `src/index.ts` should look like:

```typescript
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
```

**Step 2: Test locally**

```bash
npm run dev
```

In another terminal:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expected: JSON response listing all 9 tools.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: mount MCP route before auth middleware"
```

---

### Task 4: Deploy to Railway

**Step 1: Push to GitHub**

```bash
git push origin main
```

Railway auto-deploys on push if connected to GitHub.

**Step 2: Verify the MCP endpoint is live**

Replace `<your-railway-url>` with your actual Railway domain:

```bash
curl -X POST https://<your-railway-url>/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expected: same 9-tool list response.

---

### Task 5: Connect to claude.ai

**Step 1: Open claude.ai Settings**

Go to [claude.ai](https://claude.ai) → click your avatar (bottom left) → **Settings** → **Connectors**

**Step 2: Add custom connector**

Click **"Add custom connector"** at the bottom of the page.

- **MCP Server URL:** `https://<your-railway-url>/mcp`
- Leave OAuth fields empty (no auth for now)
- Click **Add**

**Step 3: Test in chat**

Start a new conversation and ask:

> "List my muscle groups"

Claude should call the `list_muscle_groups` tool and return results from your database.

---

## Notes

- **Security:** The `/mcp` endpoint has no auth. Your Railway URL is obscure by default, which is acceptable for personal use. If you want to lock it down later, implement OAuth 2.0 per the [claude.ai MCP auth docs](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers).
- **Stateful transport:** The current `StreamableHTTPTransport` setup is stateful (single `mcpServer` instance). This works fine for Railway single-instance deployments. If you scale to multiple instances, switch to a stateless pattern.
