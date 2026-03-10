import dotenv from "dotenv";

dotenv.config();

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

export const env = {
  NOTION_API_KEY: readRequiredEnv("NOTION_API_KEY"),
  NOTION_DATABASE_ID: readRequiredEnv("NOTION_DATABASE_ID"),
} as const;
