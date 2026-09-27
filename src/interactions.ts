import type { APIInteraction, APIInteractionResponse } from "discord-api-types/v10";

import { handlePing, pingCommand } from "./commands/ping";
import { InteractionResponseType, InteractionType } from "./discord/constants.ts";

export async function handleInteraction(
  interaction: APIInteraction,
  env: Env,
): Promise<APIInteractionResponse | null> {
  if (interaction.type === InteractionType.Ping) {
    return { type: InteractionResponseType.Pong };
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    if (interaction.data.name === pingCommand.name) {
      return handlePing(env);
    }
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "Unknown command." },
    };
  }

  return null;
}