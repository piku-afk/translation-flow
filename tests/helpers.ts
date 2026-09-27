import { createHash, createPrivateKey, sign } from "node:crypto";

export const TEST_PUBLIC_KEY = "4e446906bf887ee134415390efce623e82ee66c2b58b1dde84bd54b53a3d0303";

const SEED_PHRASE = "translation-flow test fixture -- discord verification; NOT FOR PRODUCTION";

function fixturePrivateKey() {
  const seed = createHash("sha256").update(SEED_PHRASE).digest();
  const derPrefix = Buffer.from("302e020100300506032b657004220420", "hex");
  return createPrivateKey({
    key: Buffer.concat([derPrefix, seed]),
    format: "der",
    type: "pkcs8",
  });
}

export function signRequest(
  rawBody: string,
  timestampSeconds: number = Math.floor(Date.now() / 1000),
): { timestamp: string; signature: string } {
  const timestamp = String(timestampSeconds);
  const message = Buffer.from(`${timestamp}${rawBody}`, "utf-8");
  const signature = sign(null, message, fixturePrivateKey());
  return { timestamp, signature: signature.toString("hex") };
}
