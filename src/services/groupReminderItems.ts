import type { ParsedDiaryEntry, ReminderItem } from "../types/diary";

export function groupReminderItems(entries: ParsedDiaryEntry[]): ReminderItem[] {
  const groupedItems = new Map<string, ReminderItem>();

  for (const entry of entries) {
    for (const nextStep of entry.nextStepsList) {
      const text = nextStep.trim();

      if (!text) {
        continue;
      }

      const existingItem = groupedItems.get(text);

      if (existingItem) {
        existingItem.count += 1;
        continue;
      }

      groupedItems.set(text, {
        text,
        count: 1,
        latestDate: entry.date,
      });
    }
  }

  return [...groupedItems.values()];
}
