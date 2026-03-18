import { collectPaginatedAPI, isFullBlock } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { notionClient } from "../clients/notionClient";
import type { ParsedDiaryEntry, ParsedDiarySections } from "../types/diary";
import {
  parseBlockLines,
  parsePageDate,
  parsePageTextProperty,
  parsePageTitle,
  type NotionTextLine,
} from "../utils/notionParsers";

const MAX_NOTION_PAGE_SIZE = 100;

const EXERCISE_PROPERTY_NAMES = ["운동", "Exercise", "exercise"] as const;
const CONDITION_PROPERTY_NAMES = ["컨디션", "Condition", "condition"] as const;

type DiarySectionKey = keyof ParsedDiarySections;

const SECTION_ALIASES = {
  facts: ["오늘 있었던 일", "오늘 있었던 일 (사실)", "오늘 있었던 일(사실)"],
  actions: ["실제로 행동한 일"],
  thoughts: ["떠오른 생각"],
  lessons: ["배운 것"],
  discomforts: ["불편한 것", "불편한 것 / 막힌 것", "불편한 것/막힌 것"],
  nextSteps: ["다음에 할 것"],
  oneLine: ["한 문장"],
} satisfies Record<DiarySectionKey, readonly string[]>;

const SECTION_LABELS = {
  facts: "오늘 있었던 일",
  actions: "실제로 행동한 일",
  thoughts: "떠오른 생각",
  lessons: "배운 것",
  discomforts: "불편한 것",
  nextSteps: "다음에 할 것",
  oneLine: "한 문장",
} satisfies Record<DiarySectionKey, string>;

const SUMMARY_SECTION_ORDER: DiarySectionKey[] = [
  "facts",
  "actions",
  "thoughts",
  "lessons",
  "discomforts",
];

const SECTION_LOOKUP = createSectionLookup();

function createSectionLookup(): Map<string, DiarySectionKey> {
  const lookup = new Map<string, DiarySectionKey>();

  for (const [sectionKey, headings] of Object.entries(SECTION_ALIASES)) {
    for (const heading of headings) {
      lookup.set(normalizeHeadingText(heading), sectionKey as DiarySectionKey);
    }
  }

  return lookup;
}

function normalizeHeadingText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function stripListPrefix(text: string): string {
  return text
    .trim()
    .replace(/^(?:[-*•]\s*)?\[(?: |x|X)\]\s*/u, "")
    .replace(/^(?:[-*•]\s+|\d+\.\s+)/u, "")
    .trim();
}

function createEmptySectionLines(): Record<DiarySectionKey, NotionTextLine[]> {
  return {
    facts: [],
    actions: [],
    thoughts: [],
    lessons: [],
    discomforts: [],
    nextSteps: [],
    oneLine: [],
  };
}

function detectSectionKey(line: NotionTextLine): DiarySectionKey | undefined {
  return SECTION_LOOKUP.get(normalizeHeadingText(line.plainText));
}

function joinSectionLines(lines: NotionTextLine[]): string | undefined {
  const value = lines.map((line) => line.text.trimEnd()).join("\n").trim();

  return value || undefined;
}

function buildSections(lines: NotionTextLine[]): ParsedDiarySections {
  const sectionLines = createEmptySectionLines();
  let currentSection: DiarySectionKey | undefined;

  for (const line of lines) {
    if (!line.plainText.trim()) {
      continue;
    }

    const sectionKey = detectSectionKey(line);

    if (sectionKey) {
      currentSection = sectionKey;
      continue;
    }

    if (line.isHeading) {
      currentSection = undefined;
      continue;
    }

    if (!currentSection || line.plainText.trim() === "---") {
      continue;
    }

    sectionLines[currentSection].push(line);
  }

  return {
    facts: joinSectionLines(sectionLines.facts),
    actions: joinSectionLines(sectionLines.actions),
    thoughts: joinSectionLines(sectionLines.thoughts),
    lessons: joinSectionLines(sectionLines.lessons),
    discomforts: joinSectionLines(sectionLines.discomforts),
    nextSteps: joinSectionLines(sectionLines.nextSteps),
    oneLine: joinSectionLines(sectionLines.oneLine),
  };
}

function buildNextStepsList(nextSteps: string | undefined): string[] {
  if (!nextSteps) {
    return [];
  }

  return nextSteps
    .split("\n")
    .map((line) => stripListPrefix(line))
    .filter(Boolean);
}

function buildSummarySourceText(sections: ParsedDiarySections): string {
  const parts: string[] = [];

  for (const sectionKey of SUMMARY_SECTION_ORDER) {
    const content = sections[sectionKey];

    if (!content) {
      continue;
    }

    parts.push(`[${SECTION_LABELS[sectionKey]}]`);
    parts.push(content);
  }

  return parts.join("\n").trim();
}

async function fetchPageLines(
  blockId: string,
  depth: number = 0,
): Promise<NotionTextLine[]> {
  const results = await collectPaginatedAPI(notionClient.blocks.children.list, {
    block_id: blockId,
    page_size: MAX_NOTION_PAGE_SIZE,
  });

  const blocks = results.filter(isFullBlock);
  const lines: NotionTextLine[] = [];

  for (const block of blocks) {
    const blockLines = parseBlockLines(block, depth);
    lines.push(...blockLines);

    if (block.has_children) {
      const childDepth = blockLines.length > 0 ? depth + 1 : depth;
      lines.push(...(await fetchPageLines(block.id, childDepth)));
    }
  }

  return lines;
}

export async function parseDiaryEntry(
  page: PageObjectResponse,
): Promise<ParsedDiaryEntry> {
  const pageLines = await fetchPageLines(page.id);
  const rawContent = pageLines.map((line) => line.text).join("\n").trim();
  const sections = buildSections(pageLines);

  return {
    id: page.id,
    title: parsePageTitle(page),
    date: parsePageDate(page),
    exercise: parsePageTextProperty(page, EXERCISE_PROPERTY_NAMES),
    condition: parsePageTextProperty(page, CONDITION_PROPERTY_NAMES),
    rawContent,
    sections,
    nextStepsList: buildNextStepsList(sections.nextSteps),
    summarySourceText: buildSummarySourceText(sections),
  };
}
