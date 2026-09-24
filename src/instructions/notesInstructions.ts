import { TRUST_BOUNDARY_INSTRUCTIONS } from "./commonInstructions.ts";

export const NOTES_INSTRUCTIONS = `
# Novel Notes Update Instructions

You will be provided with:
- A source text chunk from a novel
- The current notes containing known characters, places, and miscellaneous entities

Read the source to identify every distinct named entity new to the notes, then update
the notes into the required diff. This is a single exchange: you both discover new
names and decide how the notes should change.

## Source & Notes Trust Boundary

${TRUST_BOUNDARY_INSTRUCTIONS}

## Identifying New Names

* Read the source and identify every distinct named entity: characters, places, organizations, objects, titles, and other distinct named entities.
* A name is **new** when it is not already represented in the notes — compare against the \`source_names\` (and, if helpful, \`english_names\`) of the existing entries.
* A name is **not** new when it matches an existing entry's alias set; that entry should be updated rather than re-added.
* Do not translate or rewrite the source text.
* Preserve the exact spelling of each \`source_names\` value as it appears in the source.
* Do not include the same name more than once within a single entry.

## Romanization / English Rendering

* For any entity already in the notes, reuse the \`english_names\` already recorded there.
* For a genuinely new entity, choose a consistent, natural English rendering (or romanization) and keep it stable across the book — reuse it whenever the entity appears again.
* Never invent a different English rendering for an entity that already has one in the notes.
* When multiple known names, aliases, titles, or forms of address refer to the same entity, store them as \`;\`-separated pairs aligned by position.

Return a single JSON object matching the following structure:

\`\`\`json
{
  "notesChanges": {
    "updates": [
      {
        "category": "characters",
        "id": 1,
        "description": "Male; police officer; protects the survivors; carries a revolver",
        "english_names": "Kang Minsu; Detective Minsu",
        "source_names": "강민수; 민수 형사"
      }
    ],
    "additions": [
      {
        "category": "places",
        "description": "Abandoned hospital; used as a temporary shelter by the survivors",
        "english_names": "Seoul Central Hospital",
        "source_names": "서울중앙병원"
      }
    ],
    "deletions": [
      {
        "category": "characters",
        "id": 2
      }
    ]
  }
}
\`\`\`

\`notesChanges\` describes all changes that should be applied to the existing notes.

It contains three arrays:

* \`updates\`: existing entries that should be modified
* \`additions\`: new entries that should be created
* \`deletions\`: existing entries that should be removed

All three arrays are required and must always be present. If no changes of a given type exist, provide an empty array \`[]\`.

### IDs

**IDs are generated and managed by the application, not by the model.** Each entry's id is an opaque integer number assigned by the application; treat it as an opaque handle, never as data to interpret.

* For an entry in \`updates\`, use the exact existing entry ID supplied in the existing notes data.
* For an entry in \`deletions\`, use the exact existing entry ID supplied in the existing notes data.
* For an entry in \`additions\`, do **not** provide an ID. The application will generate the ID.
* Never invent, guess, generate, modify, or replace an ID.
* Never include an \`id\` field in an addition.

### Names

\`english_names\` should normally begin with the most natural or standard English rendering of the entity.

When multiple known names, aliases, titles, or forms of address refer to the same entity, store them as \`;\`-separated pairs:

\`\`\`text
source_names: "김도현; 도현 선생님; 선생님"
english_names: "Kim Dohyeon; Teacher Dohyeon; Teacher"
\`\`\`

Keep the source and English names aligned by position.

### Description Format

Descriptions should be concise factual summaries, not full sentences or prose paragraphs.

Use \`;\` to separate distinct pieces of information.

Example:

\`\`\`text
High school teacher; helps the main characters; joins the evacuation group; carries a first-aid kit
\`\`\`

When updating an existing description:

* Preserve useful existing facts.
* Add only genuinely new facts.
* Avoid repetition.
* Correct existing facts only when new evidence clearly contradicts them.
* Keep the description concise.

### Entity Deduplication, Names, and Updates

Before modifying entity notes, compare each identified entity with the existing notes.

* If the entity is the same as an existing entry, put the change in \`updates\` using that entry's existing ID.
* If the entity is genuinely different, put it in \`additions\`.
* If the identity is uncertain, create an addition rather than merging it with an existing entity.
* Do not create a new addition when an existing entry clearly represents the same entity.

Each entity has one entry regardless of aliases, titles, ranks, or forms of address.

Store known names in \`source_names\` and \`english_names\` as \`;\`-separated pairs in the same order.

For example:

\`\`\`json
{
  "category": "characters",
  "id": 1,
  "source_names": "김도현; 도현 선생님; 선생님",
  "english_names": "Kim Dohyeon; Teacher Dohyeon; Teacher",
  "description": "High school teacher; helps the main characters; later joins the evacuation group"
}
\`\`\`

When a new alias is discovered:

* Preserve the existing names.
* Append the new source/English name pair if it is genuinely new.
* Preserve useful existing facts.
* Add new facts.
* Correct an existing fact only when new evidence clearly contradicts it.
* Keep the existing entry ID unchanged.

### Merging Existing Duplicate Entries

If two or more existing entries are determined to refer to the same entity, merge them into a single canonical entry.

* Retain the first existing entry according to the application's existing IDs.
* Put the merged result in \`updates\` using the retained entry's existing ID.
* Combine all useful names and factual information from the duplicate entries.
* Add every redundant entry ID to \`deletions\`.
* Do not create an addition for the merged entity.
* Do not include redundant entries in \`updates\`.
* Do not include the retained ID in \`deletions\`.

For example, if the existing notes contain:

\`\`\`json
[
  {
    "category": "characters",
    "id": 1,
    "source_names": "강민수",
    "english_names": "Kang Minsu",
    "description": "Male; police officer; protects the survivors"
  },
  {
    "category": "characters",
    "id": 2,
    "source_names": "민수 형사",
    "english_names": "Detective Minsu",
    "description": "Male; detective; carries a revolver"
  }
]
\`\`\`

and new evidence establishes that they are the same person, return:

\`\`\`json
{
  "notesChanges": {
    "updates": [
      {
        "category": "characters",
        "id": 1,
        "source_names": "강민수; 민수 형사",
        "english_names": "Kang Minsu; Detective Minsu",
        "description": "Male; police officer; detective; protects the survivors; carries a revolver"
      }
    ],
    "additions": [],
    "deletions": [
      {
        "category": "characters",
        "id": 2
      }
    ]
  }
}
\`\`\`

### Deletion Rules

Only include an entry in \`deletions\` when that existing entry should actually be removed.

This includes redundant entries resulting from a confirmed entity merge.

When merging:

* Keep exactly one existing entry.
* Use the retained entry's existing ID in \`updates\`.
* Delete every redundant existing entry using its existing ID.
* Never delete the retained entry.
* Never silently discard a redundant entry.
* Never create a new entry for an entity that can be represented by the retained entry.

A deletion contains only:

\`\`\`json
{
  "category": "characters",
  "id": 1
}
\`\`\`

### Final Consistency Check

Before producing the JSON:

1. Recheck all existing and newly identified entities for duplicates.
2. For every confirmed duplicate, retain exactly one existing entry.
3. Put the retained entry in \`updates\` using its existing ID.
4. Put every redundant existing entry in \`deletions\`.
5. Ensure no deleted entry also appears in \`updates\`.
6. Ensure no new entity in \`additions\` has an \`id\`.
7. Ensure every \`updates\` and \`deletions\` ID belongs to an existing note.
8. Ensure \`category\` is exactly one of \`characters\`, \`places\`, or \`misc\`.
9. Ensure every entry has the required fields for its operation.
10. Return only the JSON object matching the response schema.
`;
