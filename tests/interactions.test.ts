import { describe, expect, it } from "vitest";

import app from "../src/index";
import { signRequest, TEST_PUBLIC_KEY } from "./helpers";

const ENV = { DISCORD_PUBLIC_KEY: TEST_PUBLIC_KEY };

async function postInteractions(body: string, headers: Record<string, string> = {}) {
  return app.request(
    "/interactions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    },
    ENV,
  );
}

describe("POST /interactions (signature gate)", () => {
  it("rejects an unsigned request with 401", async () => {
    const res = await postInteractions('{"type":1}');
    expect(res.status).toBe(401);
  });

  it("answers a signed PING with a PONG", async () => {
    const body = '{"type":1}';
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ type: 1 });
  });

  it("returns 404 for GET", async () => {
    const res = await app.request("/interactions", { method: "GET" }, ENV);
    expect(res.status).toBe(404);
  });
});

describe("POST /interactions (command dispatch)", () => {
  it("replies with a components v2 health message to a signed /ping command", async () => {
    const body = JSON.stringify({ type: 2, data: { name: "ping" } });
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(200);
    const interaction = (await res.json()) as {
      type: number;
      data: {
        flags?: number;
        components?: {
          type: number;
          components?: { type: number; content?: string }[];
        }[];
      };
    };
    expect(interaction.type).toBe(4);
    expect(interaction.data.flags).toBe(32768);
    const container = interaction.data.components?.[0];
    expect(container?.type).toBe(17);
    const texts = container?.components ?? [];
    expect(texts[0]).toEqual({ type: 10, content: "## Translator Api Health" });
    expect(texts[2]).toEqual({ type: 10, content: "**Status:** Healthy" });
    expect(texts[6].content).toMatch(/^Last checked: .+ UTC$/);
  });

  it("replies gracefully to an unknown command", async () => {
    const body = JSON.stringify({ type: 2, data: { name: "nope" } });
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      type: 4,
      data: { content: "Unknown command." },
    });
  });

  it("rejects an unknown interaction type with 400", async () => {
    const body = JSON.stringify({ type: 99 });
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const body = "{not json";
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /interactions (HTTP closure)", () => {
  it("rejects a request with only the timestamp header", async () => {
    const res = await postInteractions('{"type":1}', {
      "X-Signature-Timestamp": "1608597133",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a request with only the signature header", async () => {
    const res = await postInteractions('{"type":1}', {
      "X-Signature-Ed25519": "00".repeat(64),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a stale timestamp over the wire", async () => {
    const body = '{"type":1}';
    const now = Math.floor(Date.now() / 1000);
    const { timestamp, signature } = signRequest(body, now - 3600);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(401);
  });

  it.each(["PUT", "PATCH", "DELETE"])("returns 404 for %s on /interactions", async (method) => {
    const res = await app.request("/interactions", { method }, ENV);
    expect(res.status).toBe(404);
  });

  it("rejects trailing-garbage JSON with 400", async () => {
    const body = '{"type":1}not-json';
    const { timestamp, signature } = signRequest(body);
    const res = await postInteractions(body, {
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
    });
    expect(res.status).toBe(400);
  });
});
