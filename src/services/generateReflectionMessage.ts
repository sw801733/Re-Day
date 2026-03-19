import { createOpenAIChatCompletion } from "../clients/openaiClient";
import type { ReflectionInput } from "./buildReflectionInput";
import { buildReflectionPrompt } from "./buildReflectionPrompt";

interface ReflectionBulletItem {
  pattern: string;
  exampleKeywords: string[];
}

interface ReflectionSections {
  repeatedFlows: ReflectionBulletItem[];
  actions: ReflectionBulletItem[];
  thoughts: ReflectionBulletItem[];
  summary: string[];
}

function stripDateExpressions(value: string): string {
  return value
    .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/gu, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\s*[일월화수목금토])?\b/gu, "")
    .replace(/\b\d{1,2}월\s*\d{1,2}일(?:\s*[일월화수목금토])?\b/gu, "");
}

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function normalizeLineText(value: string): string {
  return stripDateExpressions(value)
    .replace(/^[\s\-*•]+/u, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;!?])/gu, "$1")
    .trim();
}

function normalizePatternText(value: string): string {
  return normalizeLineText(value)
    .replace(/\((?:[^()]*)\)\s*$/u, "")
    .replace(/(?:대표\s*예시|예시|예)\s*[:：]\s*.+$/u, "")
    .trim();
}

function normalizeExampleShape(value: string): { pattern: string; rawExamples: string } | undefined {
  const normalized = normalizeLineText(value);

  if (!normalized) {
    return undefined;
  }

  const parentheticalMatch = normalized.match(/^(.*?)[(（]([^()（）]+)[)）]\s*$/u);

  if (parentheticalMatch) {
    const pattern = parentheticalMatch[1]?.trim();
    const rawExamples = parentheticalMatch[2]?.trim();

    if (!pattern || !rawExamples) {
      return undefined;
    }

    return { pattern, rawExamples };
  }

  const exampleMatch = normalized.match(
    /^(.*?)(?:\s*(?:대표\s*예시|예시|예)\s*[:：]\s*)(.+)$/u,
  );

  if (!exampleMatch) {
    return undefined;
  }

  const patternText = exampleMatch[1]?.trim();
  const exampleText = exampleMatch[2]?.trim();

  if (!patternText || !exampleText) {
    return undefined;
  }

  return {
    pattern: patternText,
    rawExamples: exampleText,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isDefinedString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function isReflectionBulletArray(
  value: unknown,
): value is Array<{ pattern?: unknown; exampleKeywords?: unknown }> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

function deduplicateLines(items: string[]): string[] {
  const uniqueItems: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = item.replace(/\s+/g, " ").trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function sanitizeExampleKeyword(value: string): string | undefined {
  const normalized = normalizeLineText(value)
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/gu, "")
    .replace(/\b(?:예시|예)\b\s*[:：]?/gu, "")
    .replace(/\s*(?:등|위주|중심|느낌|같음|같다)$/u, "")
    .trim();

  if (!normalized) {
    return undefined;
  }

  const seemsSentenceLike =
    /[.?!]$/u.test(normalized) ||
    /(습니다|했다|하였다|했다가|하고 있다|하고있다|한다|된다|되었다|였다|이었다)$/u.test(
      normalized,
    );

  if (seemsSentenceLike) {
    return undefined;
  }

  const wordCount = normalized.split(/\s+/u).filter(Boolean).length;

  if (wordCount > 4 || normalized.length > 18) {
    return undefined;
  }

  return normalized;
}

function normalizeExampleKeywords(value: unknown, maxLength: number): string[] {
  if (!isStringArray(value)) {
    return [];
  }

  return deduplicateLines(value.map(sanitizeExampleKeyword).filter(isDefinedString)).slice(
    0,
    maxLength,
  );
}

function normalizeBulletItemsFromObjects(
  value: unknown,
  maxLength: number,
): ReflectionBulletItem[] {
  if (!isReflectionBulletArray(value)) {
    return [];
  }

  const items: ReflectionBulletItem[] = [];

  for (const item of value) {
    const pattern = normalizePatternText(typeof item.pattern === "string" ? item.pattern : "");
    const exampleKeywords = normalizeExampleKeywords(item.exampleKeywords, 3);

    if (!pattern || exampleKeywords.length === 0) {
      continue;
    }

    items.push({ pattern, exampleKeywords });

    if (items.length >= maxLength) {
      break;
    }
  }

  return items;
}

function normalizeBulletItemsFromStrings(
  value: unknown,
  maxLength: number,
): ReflectionBulletItem[] {
  if (!isStringArray(value)) {
    return [];
  }

  const items: ReflectionBulletItem[] = [];

  for (const rawItem of value) {
    const parsed = normalizeExampleShape(rawItem);

    if (!parsed) {
      continue;
    }

    const pattern = normalizePatternText(parsed.pattern);
    const exampleKeywords = deduplicateLines(
      parsed.rawExamples
        .split(/[,/·|]/u)
        .flatMap((part) => part.split(/\s*(?:및|그리고)\s*/u))
        .map(sanitizeExampleKeyword)
        .filter(isDefinedString),
    ).slice(0, 3);

    if (!pattern || exampleKeywords.length === 0) {
      continue;
    }

    items.push({ pattern, exampleKeywords });

    if (items.length >= maxLength) {
      break;
    }
  }

  return items;
}

function normalizeBulletItems(value: unknown, maxLength: number): ReflectionBulletItem[] {
  const fromObjects = normalizeBulletItemsFromObjects(value, maxLength);

  if (fromObjects.length > 0) {
    return fromObjects;
  }

  return normalizeBulletItemsFromStrings(value, maxLength);
}

function normalizeSummaryLines(value: unknown, maxLength: number): string[] {
  if (!isStringArray(value)) {
    return [];
  }

  return deduplicateLines(value.map(normalizeLineText).filter(Boolean)).slice(0, maxLength);
}

function parseReflectionSections(rawContent: string): ReflectionSections {
  try {
    const parsed = JSON.parse(stripCodeFences(rawContent)) as Record<string, unknown>;
    const repeatedFlows = normalizeBulletItems(parsed.repeatedFlows, 3);
    const actions = normalizeBulletItems(parsed.actions, 3);
    const thoughts = normalizeBulletItems(parsed.thoughts, 3);
    const summary = normalizeSummaryLines(parsed.summary, 2);

    if (
      repeatedFlows.length === 0 ||
      actions.length === 0 ||
      thoughts.length === 0 ||
      summary.length === 0
    ) {
      throw new Error("필수 섹션이 비어 있습니다.");
    }

    return {
      repeatedFlows,
      actions,
      thoughts,
      summary,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`OpenAI reflection 응답을 파싱하지 못했습니다. ${error.message}`);
    }

    throw new Error("OpenAI reflection 응답을 파싱하지 못했습니다.");
  }
}

function buildReflectionFallbackMessage(periodLabel: string): string {
  return [
    "🌿 Re:Day",
    "",
    `*${periodLabel}*`,
    "",
    "📌 반복된 흐름",
    "- 최근 기록의 반복 흐름을 자동 정리하지 못함",
    "",
    "📌 실제 행동",
    "- 실제 행동 경향을 자동 요약하지 못함",
    "",
    "📌 생각",
    "- 생각 흐름을 자동 요약하지 못함",
    "",
    "—",
    "",
    "📌 정리",
    "회고 응답을 안정적으로 해석하지 못해 안전한 기본 메시지를 반환함",
  ].join("\n");
}

function formatBulletLines(items: ReflectionBulletItem[]): string[] {
  return items.map((item) => `- ${item.pattern} (${item.exampleKeywords.join(", ")})`);
}

function formatReflectionMessage(periodLabel: string, sections: ReflectionSections): string {
  return [
    "🌿 Re:Day",
    "",
    `*${periodLabel}*`,
    "",
    "📌 반복된 흐름",
    ...formatBulletLines(sections.repeatedFlows),
    "",
    "📌 실제 행동",
    ...formatBulletLines(sections.actions),
    "",
    "📌 생각",
    ...formatBulletLines(sections.thoughts),
    "",
    "—",
    "",
    "📌 정리",
    ...sections.summary,
  ].join("\n");
}

export async function generateReflectionMessage(input: ReflectionInput): Promise<string> {
  const prompt = buildReflectionPrompt(input);

  try {
    const rawContent = await createOpenAIChatCompletion(prompt.systemPrompt, prompt.userPrompt);
    const sections = parseReflectionSections(rawContent);

    return formatReflectionMessage(input.periodLabel, sections);
  } catch {
    return buildReflectionFallbackMessage(input.periodLabel);
  }
}
