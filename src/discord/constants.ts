export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
} as const;

export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
} as const;

export const MessageFlags = {
  IsComponentsV2: 32768,
} as const;

export const ComponentType = {
  TextDisplay: 10,
  Separator: 14,
  Container: 17,
} as const;

export const SeparatorSpacingSize = {
  Small: 1,
} as const;
