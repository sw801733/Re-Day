import type { ParsedDiaryEntry } from "../types/diary";
import { formatShortDate } from "../utils/formatShortDate";

type ReflectionSourceSectionKey =
  | "facts"
  | "actions"
  | "thoughts"
  | "lessons"
  | "discomforts";

const REFLECTION_SOURCE_SECTIONS = [
  { key: "facts", label: "오늘 있었던 일" },
  { key: "actions", label: "실제로 행동한 일" },
  { key: "thoughts", label: "떠오른 생각" },
  { key: "lessons", label: "배운 것" },
  { key: "discomforts", label: "불편한 것 / 막힌 것" },
] as const satisfies ReadonlyArray<{
  key: ReflectionSourceSectionKey;
  label: string;
}>;

export interface ReflectionInput {
  periodLabel: string;
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

function appendSection(lines: string[], label: string, content: string | undefined): void {
  const normalized = content?.trim();

  if (!normalized) {
    return;
  }

  lines.push("", `${label}:`, normalized);
}

function buildEntryBlock(entry: ParsedDiaryEntry, index: number): string {
  const lines = [
    `[일지 ${index + 1}]`,
    `날짜: ${formatShortDate(entry.date)}`,
    `제목: ${entry.title}`,
  ];

  if (entry.condition?.trim()) {
    lines.push(`컨디션: ${entry.condition.trim()}`);
  }

  if (entry.exercise?.trim()) {
    lines.push(`운동: ${entry.exercise.trim()}`);
  }

  for (const section of REFLECTION_SOURCE_SECTIONS) {
    appendSection(lines, section.label, entry.sections[section.key]);
  }

  return lines.join("\n");
}

export function buildReflectionInput(entries: ParsedDiaryEntry[]): ReflectionInput | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const sortedEntries = [...entries].sort(compareByDateAsc);
  const evidenceBlocks = sortedEntries.map((entry, index) => buildEntryBlock(entry, index));

  if (evidenceBlocks.length === 0) {
    return undefined;
  }

  const periodLabel = buildPeriodLabel(sortedEntries);

  return {
    periodLabel,
    evidenceText: [`기간: ${periodLabel}`, ...evidenceBlocks].join("\n\n"),
  };
}
