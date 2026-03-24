import type { ParsedDiaryEntry } from "../types/diary";
import { formatShortDate } from "../utils/formatShortDate";
import type { BehaviorCountItem } from "./buildBehaviorCounts";

type ReflectionSourceSectionKey =
  | "facts"
  | "actions"
  | "thoughts"
  | "lessons"
  | "discomforts";

const REFLECTION_V2_SOURCE_SECTIONS = [
  { key: "facts", label: "사실" },
  { key: "actions", label: "행동" },
  { key: "thoughts", label: "생각" },
  { key: "lessons", label: "배운 것" },
  { key: "discomforts", label: "막힌 점" },
] as const satisfies ReadonlyArray<{
  key: ReflectionSourceSectionKey;
  label: string;
}>;

const MAX_LINES_PER_SECTION = 3;

export interface ReflectionV2Input {
  periodLabel: string;
  behaviorCounts: BehaviorCountItem[];
  evidenceText: string;
}

function compareByDateAsc(left: ParsedDiaryEntry, right: ParsedDiaryEntry): number {
  return left.date.localeCompare(right.date);
}

function buildPeriodLabel(entries: ParsedDiaryEntry[]): string {
  const sortedEntries = [...entries].sort(compareByDateAsc);
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const firstDay = firstEntry ? formatShortDate(firstEntry.date) : "날짜 미정";
  const lastDay = lastEntry ? formatShortDate(lastEntry.date) : "날짜 미정";

  if (firstDay === "날짜 미정" && lastDay === "날짜 미정") {
    return "기간 미정";
  }

  if (firstDay === "날짜 미정") {
    return lastDay;
  }

  if (lastDay === "날짜 미정" || firstDay === lastDay) {
    return firstDay;
  }

  return `${firstDay} ~ ${lastDay}`;
}

function stripListPrefix(value: string): string {
  return value
    .trim()
    .replace(/^(?:[-*•]\s*)?\[(?: |x|X)\]\s*/u, "")
    .replace(/^(?:[-*•]\s+|\d+\.\s+)/u, "")
    .trim();
}

function stripDateExpressions(value: string): string {
  return value
    .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/gu, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\s*[일월화수목금토])?\b/gu, "")
    .replace(/\b\d{1,2}월\s*\d{1,2}일(?:\s*[일월화수목금토])?\b/gu, "")
    .replace(/\b(?:월|화|수|목|금|토|일)요일\b/gu, "");
}

function normalizeEvidenceLine(value: string): string {
  return stripDateExpressions(stripListPrefix(value))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;!?])/gu, "$1")
    .trim();
}

function splitSectionLines(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map(normalizeEvidenceLine)
    .filter(Boolean)
    .slice(0, MAX_LINES_PER_SECTION);
}

function appendSection(lines: string[], label: string, items: string[]): void {
  if (items.length === 0) {
    return;
  }

  lines.push(`${label}:`, ...items.map((item) => `- ${item}`));
}

function buildEntryBlock(entry: ParsedDiaryEntry, index: number): string | undefined {
  const lines = [`[기록 ${index + 1}]`];
  const condition = normalizeEvidenceLine(entry.condition ?? "");
  const exercise = normalizeEvidenceLine(entry.exercise ?? "");

  if (condition) {
    lines.push(`상태: ${condition}`);
  }

  if (exercise) {
    lines.push(`운동: ${exercise}`);
  }

  for (const section of REFLECTION_V2_SOURCE_SECTIONS) {
    appendSection(lines, section.label, splitSectionLines(entry.sections[section.key]));
  }

  return lines.length > 1 ? lines.join("\n") : undefined;
}

function formatBehaviorCounts(items: BehaviorCountItem[]): string[] {
  if (items.length === 0) {
    return ["- 집계된 행동 기록 없음"];
  }

  return items.map((item) => `- ${item.label}: ${item.count}회`);
}

export function buildReflectionV2Input(
  entries: ParsedDiaryEntry[],
  behaviorCounts: BehaviorCountItem[],
): ReflectionV2Input | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const sortedEntries = [...entries].sort(compareByDateAsc);
  const evidenceBlocks = sortedEntries
    .map((entry, index) => buildEntryBlock(entry, index))
    .filter((block): block is string => typeof block === "string");

  if (evidenceBlocks.length === 0) {
    return undefined;
  }

  const periodLabel = buildPeriodLabel(sortedEntries);

  return {
    periodLabel,
    behaviorCounts,
    evidenceText: [
      `기간: ${periodLabel}`,
      "",
      "행동 기록 집계:",
      ...formatBehaviorCounts(behaviorCounts),
      "",
      "기록별 근거:",
      evidenceBlocks.join("\n\n"),
    ].join("\n"),
  };
}
