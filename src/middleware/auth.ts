import { MiddlewareHandler } from "hono";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const apiKey = process.env.API_KEY;
  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
