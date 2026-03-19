import type { ReflectionInput } from "./buildReflectionInput";

export interface ReflectionPrompt {
  systemPrompt: string;
  userPrompt: string;
}

const FORBIDDEN_EXAMPLES = [
  "이번 주는 조금 더 쉬어보는 것도 좋겠다",
  "이제 루틴을 만들면 좋겠다",
  "스스로를 너무 몰아붙이지 않은 한 주였다",
  "조금씩 나아지고 있는 흐름이다",
  "3/19 목 병원 방문",
  "운동을 했다",
  "빨래를 했다",
  "문서 정리, 운동, 병원 방문을 했다",
  "행동은 정리에 치우쳤다 (문서를 다시 정리하고 병원도 다녀오고 운동도 조금 함)",
] as const;

const PREFERRED_EXAMPLES = [
  "계획 대비 실행 연결이 약한 흐름이 반복됨 (일정 미룸, 계획 재조정)",
  "행동은 새 시도보다 정리와 대응 중심으로 나타남 (문서 정리, 병원 방문)",
  "실행은 확장보다 유지 성격에 가까운 경향이 남음 (운동, 생활 정비)",
  "상태 인식은 분명하지만 실행 연결은 제한적으로 남음 (피로 인식, 집중 저하)",
] as const;

export function buildReflectionPrompt(input: ReflectionInput): ReflectionPrompt {
  const systemPrompt = [
    "You write Korean reflections for Re:Day.",
    "Reflection means evidence-based pattern extraction, not event summarization.",
    "Use only the supplied diary evidence from facts, actions, thoughts, lessons, and discomforts.",
    "Do not give advice, coaching, encouragement, comfort, motivation, or action suggestions.",
    "Do not write emotionally, poetically, or abstractly unless the diary directly supports it.",
    "Do not invent facts, counts, causes, emotions, or interpretations.",
    "Do not use next steps as the main reflection source.",
    "Do not include dates, weekdays, calendar expressions, or event chronology inside any bullet or summary line.",
    "Do not list events one by one.",
    "If a line can be read as a single event, rewrite it until it becomes a pattern or tendency.",
    "Discard isolated events instead of forcing them into the output.",
    "Keep the category boundaries clear and avoid duplicated meaning across sections.",
    "Every bullet in repeatedFlows, actions, and thoughts must follow this shape: pattern statement + short representative example keywords in parentheses.",
    "Representative examples must be short keyword phrases grounded in the diary, not full diary sentence rewrites.",
    "Keywords inside parentheses must be cleaned noun-like or short phrase forms, such as '문서 정리', '일정 미룸', '피로 인식'.",
    "Never use raw sentences, clauses, quoted diary lines, or long descriptions inside parentheses.",
    "Examples should make the reflection feel tied to the diary without turning into event listing.",
    "repeatedFlows: repeated patterns, recurring direction, or repeated limits across entries.",
    "actions: summarize behavior tendencies in actual actions; never list raw tasks or single events.",
    "actions should be stronger and more operational than repeatedFlows, focusing on what was actually done, delayed, maintained, or handled.",
    "thoughts: recurring thoughts, recognitions, lessons, or judgments explicitly written, with a brief representative example.",
    "summary: one or two short lines that state the overall contrast or flow directly.",
    "Prefer short and direct Korean wording.",
    "Avoid vague lines such as '전반적으로 비슷한 흐름' or '어느 정도 유지되는 모습'.",
    "Avoid abstract lines that are not tied to representative examples.",
    "If evidence is limited, state that the record is limited instead of inventing details.",
    "Good pattern wording often uses terms like 흐름, 경향, 제한, 중심, 반복, 이어짐, 상태.",
    "Before finalizing each line, check: no date, no single event, no diary sentence rewrite, no advice.",
    "Return JSON only. Do not use markdown fences.",
    'JSON schema: {"repeatedFlows":[{"pattern":"...","exampleKeywords":["...","..."]}],"actions":[{"pattern":"...","exampleKeywords":["...","..."]}],"thoughts":[{"pattern":"...","exampleKeywords":["...","..."]}],"summary":["..."]}',
    "repeatedFlows, actions, thoughts: 1 to 3 items each.",
    "Each exampleKeywords array must contain 1 to 3 cleaned keywords.",
    "summary: 1 or 2 items.",
  ].join("\n");

  const userPrompt = [
    "아래 일지 근거만 사용해서 Re:Day reflection 항목을 작성하세요.",
    "중요 규칙:",
    "- 근거 기반 / 비조언형 / 비감성형",
    "- 미화, 위로, 코칭, 동기부여 금지",
    "- 추측, 일반론, 원인 단정 금지",
    "- 다음에 할 것(nextSteps)은 주된 근거로 사용 금지",
    "- bullet 안에 날짜, 요일, 달력 표현을 절대 넣지 말 것",
    "- 사건 단위 나열 금지, 반드시 반복 패턴이나 경향으로 변환할 것",
    "- 실제 행동도 할 일/사건 목록이 아니라 어떤 행동 경향이 있었는지로 요약할 것",
    "- 각 bullet은 반드시 `패턴 설명 (대표 예시)` 구조로 작성할 것",
    "- 대표 예시는 문장 금지, 정제된 키워드 1~3개만 사용할 것",
    "- 괄호 안은 명사형 또는 짧은 구 형태로만 작성할 것",
    "- 추상적인 문장만 쓰지 말고, 예시를 붙여서 일지의 질감을 남길 것",
    "- 실제 행동 섹션은 특히 무엇을 처리하고 유지하고 미뤘는지 드러나는 행동 경향으로 작성할 것",
    "- 반복된 흐름 / 실제 행동 / 생각 / 정리의 의미가 서로 겹치지 않게 작성",
    "",
    "금지 표현 예시:",
    ...FORBIDDEN_EXAMPLES.map((example) => `- ${example}`),
    "",
    "선호 표현 예시:",
    ...PREFERRED_EXAMPLES.map((example) => `- ${example}`),
    "",
    "최종 Slack 메시지는 아래 형식으로 렌더링됩니다. 항목 내용만 채우세요.",
    "🌿 Re:Day",
    "",
    `*${input.periodLabel}*`,
    "",
    "📌 반복된 흐름",
    "- ...",
    "",
    "📌 실제 행동",
    "- ...",
    "",
    "📌 생각",
    "- ...",
    "",
    "—",
    "",
    "📌 정리",
    "...",
    "",
    "일지 근거:",
    input.evidenceText,
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
