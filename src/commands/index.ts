import { pingCommand } from "./ping.ts";

/** A Discord application-command registration payload. */
type CommandJSON = {
  name: string;
  description: string;
  type: 1;
};

export function buildCommands(): CommandJSON[] {
  return [
    {
      type: 1,
      name: pingCommand.name,
      description: pingCommand.description,
    },
  ];
}
