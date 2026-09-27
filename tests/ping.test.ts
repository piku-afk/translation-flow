import { describe, expect, it, vi } from "vitest";

import { buildHealthEmbed, buildHealthReport, handlePing } from "../src/commands/ping";

const FIXED_TIME = new Date("2026-09-26T12:00:00.000Z");

const HEALTHY_ENV = {
  DB: {
    prepare: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({}) }),
  } as unknown as D1Database,
  NOVELS_BUCKET: {
    list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
  } as unknown as R2Bucket,
};

describe("buildHealthReport", () => {
  it("reports an ok database and storage when both respond", async () => {
    const report = await buildHealthReport(HEALTHY_ENV, FIXED_TIME);
    expect(report.status).toBe("ok");
    expect(report.services).toEqual({ database: "ok", storage: "ok" });
  });

  it("reports down when a data service throws", async () => {
    const brokenEnv = {
      ...HEALTHY_ENV,
      DB: {
        prepare: vi.fn().mockReturnValue({ first: vi.fn().mockRejectedValue(new Error("boom")) }),
      } as unknown as D1Database,
    };
    const report = await buildHealthReport(brokenEnv, FIXED_TIME);
    expect(report.status).toBe("down");
    expect(report.services.database).toBe("down");
    expect(report.services.storage).toBe("ok");
  });
});

describe("buildHealthEmbed", () => {
  it("renders a checked report as a components v2 message", () => {
    expect(
      buildHealthEmbed({
        status: "ok",
        timestamp: "2026-09-26T12:00:00.000Z",
        worker: "translation-flow",
        services: { database: "ok", storage: "ok" },
      }),
    ).toEqual({
      flags: 32768,
      components: [
        {
          type: 17,
          accent_color: 4243543,
          spoiler: false,
          components: [
            { type: 10, content: "## Translator Api Health" },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: "**Status:** Ok" },
            { type: 10, content: "**Database:** Ok" },
            { type: 10, content: "**Storage:** Ok" },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: "Last checked: <t:1790424000> UTC" },
          ],
        },
      ],
    });
  });
});

describe("handlePing", () => {
  it("returns the health payload as a components v2 interaction response", async () => {
    await expect(handlePing(HEALTHY_ENV, FIXED_TIME)).resolves.toEqual({
      type: 4,
      data: {
        flags: 32768,
        components: [
          buildHealthEmbed({
            status: "ok",
            timestamp: "2026-09-26T12:00:00.000Z",
            worker: "translation-flow",
            services: { database: "ok", storage: "ok" },
          }).components[0],
        ],
      },
    });
  });
});
