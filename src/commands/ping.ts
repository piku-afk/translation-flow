import type {
  APIContainerComponent,
  APIInteractionResponseChannelMessageWithSource,
  RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v10";
import { bold, heading, time } from "@discordjs/formatters";

import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
  SeparatorSpacingSize,
} from "../discord/constants.ts";

export const pingCommand = {
  type: 1,
  name: "ping",
  description: "Checks server health.",
} as const satisfies RESTPostAPIApplicationCommandsJSONBody;

type ServiceHealth = "ok" | "degraded" | "down" | "unchecked";

type HealthReport = {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  worker: string;
  services: {
    d1: ServiceHealth;
    r2: ServiceHealth;
  };
};

type HealthEmbed = {
  flags: typeof MessageFlags.IsComponentsV2;
  components: APIContainerComponent[];
};

export function buildHealthReport(now: Date = new Date()): HealthReport {
  return {
    status: "ok",
    timestamp: now.toISOString(),
    worker: "translation-flow",
    services: {
      d1: "unchecked",
      r2: "unchecked",
    },
  };
}

export function buildHealthEmbed(report: HealthReport): HealthEmbed {
  const container: APIContainerComponent = {
    type: ComponentType.Container,
    accent_color: 4243543,
    spoiler: false,
    components: [
      { type: ComponentType.TextDisplay, content: heading("Translator Api Health", 2) },
      { type: ComponentType.Separator, divider: true, spacing: SeparatorSpacingSize.Small },
      { type: ComponentType.TextDisplay, content: `${bold("Status:")} Healthy` },
      { type: ComponentType.TextDisplay, content: `${bold("Database:")} Unchecked` },
      { type: ComponentType.TextDisplay, content: `${bold("Storage:")} Unchecked` },
      { type: ComponentType.Separator, divider: true, spacing: SeparatorSpacingSize.Small },
      {
        type: ComponentType.TextDisplay,
        content: `Last checked: ${time(new Date(report.timestamp))} UTC`,
      },
    ],
  };

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}

export function handlePing(now: Date = new Date()): APIInteractionResponseChannelMessageWithSource {
  const { flags, components } = buildHealthEmbed(buildHealthReport(now));

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags,
      components,
    },
  };
}
