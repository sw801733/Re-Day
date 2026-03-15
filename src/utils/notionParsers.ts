import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

type NotionPropertyValue = PageObjectResponse["properties"][string];

const TITLE_PROPERTY_NAMES = ["Title", "title", "Name", "name", "제목"] as const;
const DATE_PROPERTY_NAMES = ["Date", "date", "날짜"] as const;

type RichTextBlockData = {
  rich_text: RichTextItemResponse[];
};

type CaptionBlockData = {
  caption: RichTextItemResponse[];
};

type CheckedBlockData = {
  checked: boolean;
};

type TableRowBlockData = {
  cells: RichTextItemResponse[][];
};

type ExpressionBlockData = {
  expression: string;
};

type TitleBlockData = {
  title: string;
};

type UrlBlockData = {
  url: string;
};

export interface NotionTextLine {
  text: string;
  plainText: string;
  depth: number;
  type: BlockObjectResponse["type"];
  isHeading: boolean;
  isListItem: boolean;
}

function getPlainText(items: RichTextItemResponse[]): string {
  return items.map((item) => item.plain_text).join("").trim();
}

function getBlockData(block: BlockObjectResponse): unknown {
  return (block as Record<string, unknown>)[block.type];
}

function hasRichText(data: unknown): data is RichTextBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "rich_text" in data &&
    Array.isArray((data as RichTextBlockData).rich_text)
  );
}

function hasCaption(data: unknown): data is CaptionBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "caption" in data &&
    Array.isArray((data as CaptionBlockData).caption)
  );
}

function hasCheckedState(data: unknown): data is CheckedBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "checked" in data &&
    typeof (data as CheckedBlockData).checked === "boolean"
  );
}

function hasTableCells(data: unknown): data is TableRowBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "cells" in data &&
    Array.isArray((data as TableRowBlockData).cells)
  );
}

function hasExpression(data: unknown): data is ExpressionBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "expression" in data &&
    typeof (data as ExpressionBlockData).expression === "string"
  );
}

function hasTitle(data: unknown): data is TitleBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    typeof (data as TitleBlockData).title === "string"
  );
}

function hasUrl(data: unknown): data is UrlBlockData {
  return (
    typeof data === "object" &&
    data !== null &&
    "url" in data &&
    typeof (data as UrlBlockData).url === "string"
  );
}

function formatIndentedLine(
  text: string,
  depth: number,
  prefix: string = "",
): string {
  return `${"  ".repeat(depth)}${prefix}${text}`;
}

function getBlockPrefix(block: BlockObjectResponse, data: unknown): string {
  switch (block.type) {
    case "bulleted_list_item":
      return "- ";
    case "numbered_list_item":
      return "1. ";
    case "quote":
      return "> ";
    case "callout":
      return "! ";
    case "to_do":
      return hasCheckedState(data) && data.checked ? "- [x] " : "- [ ] ";
    default:
      return "";
  }
}

function getFallbackBlockText(block: BlockObjectResponse, data: unknown): string {
  if (hasTableCells(data)) {
    return data.cells.map((cell) => getPlainText(cell)).join(" | ").trim();
  }

  if (hasExpression(data)) {
    return data.expression.trim();
  }

  if (hasTitle(data)) {
    if (block.type === "child_page") {
      return `[페이지] ${data.title}`.trim();
    }

    if (block.type === "child_database") {
      return `[데이터베이스] ${data.title}`.trim();
    }
  }

  if (hasUrl(data)) {
    return data.url.trim();
  }

  if (block.type === "divider") {
    return "---";
  }

  return "";
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

export function parsePropertyText(
  property: NotionPropertyValue | undefined,
): string | undefined {
  if (!property) {
    return undefined;
  }

  switch (property.type) {
    case "title":
      return getPlainText(property.title) || undefined;
    case "rich_text":
      return getPlainText(property.rich_text) || undefined;
    case "select":
      return property.select?.name?.trim() || undefined;
    case "status":
      return property.status?.name?.trim() || undefined;
    case "multi_select": {
      const value = property.multi_select
        .map((item) => item.name.trim())
        .filter(Boolean)
        .join(", ");

      return value || undefined;
    }
    case "date":
      return property.date?.start ? normalizeDate(property.date.start) : undefined;
    case "email":
      return property.email?.trim() || undefined;
    case "url":
      return property.url?.trim() || undefined;
    case "phone_number":
      return property.phone_number?.trim() || undefined;
    case "number":
      return property.number === null ? undefined : String(property.number);
    case "checkbox":
      return property.checkbox ? "true" : "false";
    case "created_time":
      return normalizeDate(property.created_time);
    case "last_edited_time":
      return normalizeDate(property.last_edited_time);
    default:
      return undefined;
  }
}

export function parsePageTitle(page: PageObjectResponse): string {
  const titleProperty =
    findPropertyByNames(page.properties, TITLE_PROPERTY_NAMES) ??
    findPropertyByType(page.properties, "title");

  return parseTitle(titleProperty);
}

export function parsePageDate(page: PageObjectResponse): string {
  const dateProperty =
    findPropertyByNames(page.properties, DATE_PROPERTY_NAMES) ??
    findPropertyByType(page.properties, "date") ??
    findPropertyByType(page.properties, "created_time");

  if (dateProperty?.type === "date" && dateProperty.date?.start) {
    return normalizeDate(dateProperty.date.start);
  }

  if (dateProperty?.type === "created_time") {
    return normalizeDate(dateProperty.created_time);
  }

  return normalizeDate(page.created_time);
}

export function parsePageTextProperty(
  page: PageObjectResponse,
  propertyNames: readonly string[],
): string | undefined {
  return parsePropertyText(findPropertyByNames(page.properties, propertyNames));
}

export function parseBlockLines(
  block: BlockObjectResponse,
  depth: number = 0,
): NotionTextLine[] {
  const blockData = getBlockData(block);

  if (hasRichText(blockData)) {
    const plainText = getPlainText(blockData.rich_text);

    if (plainText) {
      return [
        {
          text: formatIndentedLine(
            plainText,
            depth,
            getBlockPrefix(block, blockData),
          ),
          plainText,
          depth,
          type: block.type,
          isHeading:
            block.type === "heading_1" ||
            block.type === "heading_2" ||
            block.type === "heading_3",
          isListItem:
            block.type === "bulleted_list_item" ||
            block.type === "numbered_list_item" ||
            block.type === "to_do",
        },
      ];
    }
  }

  if (hasCaption(blockData)) {
    const caption = getPlainText(blockData.caption);

    if (caption) {
      return [
        {
          text: formatIndentedLine(caption, depth),
          plainText: caption,
          depth,
          type: block.type,
          isHeading: false,
          isListItem: false,
        },
      ];
    }
  }

  const fallbackText = getFallbackBlockText(block, blockData);

  if (!fallbackText) {
    return [];
  }

  return [
    {
      text: formatIndentedLine(fallbackText, depth),
      plainText: fallbackText,
      depth,
      type: block.type,
      isHeading: false,
      isListItem: false,
    },
  ];
}
