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

type ServiceHealth = "ok" | "down";

type HealthReport = {
  status: "ok" | "down";
  timestamp: string;
  worker: string;
  services: {
    database: ServiceHealth;
    storage: ServiceHealth;
  };
};

type HealthEmbed = {
  flags: typeof MessageFlags.IsComponentsV2;
  components: APIContainerComponent[];
};

type HealthBindings = {
  DB: D1Database;
  NOVELS_BUCKET: R2Bucket;
};

async function checkDatabase(db: D1Database): Promise<ServiceHealth> {
  try {
    await db.prepare("SELECT 1").first();
    return "ok";
  } catch {
    return "down";
  }
}

async function checkStorage(bucket: R2Bucket): Promise<ServiceHealth> {
  try {
    await bucket.list({ limit: 1 });
    return "ok";
  } catch {
    return "down";
  }
}

function overallStatus(services: HealthReport["services"]): HealthReport["status"] {
  const states = Object.values(services);
  if (states.includes("down")) {
    return "down";
  }

  return "ok";
}

export async function buildHealthReport(
  bindings: HealthBindings,
  now: Date = new Date(),
): Promise<HealthReport> {
  const [database, storage] = await Promise.all([
    checkDatabase(bindings.DB),
    checkStorage(bindings.NOVELS_BUCKET),
  ]);

  const services = { database, storage };

  return {
    status: overallStatus(services),
    timestamp: now.toISOString(),
    worker: "translation-flow",
    services,
  };
}

const HEALTH_LABELS: Record<ServiceHealth, string> = {
  ok: "Ok",
  down: "Down",
};

export function buildHealthEmbed(report: HealthReport): HealthEmbed {
  const container: APIContainerComponent = {
    type: ComponentType.Container,
    accent_color: 4243543,
    spoiler: false,
    components: [
      { type: ComponentType.TextDisplay, content: heading("Translator Api Health", 2) },
      { type: ComponentType.Separator, divider: true, spacing: SeparatorSpacingSize.Small },
      {
        type: ComponentType.TextDisplay,
        content: `${bold("Status:")} ${HEALTH_LABELS[report.status]}`,
      },
      {
        type: ComponentType.TextDisplay,
        content: `${bold("Database:")} ${HEALTH_LABELS[report.services.database]}`,
      },
      {
        type: ComponentType.TextDisplay,
        content: `${bold("Storage:")} ${HEALTH_LABELS[report.services.storage]}`,
      },
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

export async function handlePing(
  bindings: HealthBindings,
  now: Date = new Date(),
): Promise<APIInteractionResponseChannelMessageWithSource> {
  const { flags, components } = buildHealthEmbed(await buildHealthReport(bindings, now));

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags,
      components,
    },
  };
}
