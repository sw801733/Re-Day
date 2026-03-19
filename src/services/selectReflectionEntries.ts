import type { ParsedDiaryEntry } from "../types/diary";

export const REFLECTION_RECENT_ENTRY_COUNT = 3;

const MINIMUM_REFLECTION_ENTRY_COUNT = 2;

interface SelectReflectionEntriesOptions {
  afterDate?: string;
  recentEntryCount?: number;
  todayDate?: string;
}

function getDateRank(value: string): number {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) {
    return -1;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return -1;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return -1;
  }

  return year * 10000 + month * 100 + day;
}

function hasReflectionEvidence(entry: ParsedDiaryEntry): boolean {
  return entry.summarySourceText.trim().length > 0;
}

function getCurrentKstDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("현재 KST 날짜를 계산하지 못했습니다.");
  }

  return `${year}-${month}-${day}`;
}

function sortEntriesByDateDesc(entries: ParsedDiaryEntry[]): ParsedDiaryEntry[] {
  return [...entries].sort((left, right) => getDateRank(right.date) - getDateRank(left.date));
}

export function selectReflectionEntries(
  entries: ParsedDiaryEntry[],
  options: SelectReflectionEntriesOptions = {},
): ParsedDiaryEntry[] {
  const recentEntryCount = options.recentEntryCount ?? REFLECTION_RECENT_ENTRY_COUNT;
  const todayDate = options.todayDate ?? getCurrentKstDate();
  const todayDateRank = getDateRank(todayDate);
  const sortedEvidenceEntries = sortEntriesByDateDesc(entries)
    .filter(hasReflectionEvidence)
    .filter((entry) => {
      const entryDateRank = getDateRank(entry.date);

      if (entryDateRank < 0) {
        return false;
      }

      if (todayDateRank < 0) {
        return true;
      }

      return entryDateRank < todayDateRank;
    });

  if (sortedEvidenceEntries.length < MINIMUM_REFLECTION_ENTRY_COUNT) {
    return [];
  }

  const afterDateRank = options.afterDate ? getDateRank(options.afterDate) : -1;

  if (afterDateRank >= 0) {
    const entriesAfterLastReflection = sortedEvidenceEntries.filter(
      (entry) => getDateRank(entry.date) > afterDateRank,
    );

    return entriesAfterLastReflection.length >= MINIMUM_REFLECTION_ENTRY_COUNT
      ? entriesAfterLastReflection
      : [];
  }

  return sortedEvidenceEntries.slice(0, recentEntryCount);
}
