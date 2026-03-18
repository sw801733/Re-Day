const DAY_OF_WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function parseDateParts(
  value: string,
): { year: number; month: number; day: number } | undefined {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return undefined;
  }

  return { year, month, day };
}

export function formatShortDate(value: string): string {
  const parts = parseDateParts(value);

  if (!parts) {
    return "날짜 미정";
  }

  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();

  return `${parts.month}/${parts.day} ${DAY_OF_WEEK_LABELS[weekday]}`;
}
