
Reflection V2 - Behavior-Based Pattern Report

## Goal

Implement Reflection V2 for Re:Day.

This task introduces a new reflection format that is more structured,
more behavior-focused, and more objective than the current reflection output.

Reflection V2 should produce a behavior-based pattern report.

It should NOT replace the existing Reflection V1 immediately in a risky way.
Instead, implement it as a new reflection flow that can later become the default.

---

## Product Direction

Reflection V2 is defined as:

"Behavior-based pattern report"

It is NOT:
- emotional writing
- diary rewriting
- self-help coaching
- over-interpretation

It IS:
- pattern extraction based on diary evidence
- action record summary
- repeated execution structure
- concise and grounded reporting

---

## New Output Format

The final output must follow this structure:

🌿 Re:Day

*{period}*

📌 실행 패턴
- {pattern summary}
  ({evidence})

📌 행동 기록
- {action label}: {count}
- {action label}: {count}

📌 특징
- {notable point}
  ({evidence})

—

📌 정리
{1~2 lines overall summary}

Rules:
- "특징" section is optional
- if there is no strong notable point, omit the section
- "정리" must only summarize what already appeared above
- do not add new information in the summary

---

## Core Writing Rules

1. Every statement must be grounded in diary evidence
2. Avoid repeating the same meaning across sections
3. No emotional language
4. No advice
5. Keep sentences short
6. Each major point = summary + evidence
7. Evidence must be short and normalized
8. Evidence must NOT be raw diary sentences
9. Do NOT include exact dates inside bullets
10. Period should be shown only in the top line

---

## Section Definitions

### 1. 실행 패턴

This section explains:
- how action starts
- how action stops
- what conditions affect execution
- repeated execution structure

Rules:
- must be included
- each item should be one short pattern summary + one evidence line
- no vague abstraction
- no raw event listing

Example style:
- 계획한 작업은 실제 수행으로 이어지는 비율이 낮음
  (미실행 반복, 계획 대비 중단)

- 실행은 특정 조건이 갖춰질 때만 시작되는 경향이 있음
  (출퇴근 독서, 식사 후 샤워)

---

### 2. 행동 기록

This section is factual only.

It should summarize:
- what actions actually happened
- how many times they appeared

Rules:
- no interpretation
- count-based
- concise
- use rule-based aggregation when possible
- prefer labels like:
  - 출퇴근 독서
  - 운동
  - 생활 전환 시도
  - 계획 대비 미실행

This section should be generated primarily by deterministic code, not by free-form AI if possible.

---

### 3. 특징 (optional)

This section is for:
- notable patterns
- unusual transitions
- meaningful attempts
- visible turning points

Rules:
- include only if clearly supported
- omit if weak or forced
- do not fabricate a "특징" section

---

### 4. 정리

This section compresses the overall flow.

Rules:
- 1~2 lines only
- summarize only
- no new content
- no advice
- no poetic wording

---

## Architecture Direction

Reflection V2 should use a hybrid approach:

1. deterministic code for behavior extraction / counting
2. AI for pattern summarization and notable-point generation
3. final rendering in code

Important:
- do not let AI freely invent the whole reflection
- use AI for patterns, not for everything
- keep the final structure controlled by code

---

## Existing Inputs

Parsed diary entries may include:
- id
- title
- date
- exercise
- condition
- sections.facts
- sections.actions
- sections.thoughts
- sections.lessons
- sections.discomforts
- sections.oneLine
- summarySourceText

Use only completed diary entries in reflection range.

Exclude:
- nextSteps from main reflection evidence

---

## Reflection Range

Use:
- entries after last reflection date
- until yesterday
- exclude today

Fallback:
- if state-based filtering is unavailable, use recent 3 entries excluding today

Keep this compatible with the current delivery/state flow.

---

## Requirements

### 1. Create Reflection V2 job

Create:

`src/jobs/reflectionV2Job.ts`

Responsibilities:
- select reflection entries
- build behavior counts
- build reflection evidence input
- call AI for pattern report sections
- render final Reflection V2 format

Do not break existing Reflection V1 flow.

---

### 2. Create behavior extraction / counting layer

Create:

`src/services/buildBehaviorCounts.ts`

Responsibilities:
- inspect parsed diary entries
- derive behavior labels
- count occurrences
- return stable structured data

Suggested output type:

```ts
type BehaviorCountItem = {
  label: string;
  count: number;
};
````

Examples of labels:

* 출퇴근 독서
* 운동
* 생활 전환 시도
* 계획 대비 미실행

For MVP, simple rules are enough.
Readable code is more important than perfect classification.

---

### 3. Create Reflection V2 input builder

Create:

`src/services/buildReflectionV2Input.ts`

Responsibilities:

* organize diary evidence
* include reflection period
* include normalized evidence
* include behavior counts
* reduce noise

This input should help the model produce:

* 실행 패턴
* 특징
* 정리

The AI should NOT generate "행동 기록" freely.
That section should come from deterministic counts.

---

### 4. Create Reflection V2 prompt builder

Create:

`src/services/buildReflectionV2Prompt.ts`

Responsibilities:

* strongly define the V2 format
* define section roles clearly
* forbid advice / emotional language
* forbid diary rewriting
* require short normalized evidence
* require omission of the 특징 section if weak

Important:

* pattern items should be structural
* evidence lines should be short
* avoid raw diary sentence fragments

---

### 5. Create Reflection V2 generator

Create:

`src/services/generateReflectionV2.ts`

Responsibilities:

* call OpenAI
* parse structured response
* safely handle fallback if parse fails

Use structured output such as JSON if possible.

Suggested output shape:

```ts
type ReflectionV2ModelOutput = {
  executionPatterns: Array<{
    summary: string;
    evidence: string;
  }>;
  features?: Array<{
    summary: string;
    evidence: string;
  }>;
  summary: string[];
};
```

Keep it simple and safe.

---

### 6. Create Reflection V2 renderer

Create:

`src/services/renderReflectionV2.ts`

Responsibilities:

* receive:

  * period label
  * execution patterns
  * behavior counts
  * optional features
  * summary lines
* render final Slack-ready text

This renderer should fully control:

* section order
* optional 특징 section
* spacing
* divider line
* final string shape

---

### 7. Keep V1 and V2 separated

Do NOT remove or overwrite the current Reflection V1 flow.

This task should add a V2 flow so the developer can compare:

* Reflection V1
* Reflection V2

Local testing can print V2 directly for now.

---

### 8. Update local test entry point

Update:

`src/index.ts`

Add a way to run Reflection V2 for local testing.

It is acceptable to:

* temporarily print Reflection V2 only
  or
* print both V1 and V2 clearly separated

Choose the simpler readable approach.

---

### 9. Error handling

Handle safely when:

* OpenAI fails
* JSON parse fails
* behavior counts are empty
* there are no valid reflection entries
* optional 특징 section is empty

The app must not crash silently.

---

### 10. Code style

Follow `AGENTS.md`.

Important:

* keep implementation simple
* avoid over-engineering
* separate deterministic logic from AI logic
* separate rendering from generation
* use explicit types
* minimize `any`

---

### 11. Learning mode

After implementation, explain in Korean:

1. 생성/수정한 파일 목록
2. 각 파일의 역할
3. Reflection V1과 V2 차이
4. 왜 행동 기록은 rule-based가 적합한지
5. AI와 deterministic logic를 어떻게 나눴는지
6. 직접 공부하면 좋은 Node.js / TypeScript 개념 3~5개
7. 다음 작업 3개

---

## Git Workflow

Create branch:

`feat/reflection-v2`

Use small commits.

Do not commit directly to main.

Open a Pull Request after finishing.

PR description must be written in Korean and follow the repository PR template.


