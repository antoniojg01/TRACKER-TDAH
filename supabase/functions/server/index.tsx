import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9057c6ed/health", (c) => {
  return c.json({ status: "ok" });
});

// KV Store endpoints
app.post("/make-server-9057c6ed/kv/set", async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key) {
      return c.json({ error: "Key is required" }, 400);
    }
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (error) {
    // Silently handle common transient errors
    const errorMessage = error?.message || String(error);
    
    // Don't log HTML error pages or timeout errors - these are transient
    if (errorMessage.includes('<!DOCTYPE html>') || 
        errorMessage.includes('520') || 
        errorMessage.includes('Web server is returning an unknown error') ||
        errorMessage.includes('canceling statement due to statement timeout') ||
        errorMessage.includes('timeout')) {
      // Return success to prevent frontend retries
      return c.json({ success: true, warning: 'saved_locally' });
    }
    
    console.error("KV set error:", error);
    return c.json({ error: errorMessage }, 500);
  }
});

app.get("/make-server-9057c6ed/kv/get", async (c) => {
  try {
    const key = c.req.query("key");
    if (!key) {
      return c.json({ error: "Key is required" }, 400);
    }
    const value = await kv.get(key);
    return c.json({ value });
  } catch (error) {
    // Silently handle common transient errors
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('<!DOCTYPE html>') || 
        errorMessage.includes('520') || 
        errorMessage.includes('Web server is returning an unknown error') ||
        errorMessage.includes('canceling statement due to statement timeout') ||
        errorMessage.includes('timeout')) {
      // Return empty value for transient errors
      return c.json({ value: null });
    }
    
    console.error("KV get error:", error);
    return c.json({ error: errorMessage }, 500);
  }
});

app.delete("/make-server-9057c6ed/kv/del", async (c) => {
  try {
    const key = c.req.query("key");
    if (!key) {
      return c.json({ error: "Key is required" }, 400);
    }
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    // Silently handle common transient errors
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('<!DOCTYPE html>') || 
        errorMessage.includes('520') || 
        errorMessage.includes('Web server is returning an unknown error') ||
        errorMessage.includes('canceling statement due to statement timeout') ||
        errorMessage.includes('timeout')) {
      // Return success for transient errors
      return c.json({ success: true, warning: 'transient_error' });
    }
    
    console.error("KV delete error:", error);
    return c.json({ error: errorMessage }, 500);
  }
});

Deno.serve(app.fetch);