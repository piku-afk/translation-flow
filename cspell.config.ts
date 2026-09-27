import { defineConfig } from "cspell";

export default defineConfig({
  ignoreWords: ["Piyush", "Mahato", "nacl", "workerd"],
  ignorePaths: [
    "src/instructions/notesInstructions.ts",
    "src/instructions/translationInstructions.ts",
  ],
});
