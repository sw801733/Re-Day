import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { collectPaginatedAPI, isFullBlock } from "@notionhq/client";

import { notionClient } from "../clients/notionClient";
import { env } from "../config/env";
import type { DiaryEntry } from "../types/diary";
import { parseBlockText, parseDiaryEntry } from "../utils/notionParsers";

const DEFAULT_LIMIT = 10;
const MAX_NOTION_PAGE_SIZE = 100;

function isFullPage(
  result: QueryDataSourceResponse["results"][number],
): result is PageObjectResponse {
  return result.object === "page" && "properties" in result;
}

function isFullDatabase(database: unknown): database is DatabaseObjectResponse {
  return (
    typeof database === "object" &&
    database !== null &&
    "object" in database &&
    database.object === "database" &&
    "data_sources" in database
  );
}

function compareByDateDesc(left: DiaryEntry, right: DiaryEntry): number {
  return right.date.localeCompare(left.date);
}

async function fetchPageContent(
  blockId: string,
  depth: number = 0,
): Promise<string[]> {
  const results = await collectPaginatedAPI(notionClient.blocks.children.list, {
    block_id: blockId,
    page_size: MAX_NOTION_PAGE_SIZE,
  });

  const blocks = results.filter(isFullBlock);
  const lines: string[] = [];

  for (const block of blocks) {
    const blockLines = parseBlockText(block, depth);
    lines.push(...blockLines);

    if (block.has_children) {
      const childDepth = blockLines.length > 0 ? depth + 1 : depth;
      lines.push(...(await fetchPageContent(block.id, childDepth)));
    }
  }

  return lines;
}

async function attachPageContent(entry: DiaryEntry): Promise<DiaryEntry> {
  const contentLines = await fetchPageContent(entry.id);
  const pageContent = contentLines.join("\n").trim();

  return {
    ...entry,
    content: pageContent || entry.content,
  };
}

export async function fetchDiaryEntries(
  limit: number = DEFAULT_LIMIT,
): Promise<DiaryEntry[]> {
  const database = await notionClient.databases.retrieve({
    database_id: env.NOTION_DATABASE_ID,
  });

  if (!isFullDatabase(database)) {
    throw new Error("Failed to load the full Notion database response.");
  }

  const dataSourceId = database.data_sources[0]?.id;

  if (!dataSourceId) {
    throw new Error("The Notion database does not contain a queryable data source.");
  }

  const response = await notionClient.dataSources.query({
    data_source_id: dataSourceId,
    page_size: limit,
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });

  const parsedEntries = response.results
    .filter(isFullPage)
    .map(parseDiaryEntry)
    .sort(compareByDateDesc)
    .slice(0, limit);

  return Promise.all(parsedEntries.map(attachPageContent));
}
