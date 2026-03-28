import dotenv from "dotenv";

process.env.DOTENV_CONFIG_QUIET = "true";
dotenv.config({ quiet: true });

const UUID_WITH_HYPHENS_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_COMPACT_PATTERN = /^[0-9a-f]{32}$/i;
const UUID_WITH_HYPHENS_IN_TEXT_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const UUID_COMPACT_IN_TEXT_PATTERN = /[0-9a-f]{32}/i;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function formatCompactUuid(value: string): string {
  const normalized = value.toLowerCase();

  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join("-");
}

function normalizeNotionUuid(value: string): string | undefined {
  const trimmed = value.trim();

  if (UUID_WITH_HYPHENS_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (UUID_COMPACT_PATTERN.test(trimmed)) {
    return formatCompactUuid(trimmed);
  }

  const hyphenatedMatch = trimmed.match(UUID_WITH_HYPHENS_IN_TEXT_PATTERN)?.[0];

  if (hyphenatedMatch) {
    return hyphenatedMatch.toLowerCase();
  }

  const compactMatch = trimmed.match(UUID_COMPACT_IN_TEXT_PATTERN)?.[0];

  if (compactMatch) {
    return formatCompactUuid(compactMatch);
  }

  return undefined;
}

function readNotionDatabaseId(): string {
  const value = readRequiredEnv("NOTION_DATABASE_ID");
  const normalized = normalizeNotionUuid(value);

  if (!normalized) {
    throw new Error(
      "NOTION_DATABASE_ID must be a Notion database UUID or a Notion database URL containing that UUID.",
    );
  }

  return normalized;
}

export const env = {
  NOTION_API_KEY: readRequiredEnv("NOTION_API_KEY"),
  NOTION_DATABASE_ID: readNotionDatabaseId(),
  OPENAI_API_KEY: readOptionalEnv("OPENAI_API_KEY"),
  OPENAI_MODEL: readOptionalEnv("OPENAI_MODEL"),
  SLACK_BOT_TOKEN: readOptionalEnv("SLACK_BOT_TOKEN"),
  SLACK_REMINDER_CHANNEL: readOptionalEnv("SLACK_REMINDER_CHANNEL"),
  SLACK_REFLECTION_CHANNEL: readOptionalEnv("SLACK_REFLECTION_CHANNEL"),
} as const;
