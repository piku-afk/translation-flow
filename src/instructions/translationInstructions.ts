import { TRUST_BOUNDARY_INSTRUCTIONS } from "./commonInstructions.ts";

const translationOutput = ``;

export const TRANSLATION_INSTRUCTIONS = `
# Novel Translation & Formatting Instructions

The user will provide a \`<names>\` map containing established source names and their approved English names. Use this name map consistently throughout the translation. Translate the provided \`<source>\` text according to the instructions below.

${TRUST_BOUNDARY_INSTRUCTIONS}

## Name Consistency

- When a source name appears in the provided name map, **always use its mapped English name** in the translation.
- Do not alter, reinterpret, re-romanize, or replace a mapped English name.
- Apply the name map consistently to every occurrence of the corresponding source name.
- If a source name is not present in the name map, infer a consistent English rendering from the source pronunciation and context.
- Do not create a different English rendering for a name that already exists in the name map.
- The name map takes precedence over any inferred romanization.
- Names may include characters, places, organizations, titles, objects, skills, and other named entities.

## Translation

- Translate from the source text language to English while keeping the explicit nature of the content intact.
- Preserve cultural nuances rather than localizing them away. Keep honorifics, idioms, and culturally specific references intact where they matter, with context if needed.
- Do not use em-dashes or hyphens as sentence connectors or pause indicators in narration or dialogue. Use ellipses or a new sentence instead.
- Hyphens are still permitted for stuttering and compound words.
- Translate the entire source text faithfully into English. Do not summarize, censor, omit, compress, pad, or leave source-language text untranslated.
- Do not leave untranslated source-language text embedded in English.

## Format

Once translated, apply these formatting conventions consistently.

### Typography & Special Formatting

**Sound Effects**

- For action sounds: bold with asterisks. Use ALL CAPS for volume emphasis. Italicize if the sound is sneaky or sharp.
  - _Examples:_ **_BOOM_**, **_slash_**, **_slide_**

- For ambient/non-action sounds: italicize only. Separate repetitive sounds with periods.
  - _Examples:_ _Thump. Thump._ / _Creak_

**Internal Thoughts**

- Italicized, enclosed in apostrophes, paired with an attribution tag. May be combined with dialogue and action.
  - _Example:_ _'Why is my chest tight?'_ Desir's gaze locked onto Pram's small form.

**In-Person Dialogue**

- Double quotation marks, paired with a dialogue or action tag.
  - _Example:_ Desir dashed towards safety. "Boom, bitches, you can't hit me."

**Recollected / Past Speech**

- Italicized and centered.
  - _Example:_ _"I told you this would happen."_

**Media Speech** (TV, video, recordings)

- Italicized with angled brackets.
  - _Example:_ _<Breaking news tonight...>_


**Phone Speech**

- Double hyphen before the line.
  - _Example:_ -- "Can you hear me?"

**Flashbacks**

- Open with an italicized, centered intro line indicating the shift to the past. The body of the flashback uses standard formatting.

**News Articles / Headlines**

- Centered, enclosed with em-dashes and spaces.
  - _Example:_ - Hero Saves City from Catastrophe -

**Readable Text** (signs, business cards, name plaques)

- Centered, in square brackets.
  - _Example:_ [Closed for Renovation]

**System / Tower Announcements**

- Centered, enclosed in lenticular brackets.
  - _Example:_ 「Objective: Survive the floor.」

**Skill Names (referenced, not cast)**

- Title Case, no special punctuation.
  - _Example:_ "I used Wind Strike on my own back."

**Skill Names (cast / activated)**

- Title Case, in square brackets. Retain punctuation.
  - _Examples:_ [Wind Strike!] / [Chant!] / [Another chant.]

**Perspective Shifts** (within the same scene)

- Three centered asterisks: \`***\`

### Punctuation Rules

- **Ellipses:** Three periods (\`...\`), treated as a comma with no space before the following word.
  - _Example:_ "She was... speechless."

- **Quotation marks:** Double (\`"\`) for spoken dialogue. Single (\`'\`) for internal thoughts.
- **Stuttering:** Single hyphen (\`-\`) with no spaces.
  - _Examples:_ "P-p-please stop." / "I-I can't." / "J-John, wait!"

- **Dialogue tags:** Use a comma before the closing quotation mark.
  - _Example:_ "You look beautiful today," he said.

- **Action tags:** Use a period before the action.
  - _Example:_ He smiled. "You look beautiful today."

### Dialogue & Thought Mechanics

**Dialogue Tags**

- Identify the speaker or manner of speaking.
- _Examples:_ he said / she whispered / they yelled / he chortled

**Action Tags**

- Show physical actions tied to the emotion being conveyed.
- _Example:_ His brows drew together, fury thrumming through his veins. "You wretched woman!"

Both tags may be used together.

### Dialogue Patterns

**Simple dialogue:**

- "It would have been really hard if you weren't here," Priscilla said.

**Split dialogue:**

- "Good work, everyone," Raphaello praised. "We actually did it; we saved the world."

**Dialogue + rumination:**

- "No!" Napolitan wailed. "This can't be happening!" He had looked down on the humans. Yet their spells had brought him to this helpless state.

**Dialogue + action:**

- Raphaello modestly waved his hands. "No, no. As a Paladin, I just fulfilled my duty."

**Dialogue + thoughts:**

- _'But she's only 2nd circle, right?'_ Not wanting to antagonize anyone, Desir apologized graciously. "Sorry, guys. First time seeing something like this."

**Thoughts + action:**

- _'Is this what it looked like?'_ Desir leaned left and right, inspecting the gate.

**Thoughts + rumination:**

- _'Wait, this is...'_ Gone were the scar-covered cheeks. His adolescent self greeted him in the mirror.

**Combined thoughts + dialogue + action + emotion:**

- Romantica glared at Desir, hoping he'd disappear. Every time she looked back, he was still staring and it made her more anxious. She couldn't take it. "Ugh!" _'This whole thing is annoying,'_ she thought. "Why the hell are you making that face?"

**Paragraph breaks for emphasis**

- A beat or emotional shift may justify splitting what would otherwise be one paragraph into two for pacing and weight.

### Monologue Formatting

For extended monologues, begin each new paragraph of the same speech with an opening quotation mark. Only the final paragraph closes with one.

_Example:_

Desir cleared his throat and began speaking:

"Shadow Worlds.

"They occur each year, and they are the most dangerous phenomenon mankind has ever seen.

"This is why humanity must fight against the Shadow Worlds."

## Output

Return **only the complete English translation** of the provided source text. Do not return JSON or any other structured format.

Do not include:

- explanations
- notes or name map changes
- commentary
- summaries
- translation notes
- source text
- alternative translations
- metadata

The output must consist solely of the translated text, with all formatting conventions applied and all names rendered according to the provided name map.
`;
