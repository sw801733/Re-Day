import type { BehaviorCountItem } from "./buildBehaviorCounts";
import type { ReflectionV2LineItem } from "./generateReflectionV2";

interface RenderReflectionV2Options {
  periodLabel: string;
  executionPatterns: ReflectionV2LineItem[];
  behaviorCounts: BehaviorCountItem[];
  features?: ReflectionV2LineItem[];
  summary: string[];
}

function formatPatternLines(items: ReflectionV2LineItem[]): string[] {
  return items.flatMap((item) => [`- ${item.summary}`, `  (${item.evidence})`]);
}

function formatBehaviorCountLines(items: BehaviorCountItem[]): string[] {
  if (items.length === 0) {
    return ["- 집계된 행동 기록 없음"];
  }

  return items.map((item) => `- ${item.label}: ${item.count}회`);
}

export function renderReflectionV2(options: RenderReflectionV2Options): string {
  const lines = [
    "🌿 Re:Day",
    "",
    `*${options.periodLabel}*`,
    "",
    "📌 실행 패턴",
    ...formatPatternLines(options.executionPatterns),
    "",
    "📌 행동 기록",
    ...formatBehaviorCountLines(options.behaviorCounts),
  ];

  if (options.features && options.features.length > 0) {
    lines.push("", "📌 특징", ...formatPatternLines(options.features));
  }

  lines.push("", "—", "", "📌 정리", ...options.summary);

  return lines.join("\n");
}
