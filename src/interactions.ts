import type { APIInteraction, APIInteractionResponse } from "discord-api-types/v10";

import { handlePing, pingCommand } from "./commands/ping";
import { InteractionResponseType, InteractionType } from "./discord/constants.ts";

export function handleInteraction(interaction: APIInteraction): APIInteractionResponse | null {
  if (interaction.type === InteractionType.Ping) {
    return { type: InteractionResponseType.Pong };
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    if (interaction.data.name === pingCommand.name) {
      return handlePing();
    }
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "Unknown command." },
    };
  }

  return null;
}