import { REST } from "@discordjs/rest";
import { Routes, type RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

import { buildCommands } from "../src/commands/index.ts";

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_APP_ID || !DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
  console.error("DISCORD_APP_ID, DISCORD_GUILD_ID and DISCORD_BOT_TOKEN are required");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);
const route = Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID);
const body: RESTPostAPIApplicationCommandsJSONBody[] = buildCommands();

try {
  const scopeLabel = `guild ${DISCORD_GUILD_ID}`;
  const commands = (await rest.put(route, { body })) as RESTPostAPIApplicationCommandsJSONBody[];
  console.log(`Registered ${commands.length} commands in ${scopeLabel}`);
} catch (error) {
  console.error("Registration failed:", error);
  process.exit(1);
}
