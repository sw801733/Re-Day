
Reflection Job

---

## Goal

Implement the Reflection Job for Re:Day.

This job should:
- collect recent diary entries
- select valid reflection range
- extract evidence-based signals
- generate structured reflection using OpenAI
- output a clean Re:Day message

---

## Core Principle

Reflection is:

- pattern extraction
- repeated behavior summary
- repeated thought summary
- evidence-based compression

NOT:

- diary rewrite
- event listing
- emotional writing
- advice or coaching

---

## Scope Definition (VERY IMPORTANT)

### Reflection Range

Use:

- entries AFTER last reflection
- UNTIL yesterday (exclude today)

Rule:

- NEVER include today's diary
- only use completed days

---

### Fallback (MVP)

If last reflection state is not available:

- use most recent 3 entries
- still EXCLUDE today's entry

---

## Critical Writing Rules

1. Do NOT include dates in bullet points
2. Do NOT list events one-by-one
3. Do NOT rewrite diary sentences
4. Do NOT give advice
5. Do NOT use emotional or motivational language

---

## Key Writing Rule (IMPORTANT)

Each bullet must follow:

Pattern + (대표 예시)

Additional rule:

- example inside parentheses must be cleaned keyword form
- raw diary sentence is forbidden

---

### Examples

Bad:
- 운동을 했다
- 빨래를 했다

Good:
- 행동은 부담이 낮은 활동에 집중되는 경향이 있음  
  (독서, 샤워, 빨래)

---

## Section Rules

---

### 📌 반복된 흐름

- only repeated patterns
- no events
- no dates
- no duplication with other sections

---

### 📌 실제 행동

- summarize behavior tendencies
- NOT event list
- must use pattern + (대표 예시)
- examples should preserve diary texture without becoming event list
- examples must be short cleaned keywords

---

### 📌 생각

- summarize repeated thoughts
- compress similar ideas
- avoid rewriting

---

### 📌 정리

- 1~2 lines only
- describe overall contrast or limitation

---

## Input Data

Use:

- facts
- actions
- thoughts
- lessons
- discomforts

Exclude:

- nextSteps

---

## Output Format

🌿 Re:Day

*{기간}*

📌 반복된 흐름
- ...
- ...
- ...

📌 실제 행동
- ...
- ...
- ...

📌 생각
- ...
- ...
- ...

—

📌 정리
...

---

## Requirements

---

### 1. Reflection Job

`src/jobs/reflectionJob.ts`

Responsibilities:

- filter entries (exclude today)
- select reflection range
- handle empty state
- call generator

---

### 2. Entry Selection (IMPORTANT UPDATE)

`src/services/selectReflectionEntries.ts`

Must:

- exclude today's entry
- support future `afterDate`

Pseudo logic:

```ts
entries
  .filter(e => e.date < today)
  .filter(e => e.date > lastReflectionDate) // optional
  .slice(-3) // fallback
````

---

### 3. Input Builder

`src/services/buildReflectionInput.ts`

* structured evidence text
* clean formatting
* no noise

---

### 4. Prompt Builder (UPDATED)

`src/services/buildReflectionPrompt.ts`

Must enforce:

* pattern-based writing
* NO event listing
* NO dates inside bullets
* NO advice
* NO emotional language

CRITICAL ADD:

Each bullet must:

* describe a pattern
* include representative example in parentheses
* feel connected to diary evidence, not generic abstraction
* use cleaned example keywords only

---

### 5. OpenAI Client

`src/clients/openaiClient.ts`

Add:

```ts
temperature: 0.2 ~ 0.3
```

---

### 6. Message Generator

`src/services/generateReflectionMessage.ts`

Must:

* parse JSON safely
* fallback on error
* render final format

---

### 7. Error Handling

* OpenAI error → fallback
* JSON parse fail → fallback
* empty entries → safe message

---

## Learning Mode

Explain:

1. file changes
2. reflection flow
3. prompt strategy
4. why pattern + example matters
5. 3~5 concepts to study
6. next 3 steps

---

## Git Workflow

branch:

feat/reflection-job-refined

small commits

PR required

