export function buildReminderFallbackMessage(): string {
  return [
    "🔔 Re:Day",
    "",
    '최근 적어둔 "다음에 할 것"이 없어.',
    "",
    "오늘 떠오른 거 하나만 적어두면",
    "다음 리마인더에 다시 보여줄게.",
  ].join("\n");
}
