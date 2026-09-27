import { describe, expect, it } from "vitest";

import { verifyInteraction } from "../src/discord/verify";

const VECTOR_PUBLIC_KEY = "a9dd65e3367f8461c0b398b3a3e357957c6ca18fe75c67408d9978b4077e9029";
const VECTOR_TIMESTAMP = "1608597133";
const VECTOR_BODY = '{"type":1}';
const VECTOR_SIGNATURE =
  "953e680b74fdeb340ff68d58cb3859d9694483b7dd12c6c85fc850773550ed13d458d05698e56999d3d461b14b68d8780bed5ab9a88c46130e4b7941e286180a";

const WRONG_PUBLIC_KEY = "4e446906bf887ee134415390efce623e82ee66c2b58b1dde84bd54b53a3d0303";

describe("verifyInteraction", () => {
  it("accepts a valid vector whose signature covers timestamp + raw body", async () => {
    const ok = await verifyInteraction({
      timestamp: VECTOR_TIMESTAMP,
      signature: VECTOR_SIGNATURE,
      rawBody: VECTOR_BODY,
      publicKey: VECTOR_PUBLIC_KEY,
    });
    expect(ok).toBe(true);
  });

  it("rejects a bit-flipped signature", async () => {
    const flipped = `${VECTOR_SIGNATURE.slice(0, -1)}${VECTOR_SIGNATURE.endsWith("0") ? "1" : "0"}`;
    const ok = await verifyInteraction({
      timestamp: VECTOR_TIMESTAMP,
      signature: flipped,
      rawBody: VECTOR_BODY,
      publicKey: VECTOR_PUBLIC_KEY,
    });
    expect(ok).toBe(false);
  });

  it("rejects a signature when the wrong public key is used", async () => {
    const ok = await verifyInteraction({
      timestamp: VECTOR_TIMESTAMP,
      signature: VECTOR_SIGNATURE,
      rawBody: VECTOR_BODY,
      publicKey: WRONG_PUBLIC_KEY,
    });
    expect(ok).toBe(false);
  });

  it("accepts a timestamp exactly at the 300s window edge", async () => {
    const ok = await verifyInteraction({
      timestamp: VECTOR_TIMESTAMP,
      signature: VECTOR_SIGNATURE,
      rawBody: VECTOR_BODY,
      publicKey: VECTOR_PUBLIC_KEY,
    });
    expect(ok).toBe(true);
  });
});
