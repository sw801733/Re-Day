import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import type { DiaryEntry } from "../types/diary";

type NotionPropertyValue = PageObjectResponse["properties"][string];

const TITLE_PROPERTY_NAMES = ["Title", "title", "Name", "name", "제목"] as const;
const DATE_PROPERTY_NAMES = ["Date", "date", "날짜"] as const;
const CONTENT_PROPERTY_NAMES = [
  "Content",
  "content",
  "내용",
  "Text",
  "text",
] as const;

function getPlainText(items: RichTextItemResponse[]): string {
  return items.map((item) => item.plain_text).join("").trim();
}

function findPropertyByNames(
  properties: PageObjectResponse["properties"],
  propertyNames: readonly string[],
): NotionPropertyValue | undefined {
  for (const propertyName of propertyNames) {
    const property = properties[propertyName];

    if (property) {
      return property;
    }
  }

  return undefined;
}

function findPropertyByType(
  properties: PageObjectResponse["properties"],
  propertyType: NotionPropertyValue["type"],
): NotionPropertyValue | undefined {
  return Object.values(properties).find(
    (property) => property.type === propertyType,
  );
}

function normalizeDate(dateValue: string): string {
  return dateValue.includes("T") ? dateValue.slice(0, 10) : dateValue;
}

function parseTitle(property: NotionPropertyValue | undefined): string {
  if (!property) {
    return "제목 없음";
  }

  if (property.type === "title") {
    return getPlainText(property.title) || "제목 없음";
  }

  if (property.type === "rich_text") {
    return getPlainText(property.rich_text) || "제목 없음";
  }

  return "제목 없음";
}

function parseContent(property: NotionPropertyValue | undefined): string {
  if (!property) {
    return "";
  }

  if (property.type === "rich_text") {
    return getPlainText(property.rich_text);
  }

  if (property.type === "title") {
    return getPlainText(property.title);
  }

  return "";
}

function parseDate(
  property: NotionPropertyValue | undefined,
  fallbackDate: string,
): string {
  if (property?.type === "date" && property.date?.start) {
    return normalizeDate(property.date.start);
  }

  if (property?.type === "created_time") {
    return normalizeDate(property.created_time);
  }

  return normalizeDate(fallbackDate);
}

export function parseDiaryEntry(page: PageObjectResponse): DiaryEntry {
  const titleProperty =
    findPropertyByNames(page.properties, TITLE_PROPERTY_NAMES) ??
    findPropertyByType(page.properties, "title");

  const dateProperty =
    findPropertyByNames(page.properties, DATE_PROPERTY_NAMES) ??
    findPropertyByType(page.properties, "date") ??
    findPropertyByType(page.properties, "created_time");

  const contentProperty =
    findPropertyByNames(page.properties, CONTENT_PROPERTY_NAMES) ??
    findPropertyByType(page.properties, "rich_text");

  return {
    id: page.id,
    date: parseDate(dateProperty, page.created_time),
    title: parseTitle(titleProperty),
    content: parseContent(contentProperty),
  };
}
