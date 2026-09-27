import { buildHealthEmbed, buildHealthReport, handlePing } from "../src/commands/ping";

const FIXED_TIME = new Date("2026-09-26T12:00:00.000Z");

describe("buildHealthReport", () => {
  it("reports an ok server with unchecked data services", () => {
    expect(buildHealthReport(FIXED_TIME)).toEqual({
      status: "ok",
      timestamp: "2026-09-26T12:00:00.000Z",
      worker: "translation-flow",
      services: { d1: "unchecked", r2: "unchecked" },
    });
  });
});

describe("buildHealthEmbed", () => {
  it("renders the health report as a components v2 message", () => {
    expect(buildHealthEmbed(buildHealthReport(FIXED_TIME))).toEqual({
      flags: 32768,
      components: [
        {
          type: 17,
          accent_color: 4243543,
          spoiler: false,
          components: [
            { type: 10, content: "## Translator Api Health" },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: "**Status:** Healthy" },
            { type: 10, content: "**Database:** Unchecked" },
            { type: 10, content: "**Storage:** Unchecked" },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: "Last checked: <t:1790424000> UTC" },
          ],
        },
      ],
    });
  });
});

describe("handlePing", () => {
  it("returns the health payload as a components v2 interaction response", () => {
    expect(handlePing(FIXED_TIME)).toEqual({
      type: 4,
      data: {
        flags: 32768,
        components: [buildHealthEmbed(buildHealthReport(FIXED_TIME)).components[0]],
      },
    });
  });
});
