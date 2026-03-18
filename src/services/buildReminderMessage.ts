import type { ReminderItem } from "../types/diary";
import { formatShortDate } from "../utils/formatShortDate";

function formatReminderLine(item: ReminderItem): string {
  const dateText = formatShortDate(item.latestDate);

  if (item.count >= 2) {
    return `- ${item.text} · ${item.count}회 · ${dateText}`;
  }

  return `- ${item.text} · ${dateText}`;
}

export function buildReminderMessage(items: ReminderItem[]): string {
  const lines = ["🔔 Re:Day", "", "*최근 적어둔 것들*", ""];

  if (items.length === 0) {
    lines.push("- 최근 적어둔 할 일이 없습니다");
    return lines.join("\n");
  }

  for (const item of items) {
    lines.push(formatReminderLine(item));
  }

  return lines.join("\n");
}
