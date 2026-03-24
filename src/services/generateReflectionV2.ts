import { createOpenAIChatCompletion } from "../clients/openaiClient";
import type { ReflectionV2Input } from "./buildReflectionV2Input";
import { buildReflectionV2Prompt } from "./buildReflectionV2Prompt";

export interface ReflectionV2LineItem {
  summary: string;
  evidence: string;
}

export interface ReflectionV2ModelOutput {
  executionPatterns: ReflectionV2LineItem[];
  features?: ReflectionV2LineItem[];
  summary: string[];
}

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function stripDateExpressions(value: string): string {
  return value
    .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/gu, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\s*[일월화수목금토])?\b/gu, "")
    .replace(/\b\d{1,2}월\s*\d{1,2}일(?:\s*[일월화수목금토])?\b/gu, "")
    .replace(/\b(?:월|화|수|목|금|토|일)요일\b/gu, "");
}

function normalizeLineText(value: string): string {
  return stripDateExpressions(value)
    .replace(/^[\s\-*•]+/u, "")
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/gu, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;!?])/gu, "$1")
    .trim();
}

function normalizeSummaryText(value: string): string {
  return normalizeLineText(value)
    .replace(/\((?:[^()]*)\)\s*$/u, "")
    .replace(/[.。]+$/u, "")
    .trim();
}

function normalizeEvidenceText(value: string): string {
  return normalizeLineText(value)
    .replace(/^[\(（]\s*/u, "")
    .replace(/\s*[\)）]$/u, "")
    .replace(/^(?:근거|evidence)\s*[:：]\s*/iu, "")
    .replace(/[.。]+$/u, "")
    .trim();
}

function deduplicateSummaryLines(items: string[]): string[] {
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

function deduplicateLineItems(items: ReflectionV2LineItem[]): ReflectionV2LineItem[] {
  const uniqueItems: ReflectionV2LineItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = `${item.summary}__${item.evidence}`.replace(/\s+/g, " ").trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReflectionV2ItemArray(
  value: unknown,
): value is Array<{ summary?: unknown; evidence?: unknown }> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

function parseLineItemFromString(value: string): ReflectionV2LineItem | undefined {
  const normalized = normalizeLineText(value);

  if (!normalized) {
    return undefined;
  }

  const parentheticalMatch = normalized.match(/^(.*?)[(（]([^()（）]+)[)）]\s*$/u);

  if (parentheticalMatch) {
    const summary = normalizeSummaryText(parentheticalMatch[1] ?? "");
    const evidence = normalizeEvidenceText(parentheticalMatch[2] ?? "");

    if (!summary || !evidence) {
      return undefined;
    }

    return { summary, evidence };
  }

  const evidenceSplit = normalized.match(/^(.*?)\s*(?:근거|evidence)\s*[:：]\s*(.+)$/iu);

  if (!evidenceSplit) {
    return undefined;
  }

  const summary = normalizeSummaryText(evidenceSplit[1] ?? "");
  const evidence = normalizeEvidenceText(evidenceSplit[2] ?? "");

  if (!summary || !evidence) {
    return undefined;
  }

  return { summary, evidence };
}

function normalizeLineItems(value: unknown, maxLength: number): ReflectionV2LineItem[] {
  if (isReflectionV2ItemArray(value)) {
    return deduplicateLineItems(
      value
        .map((item) => {
          const summary = normalizeSummaryText(typeof item.summary === "string" ? item.summary : "");
          const evidence = normalizeEvidenceText(
            typeof item.evidence === "string" ? item.evidence : "",
          );

          if (!summary || !evidence) {
            return undefined;
          }

          return { summary, evidence };
        })
        .filter((item): item is ReflectionV2LineItem => Boolean(item)),
    ).slice(0, maxLength);
  }

  if (!isStringArray(value)) {
    return [];
  }

  return deduplicateLineItems(
    value
      .map(parseLineItemFromString)
      .filter((item): item is ReflectionV2LineItem => Boolean(item)),
  ).slice(0, maxLength);
}

function normalizeSummaryLines(value: unknown, maxLength: number): string[] {
  if (typeof value === "string") {
    const summary = normalizeSummaryText(value);
    return summary ? [summary] : [];
  }

  if (!isStringArray(value)) {
    return [];
  }

  return deduplicateSummaryLines(value.map(normalizeSummaryText).filter(Boolean)).slice(
    0,
    maxLength,
  );
}

function isWeakFeature(item: ReflectionV2LineItem): boolean {
  const combined = `${item.summary} ${item.evidence}`;

  return /(특징 없음|두드러지지 않|판단 어려움|약함|크지 않|특별하지 않|드러나지 않)/u.test(
    combined,
  );
}

function parseReflectionV2Output(rawContent: string): ReflectionV2ModelOutput {
  try {
    const parsed = JSON.parse(stripCodeFences(rawContent)) as Record<string, unknown>;
    const executionPatterns = normalizeLineItems(parsed.executionPatterns, 3);
    const features = normalizeLineItems(parsed.features, 2)
      .filter((item) => !isWeakFeature(item))
      .filter(
        (item) =>
          !executionPatterns.some(
            (executionPattern) => executionPattern.summary === item.summary,
          ),
      );
    const summary = normalizeSummaryLines(parsed.summary, 2);

    if (executionPatterns.length === 0 || summary.length === 0) {
      throw new Error("필수 섹션이 비어 있습니다.");
    }

    return {
      executionPatterns,
      features,
      summary,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`OpenAI reflection V2 응답을 파싱하지 못했습니다. ${error.message}`);
    }

    throw new Error("OpenAI reflection V2 응답을 파싱하지 못했습니다.");
  }
}

function buildFallbackOutput(): ReflectionV2ModelOutput {
  return {
    executionPatterns: [
      {
        summary: "실행 패턴을 자동 정리하지 못함",
        evidence: "모델 응답 해석 실패",
      },
    ],
    summary: ["실행 패턴 자동 정리가 제한된 상태로 반환됨"],
  };
}

export async function generateReflectionV2(
  input: ReflectionV2Input,
): Promise<ReflectionV2ModelOutput> {
  const prompt = buildReflectionV2Prompt(input);

  try {
    const rawContent = await createOpenAIChatCompletion(prompt.systemPrompt, prompt.userPrompt);
    return parseReflectionV2Output(rawContent);
  } catch {
    return buildFallbackOutput();
  }
}
