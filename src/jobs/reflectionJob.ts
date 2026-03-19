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
}

export async function runReflectionJob(
  entries: ParsedDiaryEntry[],
  options: RunReflectionJobOptions = {},
): Promise<string> {
  const selectedEntries = selectReflectionEntries(entries, {
    afterDate: options.afterDate,
  });

  if (selectedEntries.length === 0) {
    return EMPTY_REFLECTION_MESSAGE;
  }

  const reflectionInput = buildReflectionInput(selectedEntries);

  if (!reflectionInput) {
    return EMPTY_REFLECTION_MESSAGE;
  }

  return generateReflectionMessage(reflectionInput);
}
