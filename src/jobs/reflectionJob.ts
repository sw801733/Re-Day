import { buildReflectionInput } from "../services/buildReflectionInput";
import { generateReflectionMessage } from "../services/generateReflectionMessage";
import { selectReflectionEntries } from "../services/selectReflectionEntries";
import type { ParsedDiaryEntry } from "../types/diary";

const EMPTY_REFLECTION_MESSAGE = [
  "🌿 Re:Day",
  "",
  "*최근 기록 없음*",
  "",
  "최근 회고를 만들 기록이 충분하지 않습니다",
].join("\n");

export interface RunReflectionJobOptions {
  afterDate?: string;
  todayDate?: string;
}

export interface ReflectionJobResult {
  message?: string;
  selectedEntryCount: number;
}

export async function runReflectionJob(
  entries: ParsedDiaryEntry[],
  options: RunReflectionJobOptions = {},
): Promise<string> {
  const result = await prepareReflectionJob(entries, options);

  return result.message ?? EMPTY_REFLECTION_MESSAGE;
}

export async function prepareReflectionJob(
  entries: ParsedDiaryEntry[],
  options: RunReflectionJobOptions = {},
): Promise<ReflectionJobResult> {
  const selectedEntries = selectReflectionEntries(entries, {
    afterDate: options.afterDate,
    todayDate: options.todayDate,
  });

  if (selectedEntries.length === 0) {
    return {
      selectedEntryCount: 0,
    };
  }

  const reflectionInput = buildReflectionInput(selectedEntries);

  if (!reflectionInput) {
    return {
      selectedEntryCount: selectedEntries.length,
    };
  }

  return {
    message: await generateReflectionMessage(reflectionInput),
    selectedEntryCount: selectedEntries.length,
  };
}
