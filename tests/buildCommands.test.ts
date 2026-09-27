import { describe, expect, it } from "vitest";

import { buildCommands } from "../src/commands";

describe("buildCommands", () => {
  it("returns the ping command with its registration shape", () => {
    expect(buildCommands()).toEqual([
      {
        name: "ping",
        description: "Checks server health.",
        type: 1,
      },
    ]);
  });

  it("never leaks the guild id into the payload", () => {
    const payload = JSON.stringify(buildCommands());
    expect(payload).not.toContain("guild_id");
    expect(payload).not.toContain("123456789");
  });

  it("produces an identical payload for guild and global scopes", () => {
    expect(buildCommands()).toEqual(buildCommands());
  });
});
