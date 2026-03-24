import { buildBehaviorCounts } from "../services/buildBehaviorCounts";
import { buildReflectionV2Input } from "../services/buildReflectionV2Input";
import { generateReflectionV2 } from "../services/generateReflectionV2";
import { renderReflectionV2 } from "../services/renderReflectionV2";
import { selectReflectionEntries } from "../services/selectReflectionEntries";
import type { ParsedDiaryEntry } from "../types/diary";

const EMPTY_REFLECTION_V2_MESSAGE = [
  "🌿 Re:Day",
  "",
  "*최근 기록 없음*",
  "",
  "Reflection V2를 만들 기록이 충분하지 않습니다",
].join("\n");

export interface RunReflectionV2JobOptions {
  afterDate?: string;
  todayDate?: string;
}

export interface ReflectionV2JobResult {
  message?: string;
  selectedEntryCount: number;
  behaviorCountCount: number;
}

export async function runReflectionV2Job(
  entries: ParsedDiaryEntry[],
  options: RunReflectionV2JobOptions = {},
): Promise<string> {
  const result = await prepareReflectionV2Job(entries, options);

  return result.message ?? EMPTY_REFLECTION_V2_MESSAGE;
}

export async function prepareReflectionV2Job(
  entries: ParsedDiaryEntry[],
  options: RunReflectionV2JobOptions = {},
): Promise<ReflectionV2JobResult> {
  const selectedEntries = selectReflectionEntries(entries, {
    afterDate: options.afterDate,
    todayDate: options.todayDate,
  });

  if (selectedEntries.length === 0) {
    return {
      selectedEntryCount: 0,
      behaviorCountCount: 0,
    };
  }

  const behaviorCounts = buildBehaviorCounts(selectedEntries);
  const reflectionInput = buildReflectionV2Input(selectedEntries, behaviorCounts);

  if (!reflectionInput) {
    return {
      selectedEntryCount: selectedEntries.length,
      behaviorCountCount: behaviorCounts.length,
    };
  }

  const generatedReflection = await generateReflectionV2(reflectionInput);
  const message = renderReflectionV2({
    periodLabel: reflectionInput.periodLabel,
    executionPatterns: generatedReflection.executionPatterns,
    behaviorCounts,
    features: generatedReflection.features,
    summary: generatedReflection.summary,
  });

  return {
    message,
    selectedEntryCount: selectedEntries.length,
    behaviorCountCount: behaviorCounts.length,
  };
}
