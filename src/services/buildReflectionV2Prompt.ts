import type { ReflectionV2Input } from "./buildReflectionV2Input";

export interface ReflectionV2Prompt {
  systemPrompt: string;
  userPrompt: string;
}

const FORBIDDEN_EXAMPLES = [
  "이번 주는 조금 더 쉬어보는 것도 좋겠다",
  "스스로를 너무 몰아붙이지 않은 흐름이다",
  "감정적으로 지친 한 주였다",
  "3/19 목 병원 방문이 있었다",
  "운동, 문서 정리, 샤워를 했다",
] as const;

const EXECUTION_PATTERN_EXAMPLES = [
  "계획은 자주 세워지지만 실제 실행 연결은 자주 끊김 / 미실행 반복, 계획 조정",
  "실행은 특정 생활 조건이 맞을 때만 시작되는 경향이 있음 / 출퇴근 독서, 식사 후 샤워",
  "실행은 확장보다 정리와 대응 쪽으로 모이는 흐름이 반복됨 / 정리 작업, 확인 처리",
] as const;

const FEATURE_EXAMPLES = [
  "생활 전환 시도가 단발성으로 끝나지 않고 반복해서 다시 등장함 / 샤워, 수면 조정",
  "실행 시작 조건이 분명한 행동만 비교적 안정적으로 이어짐 / 출퇴근 독서, 운동",
] as const;

export function buildReflectionV2Prompt(input: ReflectionV2Input): ReflectionV2Prompt {
  const systemPrompt = [
    "You write Korean behavior-based pattern reports for Re:Day.",
    "This is not emotional writing, diary rewriting, self-help coaching, or interpretation-heavy reflection.",
    "Use only the supplied diary evidence and behavior counts.",
    "The final Slack format is rendered in code, so you must generate only three parts: executionPatterns, optional features, and summary.",
    "Do not generate the 행동 기록 section.",
    "executionPatterns must explain repeated execution structure such as how action starts, how it stops, what conditions affect execution, or what repeats in the action flow.",
    "features is optional and should only contain clearly notable points, unusual transitions, meaningful attempts, or visible turning points.",
    "If features are weak, repetitive, generic, or unsupported, return an empty array.",
    "summary must only compress what already appeared in executionPatterns, features, or the supplied behavior counts.",
    "Do not add new information in summary.",
    "Do not give advice, comfort, encouragement, self-improvement suggestions, or emotional interpretation.",
    "Do not rewrite raw diary sentences.",
    "Do not include exact dates, weekdays, calendar references, or chronology phrases inside summary or evidence.",
    "Keep sentences short and grounded.",
    "Every item must have a short summary and a short evidence string.",
    "Evidence must be a short normalized keyword phrase, not a raw sentence.",
    "Avoid repeating the count table as-is. Use it only as support for pattern extraction.",
    "Avoid vague abstractions such as '전체적으로 비슷함' or '조금씩 나아짐'.",
    "Return JSON only. Do not use markdown fences.",
    'JSON schema: {"executionPatterns":[{"summary":"...","evidence":"..."}],"features":[{"summary":"...","evidence":"..."}],"summary":["..."]}',
    "executionPatterns: 1 to 3 items.",
    "features: 0 to 2 items.",
    "summary: 1 or 2 short lines.",
  ].join("\n");

  const userPrompt = [
    "아래 근거를 바탕으로 Reflection V2용 항목만 작성하세요.",
    "중요 규칙:",
    "- 감성 문장 금지",
    "- 조언 금지",
    "- 과한 해석 금지",
    "- 사건 나열 금지",
    "- 날짜/요일/달력 표현 금지",
    "- 행동 기록 섹션은 코드에서 렌더링되므로 생성하지 말 것",
    "- 실행 패턴은 구조 중심으로 작성할 것",
    "- 특징은 약하면 생략할 것",
    "- 각 항목은 반드시 summary + evidence 구조일 것",
    "- evidence는 짧은 키워드 구만 사용할 것",
    "",
    "금지 예시:",
    ...FORBIDDEN_EXAMPLES.map((example) => `- ${example}`),
    "",
    "실행 패턴 선호 예시:",
    ...EXECUTION_PATTERN_EXAMPLES.map((example) => `- ${example}`),
    "",
    "특징 선호 예시:",
    ...FEATURE_EXAMPLES.map((example) => `- ${example}`),
    "",
    "최종 Slack 메시지는 아래 형식으로 코드에서 렌더링됩니다.",
    "🌿 Re:Day",
    "",
    `*${input.periodLabel}*`,
    "",
    "📌 실행 패턴",
    "- {summary}",
    "  ({evidence})",
    "",
    "📌 행동 기록",
    "- {code rendered}",
    "",
    "📌 특징",
    "- {summary}",
    "  ({evidence})",
    "",
    "—",
    "",
    "📌 정리",
    "{summary line}",
    "",
    "근거:",
    input.evidenceText,
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
