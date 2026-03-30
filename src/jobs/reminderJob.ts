import { buildReminderFallbackMessage } from "../services/buildReminderFallbackMessage";
import { buildReminderMessage } from "../services/buildReminderMessage";
import { groupReminderItems } from "../services/groupReminderItems";
import type { ParsedDiaryEntry, ReminderItem } from "../types/diary";

export const RECENT_ENTRY_COUNT = 3;

export interface ReminderJobResult {
  message: string;
  itemCount: number;
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

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return -1;
  }

  return year * 10000 + month * 100 + day;
}

function sortEntriesByDateDesc(entries: ParsedDiaryEntry[]): ParsedDiaryEntry[] {
  return [...entries].sort((left, right) => getDateRank(right.date) - getDateRank(left.date));
}

function sortReminderItems(items: ReminderItem[]): ReminderItem[] {
  return [...items].sort((left, right) => {
    if (left.count !== right.count) {
      return right.count - left.count;
    }

    const dateDifference = getDateRank(right.latestDate) - getDateRank(left.latestDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return left.text.localeCompare(right.text, "ko");
  });
}

export function runReminderJob(entries: ParsedDiaryEntry[]): string {
  return prepareReminderJob(entries).message;
}

export function prepareReminderJob(entries: ParsedDiaryEntry[]): ReminderJobResult {
  const recentEntries = sortEntriesByDateDesc(entries).slice(0, RECENT_ENTRY_COUNT);
  const groupedItems = groupReminderItems(recentEntries);
  const sortedItems = sortReminderItems(groupedItems);

  if (sortedItems.length === 0) {
    return {
      message: buildReminderFallbackMessage(),
      itemCount: 0,
    };
  }

  return {
    message: buildReminderMessage(sortedItems),
    itemCount: sortedItems.length,
  };
}
