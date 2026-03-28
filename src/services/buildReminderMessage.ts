import type { ReminderItem } from "../types/diary";
import { formatShortDate } from "../utils/formatShortDate";

interface ReminderDateGroup {
  date: string;
  items: string[];
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

function buildReminderDateGroups(items: ReminderItem[]): ReminderDateGroup[] {
  const groups = new Map<string, ReminderDateGroup>();

  for (const item of items) {
    const existingGroup = groups.get(item.latestDate);

    if (existingGroup) {
      existingGroup.items.push(item.text);
      continue;
    }

    groups.set(item.latestDate, {
      date: item.latestDate,
      items: [item.text],
    });
  }

  return [...groups.values()].sort((left, right) => getDateRank(right.date) - getDateRank(left.date));
}

export function buildReminderMessage(items: ReminderItem[]): string {
  const lines = [":bell: Re:Day", "", "—", ""];

  if (items.length === 0) {
    lines.push("최근 적어둔 할 일이 없습니다");
    return lines.join("\n");
  }

  const groups = buildReminderDateGroups(items);

  for (const [index, group] of groups.entries()) {
    lines.push(`🗓️ *${formatShortDate(group.date)}*`);

    for (const text of group.items) {
      lines.push(`• ${text}`);
    }

    if (index < groups.length - 1) {
      lines.push("");
    }
  }

  return lines.join("\n");
}
