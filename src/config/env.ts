import dotenv from "dotenv";

process.env.DOTENV_CONFIG_QUIET = "true";
dotenv.config({ quiet: true });

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

export const env = {
  NOTION_API_KEY: readRequiredEnv("NOTION_API_KEY"),
  NOTION_DATABASE_ID: readRequiredEnv("NOTION_DATABASE_ID"),
  OPENAI_API_KEY: readOptionalEnv("OPENAI_API_KEY"),
  OPENAI_MODEL: readOptionalEnv("OPENAI_MODEL"),
} as const;
