# Translation Flow

An app that translates novels from **Chinese (zh)** and **Korean (ko)** into **English**.

It consists of two parts:

1. **[Cloudflare Worker](#cloudflare-worker)** - hosts the translation API and the core logic.
2. **[Discord Bot](#discord-bot)** - the user-facing interface. Users interact with the app through the Discord bot, which calls the Cloudflare Worker's API behind the scenes.

```mermaid
flowchart LR
    A[Discord Bot] -- commands / requests --> B[Cloudflare Worker]
    B -- translated text / responses --> A
```


---

## Overview

- **Discord Bot**: The front door for users. It receives commands (for example, requesting a translation of a chapter), forwards them to the Cloudflare Worker API, and returns the result to the user in Discord.
- **Cloudflare Worker**: Contains the translation API and the core translation logic. Users never talk to the Worker directly - all interaction goes through the Discord bot.

This separation keeps the translation logic on a serverless edge platform while presenting a simple, familiar interface to users via Discord.

---

## Cloudflare Worker

The Cloudflare Worker hosts the API and core translation logic. It is built with **[Hono](https://hono.dev)**, a lightweight web framework for edge workers, and exposes different routes that the Discord bot calls.

### Storage

- **R2** (Cloudflare's S3-compatible object storage) - stores uploaded raw files (the combined chapter text files) as well as individual extracted chapter files.
- **Novel table** - a database table tracking each novel and its metadata.
- **Chapter table** - a database table tracking each extracted chapter belonging to a novel.
- **Notes table** - a database table storing named entities (characters, places, misc) per novel, with source and English name mappings.

#### R2 folder structure

Each novel is stored in R2 under a root folder named after the novel's `slug`:

```
novel-name/
├── source/
│   ├── full.txt 
│   └── chapters/
│       ├── 001.txt
│       ├── 002.txt
│       └── ...
├── translated/
│   ├── 001.md
│   ├── 002.md
│   └── ...
```

- `source/full.txt` - the original combined raw file uploaded when the novel is created.
- `source/chapters/` - the individual extracted chapters, stored as `.txt`.
- `translated/` - the translated chapters, stored as `.md`.

Chapter files are zero-padded based on the total number of chapters for the novel: the chapter number padded to the width of `total_chapters`. For example, a novel with 100 chapters uses 3 digits (`001.txt`, `002.txt`, …, `100.txt`); a novel with 12 chapters uses 2 digits (`01.txt`, …, `12.txt`).

#### Novel schema

The `novel` table tracks each novel and its processing state.

| Field            | Type                                     | Description |
|------------------|------------------------------------------|-------------|
| `id`             | `number` (PK)                            | Primary key, unique identifier for the novel |
| `name`           | `string`                                 | Name of the novel |
| `slug`           | `string`                                 | Novel name in kebab-case |
| `source_language`| `enum 'ko' \| 'ch'`                      | Source language of the novel |
| `source_url`     | `string`                                 | Original URL where the novel lives on the web |
| `total_chapters` | `number`                                 | Total number of chapters in the novel |
| `status`         | `enum (default: 'pending')`              | One of: `pending`, `chapters_extracted`, `notes_extracted`, `translated` |
| `is_processing`  | `boolean` (default: `false`)             | Whether the novel is currently being processed |

#### Chapter schema

The `chapter` table stores each extracted chapter of a novel, broken out from the combined raw file.

| Field            | Type                                     | Description |
|------------------|------------------------------------------|-------------|
| `id`             | `number` (PK)                            | Primary key, unique identifier for the chapter |
| `novel_id`       | `number` (FK → `novel.id`)               | The novel this chapter belongs to |
| `chapter_number` | `number`                                 | Chapter order/number within the novel |
| `r2_key`         | `string`                                 | Reference to the chapter file stored in R2 |
| `is_translated`  | `boolean` (default: `false`)             | Whether the chapter has been translated |

#### Notes schema

The `notes` table stores named entities (characters, places, and misc terms) for each novel, along with their source-language name, English name mapping, and a description.

| Field            | Type                                                         | Description |
|------------------|--------------------------------------------------------------|-------------|
| `id`             | `number` (PK)                                                | Primary key, auto-incrementing identifier |
| `novel_id`       | `number` (FK → `novels.id`, cascade on delete)               | The novel this note entry belongs to |
| `category`       | `string` (check: `'characters'`, `'places'`, `'misc'`)       | Category of the note entry |
| `source_names`   | `string`                                                     | Source-language names for the entity |
| `english_names`  | `string`                                                     | English translated names |
| `description`    | `string`                                                     | Description of the entity |
| `created_at`     | `string`                                                     | When the entry was created |
| `updated_at`     | `string`                                                     | When the entry was last updated |

### Routes (API endpoints)

#### `POST` - Create Novel

Creates a new novel from an uploaded raw file.

**Request fields**

| Field            | Type   | Description |
|------------------|--------|-------------|
| `novel_name`     | string | Name of the novel |
| `source_language`| string | Source language (e.g. `zh` for Chinese, `ko` for Korean) |
| `total_chapters` | number | Total number of chapters in the novel |
| `source_url`     | string | Original URL where the novel lives on the web |
| `status`         | (TBD)  | Status of the novel - to be defined |
| `rawFile`        | file   | A `.txt` file containing **all chapters** |

**Behavior**

1. Receives the novel metadata and the raw `.txt` file (all chapters combined into one file).
2. Uploads the file to **R2**.
3. Creates a new entry in the **novel table** with the provided metadata and a reference to the uploaded file. The novel is created with `status` set to `pending` (the default).

#### `POST` - Start Chapter Extraction

Starts a Cloudflare Workflow that breaks a novel's combined raw file into individual chapters.

**Route parameter**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `novelId` | number | The id of the novel whose chapters should be extracted |

**Behavior**

1. Accepts the `novelId` as a parameter.
2. Fetches the novel's raw file (the combined chapter text file) from **R2**.
3. Reads `source_url` from the novel and parses it to discover all the possible chapter headings for the novel.
4. Uses those chapter headings as boundaries to break the raw file into separate chapters.
5. Uploads each extracted chapter to **R2**.
6. Creates a new entry in the **chapter table** for every extracted chapter (linked to the novel via `novel_id`).
7. Updates the novel's `status` to `chapters_extracted` once all chapters have been extracted and uploaded.

#### `POST` - Start Notes Extraction

Starts a Cloudflare Workflow that extracts notes (named entities such as characters, places, and misc terms) from every chapter of a novel.

**Route parameter**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `novelId` | number | The id of the novel whose chapter notes should be extracted |

**Behavior**

1. Accepts the `novelId` as a parameter.
2. Fetches all chapters belonging to the novel from the **chapter table**.
3. For each chapter:
   1. Gets the raw chapter content from **R2** using the chapter's `r2_key`.
   2. Fetches the novel's notes from the **notes table**.
   3. Filters the notes to only those whose `source_names` appear in the raw chapter content (keeps the entities relevant to this chapter, drops unused ones).
   4. Passes the **whole notes object** together with the raw chapter content to the model with notes extraction instructions.
   5. Updates the **notes table** with the extracted named entities (source names, english names, description) for the novel.
4. Continues these steps for each chapter until all chapters have been processed.
5. Updates the novel's `status` to `notes_extracted` once all chapters have been processed.

#### `POST` - Start Chapter Translation

Starts a Cloudflare Workflow that translates a single chapter into English, using the novel's extracted notes to keep named entities consistent.

**Route parameter**

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| `chapterId` | number | The id of the chapter to be translated |

**Behavior**

1. Accepts the `chapterId` as a parameter.
2. Gets the raw chapter content from **R2** using the chapter's `r2_key`.
3. Fetches all notes belonging to the chapter's novel from the **notes table**.
4. Filters the notes to only those whose `source_names` appear in the raw chapter content (keeps relevant entities for this chapter, drops unused ones).
5. Passes the filtered notes (each with its `source_names` and `english_names`) together with the source chapter text to the translation model.
6. Writes the translated text to **R2** in the novel's `translated/` folder as a `.md` file, matching the chapter's padded file name (e.g. `001.md`).
7. Updates the novel's `status` to `translated` once the chapter has been translated and uploaded.

## Discord Bot

The Discord bot is the user-facing interface. Users interact with the app entirely through Discord commands.

### Channel Structure

When a novel is created, the bot sets up a dedicated category for that novel:

```
📁 <novel-name (kebab-case)>
├── #general          — where users run commands for this novel
└── #overview         — shows the novel's details and status
```

- **`#general`** — the primary command channel for the novel. All novel-specific commands (`/extract-chapters`, `/extract-notes`, `/translate-chapter`) are available here.
- **`#overview`** — a read-only channel that displays the novel's details and current status using Discord message components.

### Commands

#### `/create-novel`

Creates a new novel. Available in the `#general` channel of the parent server.

**Flow**

1. A user runs `/create-novel`.
2. A **modal** opens asking for all the required fields for the [Create Novel API](#post---create-novel):

   | Modal Field         | Type     | Description |
   |---------------------|----------|-------------|
   | `novel_name`        | text     | Name of the novel |
   | `source_language`   | select   | Source language (`zh` for Chinese, `ko` for Korean) |
   | `total_chapters`    | integer  | Total number of chapters in the novel |
   | `source_url`        | text     | Original URL where the novel lives on the web |
   | `raw_file`          | attachment | A `.txt` file containing all chapters combined |

3. On successful API response:
   - A new Discord **category** is created for the novel, named in `kebab-case` (e.g. `my-great-novel`).
   - A `#general` channel is created inside that category.
   - An `#overview` channel is created inside that category.
4. Inside the `#overview` channel, the bot posts a single message showing the novel's details using **Discord message components** (buttons, select menus, embeds — layout to be defined).
5. The user is navigated to the `#overview` channel.

> **Note:** Message component layout for the overview message is TBD and will be refined later.

---

#### `/extract-chapters`

Extracts chapters from the novel's combined raw file. Available in the novel's `#general` channel.

**Flow**

1. The user runs `/extract-chapters` in the novel's `#general` channel.
2. The bot calls the [Start Chapter Extraction API](#post---start-chapter-extraction) for the novel.
3. The bot reports progress and confirms once chapters have been extracted and stored.

---

#### `/extract-notes`

Extracts named entities (characters, places, misc terms) from all chapters of the novel. Available in the novel's `#general` channel.

**Flow**

1. The user runs `/extract-notes` in the novel's `#general` channel.
2. The bot calls the [Start Notes Extraction API](#post---start-notes-extraction) for the novel.
3. The bot reports progress and confirms once notes have been extracted and saved.

---

#### `/translate-chapter <chapter-number>`

Translates a single chapter into English using the novel's extracted notes. Available in the novel's `#general` channel.

**Parameters**

| Parameter         | Type     | Description |
|-------------------|----------|-------------|
| `chapter-number`  | integer  | The chapter number to translate (e.g. `1` for chapter 1) |

**Flow**

1. The user runs `/translate-chapter 1` (or any chapter number) in the novel's `#general` channel.
2. The bot calls the [Start Chapter Translation API](#post---start-chapter-translation) for the corresponding chapter.
3. The translated chapter is stored in R2 as a `.md` file in the novel's `translated/` folder.

