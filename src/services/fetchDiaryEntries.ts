import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { notionClient } from "../clients/notionClient";
import { env } from "../config/env";
import type { DiaryEntry } from "../types/diary";
import { parseDiaryEntry } from "../utils/notionParsers";

const DEFAULT_LIMIT = 10;

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

  return response.results
    .filter(isFullPage)
    .map(parseDiaryEntry)
    .sort(compareByDateDesc)
    .slice(0, limit);
}
