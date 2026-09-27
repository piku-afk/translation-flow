import { Hono } from "hono";
import { env } from "cloudflare:workers";

import { verifyInteraction } from "./discord/verify.ts";
import { handleInteraction } from "./interactions.ts";
import type { APIInteraction } from "discord-api-types/v10";

type Bindings = typeof env;

/**
 * reject interactions whose timestamp is too far from the current time to
 * prevent replay attacks while tolerating normal clock skew.
 */
const MAX_TIMESTAMP_AGE_SECONDS = 30;

const app = new Hono<{ Bindings: Bindings }>();
export default app;

app.post("/interactions", async (c) => {
  const signature = c.req.header("X-Signature-Ed25519");
  const timestamp = c.req.header("X-Signature-Timestamp");
  const rawBody = await c.req.text();

  if (!signature || !timestamp) {
    return c.text("Invalid signature", 401);
  }

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS
  ) {
    return c.text("Invalid signature", 401);
  }

  const valid = await verifyInteraction({
    signature,
    timestamp,
    rawBody,
    publicKey: c.env.DISCORD_PUBLIC_KEY,
  });
  if (!valid) {
    return c.text("Invalid signature", 401);
  }

  let interaction: APIInteraction;
  try {
    interaction = JSON.parse(rawBody) as APIInteraction;
  } catch {
    return c.text("Invalid JSON", 400);
  }

  const response = handleInteraction(interaction);
  if (!response) {
    return c.text("Unsupported interaction type", 400);
  }

  return c.json(response);
});
