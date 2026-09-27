import nacl from "tweetnacl";

interface VerifyInteractionInput {
  timestamp: string;
  signature: string;
  rawBody: string;
  publicKey: string;
}

export async function verifyInteraction({
  timestamp,
  signature,
  rawBody,
  publicKey,
}: VerifyInteractionInput): Promise<boolean> {
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex"),
  );
}
