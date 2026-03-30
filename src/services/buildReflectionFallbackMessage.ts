import { formatShortDate } from "../utils/formatShortDate";

interface BuildReflectionFallbackMessageOptions {
  lastDiaryDate?: string;
}

function formatLastDiaryDate(lastDiaryDate: string): string {
  const formattedDate = formatShortDate(lastDiaryDate);

  return formattedDate === "날짜 미정" ? lastDiaryDate : formattedDate;
}

export function buildReflectionFallbackMessage(
  options: BuildReflectionFallbackMessageOptions = {},
): string {
  const lines = ["🌿 Re:Day", "", "이번 회고는 보낼 기록이 없었어."];

  if (options.lastDiaryDate) {
    lines.push(`마지막 기록은 ${formatLastDiaryDate(options.lastDiaryDate)} 이야.`);
  }

  lines.push("", "오늘 한 줄만 남겨두면", "다음 회고부터 다시 이어질 수 있어.");

  return lines.join("\n");
}
