
Reminder Job

## Goal

Implement the Reminder Job for Re:Day.

This job should:
- collect "next steps" from parsed diary entries
- group repeated items
- format them into a clean reminder message
- output Slack-ready text

This task does NOT use AI.

---

## Core Rules

- Preserve original TODO text exactly
- Do not summarize or rewrite
- Show repetition count
- Show date clearly
- Keep message clean and readable

---

## Scope Definition (Important)

Use only recent N diary entries.

Define:

RECENT_ENTRY_COUNT = 3

The reminder job must:
- sort entries by date (descending)
- select only the most recent N entries
- ignore older entries

This keeps the reminder relevant and avoids outdated tasks.

---

## Input Data

Each parsed diary entry includes:

- id
- title
- date
- nextStepsList

Example:

```ts
nextStepsList: [
  "Re:Day 플젝 마무리",
  "화이트데이 선물 선정"
]
````

---

## Requirements

### 1. Create Reminder Job

Create:

`src/jobs/reminderJob.ts`

Responsibilities:

* receive ParsedDiaryEntry[]
* sort entries by date (descending)
* slice recent N entries
* extract all nextStepsList
* pass to grouping logic
* pass grouped result to message builder
* return final message string

---

### 2. Create Grouping Logic

Create:

`src/services/groupReminderItems.ts`

Responsibilities:

* flatten all nextStepsList
* group identical strings
* count occurrences
* track latest date for each item

Output type:

```ts
type ReminderItem = {
  text: string
  count: number
  latestDate: string
}
```

Rules:

* exact string match is enough (MVP)
* preserve original text
* no aggressive normalization

---

### 3. Create Message Builder

Create:

`src/services/buildReminderMessage.ts`

Responsibilities:

* format ReminderItem[] into final text

---

## Message Format

Final format:

🔔 Re:Day

*최근 적어둔 것들*

* Re:Day 플젝 마무리 · 2회 · 3/10 월
* 습관 만들기 · 2회 · 3/15 일
* PR 테스트 진행 · 3/10 월
* 책상 정리 · 3/15 일
* 화이트데이 선물 선정 · 3/10 월

---

## Formatting Rules

* always show date
* use format: `· M/D 요일`

Examples:

* 3/10 월
* 3/15 일

---

### Repetition Rules

If count >= 2:

```text
- {text} · {count}회 · {date}
```

If count === 1:

```text
- {text} · {date}
```

---

### Sorting Rules

Sort items by:

1. count (descending)
2. latestDate (descending)

---

### Empty State

If no TODO items:

```text
🔔 Re:Day

*최근 적어둔 것들*

- 최근 적어둔 할 일이 없습니다
```

---

## 4. Date Formatting Utility

Create:

`src/utils/formatShortDate.ts`

Responsibilities:

* convert date → `M/D 요일`

Example:

```ts
2026-03-10 → 3/10 월
```

---

## 5. Update Entry Point

Update:

`src/index.ts`

Flow:

1. fetch parsed diary entries
2. run reminder job
3. print result

---

## 6. Error Handling

Handle safely when:

* nextStepsList is empty
* date is missing
* invalid date format
* duplicate items appear multiple times

The app must not crash.

---

## 7. Code Style

Follow `AGENTS.md`.

Important:

* keep logic simple
* separate grouping and formatting
* avoid over-engineering
* minimize `any`
* use explicit types

---

## 8. Learning Mode

After implementation, explain in Korean:

1. 생성/수정한 파일 목록
2. 각 파일의 역할
3. Reminder Job 흐름
4. 반복 집계 로직 설명
5. 배울 개념 3~5개
6. 다음 작업 3개

---

## Git Workflow

Create branch:

feat/reminder-job

Use small commits.

Do not commit to main.

Open PR after finishing.

PR description must follow template and be written in Korean.

