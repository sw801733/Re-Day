import type { ParsedDiaryEntry } from "../types/diary";

type BehaviorSource = "exercise" | "facts" | "actions" | "discomforts";

interface BehaviorEvidenceLine {
  source: BehaviorSource;
  text: string;
}

interface BehaviorRule {
  label: string;
  sources: readonly BehaviorSource[];
  allOf?: readonly RegExp[];
  anyOf?: readonly RegExp[];
}

export interface BehaviorCountItem {
  label: string;
  count: number;
}

const MAX_BEHAVIOR_COUNT_ITEMS = 6;

const BEHAVIOR_RULES = [
  {
    label: "출퇴근 독서",
    sources: ["facts", "actions"],
    allOf: [/(출퇴근|통근|이동|지하철|버스)/u, /(독서|책|읽기|읽음|읽었다)/u],
  },
  {
    label: "운동",
    sources: ["exercise", "facts", "actions"],
    anyOf: [/(운동|헬스|러닝|달리기|걷기|산책|스트레칭|요가|필라테스|수영|자전거|홈트)/u],
  },
  {
    label: "병원/건강 관리",
    sources: ["facts", "actions"],
    anyOf: [/(병원|진료|약국|복약|검사|치료|재활|물리치료|건강검진|상담)/u],
  },
  {
    label: "생활 전환 시도",
    sources: ["facts", "actions"],
    anyOf: [/(샤워|씻기|세수|식사|기상|취침|수면 조정|생활 리듬|루틴|생활 정비|전환)/u],
  },
  {
    label: "휴식/회복",
    sources: ["facts", "actions"],
    anyOf: [/(휴식|쉬기|쉼|회복|낮잠|수면 보충|일찍 잠|멍하니)/u],
  },
  {
    label: "정리/관리",
    sources: ["facts", "actions"],
    anyOf: [/(정리|정돈|청소|빨래|설거지|문서|노트 정리|기록 정리|파일 정리|폴더 정리)/u],
  },
  {
    label: "업무/행정 처리",
    sources: ["facts", "actions"],
    anyOf: [/(문의|연락|답장|예약|신청|제출|확인|전화|서류|등록|세팅|처리)/u],
  },
  {
    label: "학습/탐색",
    sources: ["facts", "actions"],
    anyOf: [/(공부|학습|강의|리서치|조사|탐색|찾아보|자료 확인|검색)/u],
  },
  {
    label: "계획 대비 미실행",
    sources: ["discomforts"],
    anyOf: [/(미실행|못함|못 했다|못했다|안 함|안함|미룸|미뤘|연기|보류|중단|놓침|지키지 못|이어가지 못|실행 못|계획만)/u],
  },
] as const satisfies ReadonlyArray<BehaviorRule>;

function stripListPrefix(value: string): string {
  return value
    .trim()
    .replace(/^(?:[-*•]\s*)?\[(?: |x|X)\]\s*/u, "")
    .replace(/^(?:[-*•]\s+|\d+\.\s+)/u, "")
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
  return stripDateExpressions(stripListPrefix(value))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;!?])/gu, "$1")
    .trim();
}

function splitSectionLines(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value.split("\n").map(normalizeLineText).filter(Boolean);
}

function buildEvidenceLines(entry: ParsedDiaryEntry): BehaviorEvidenceLine[] {
  const evidenceLines: BehaviorEvidenceLine[] = [];
  const exercise = normalizeLineText(entry.exercise ?? "");

  if (exercise) {
    evidenceLines.push({
      source: "exercise",
      text: exercise,
    });
  }

  for (const text of splitSectionLines(entry.sections.facts)) {
    evidenceLines.push({ source: "facts", text });
  }

  for (const text of splitSectionLines(entry.sections.actions)) {
    evidenceLines.push({ source: "actions", text });
  }

  for (const text of splitSectionLines(entry.sections.discomforts)) {
    evidenceLines.push({ source: "discomforts", text });
  }

  return evidenceLines;
}

function matchesRule(rule: BehaviorRule, line: BehaviorEvidenceLine): boolean {
  if (!rule.sources.includes(line.source)) {
    return false;
  }

  if (rule.allOf && !rule.allOf.every((pattern) => pattern.test(line.text))) {
    return false;
  }

  if (rule.anyOf && !rule.anyOf.some((pattern) => pattern.test(line.text))) {
    return false;
  }

  return true;
}

export function buildBehaviorCounts(entries: ParsedDiaryEntry[]): BehaviorCountItem[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const evidenceLines = buildEvidenceLines(entry);
    const matchedLabels = new Set<string>();

    for (const rule of BEHAVIOR_RULES) {
      if (evidenceLines.some((line) => matchesRule(rule, line))) {
        matchedLabels.add(rule.label);
      }
    }

    for (const label of matchedLabels) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      const leftIndex = BEHAVIOR_RULES.findIndex((rule) => rule.label === left.label);
      const rightIndex = BEHAVIOR_RULES.findIndex((rule) => rule.label === right.label);

      return leftIndex - rightIndex;
    })
    .slice(0, MAX_BEHAVIOR_COUNT_ITEMS);
}
