# Codex Task 02
Diary Parser / Normalize Layer

## Goal

Implement a parser layer that converts raw Notion diary pages into a normalized application data structure.

This layer will be used by:
- reminder message generation
- reflection summary generation

The goal is to isolate Notion-specific data structures from the rest of the application.

---

## Background

Re:Day reads diary entries from a Notion database called `Daily_Log`.

Each row in the database represents a diary entry.

Database properties include:
- 제목
- 날짜
- 운동
- 컨디션

Each row is a Notion page that contains diary content.

The diary page body may contain sections like:
- 오늘 있었던 일
- 오늘 있었던 일 (사실)
- 실제로 행동한 일
- 떠오른 생각
- 배운 것
- 불편한 것
- 불편한 것 / 막힌 것
- 다음에 할 것
- 한 문장

Some diary entries may have missing sections.
Section titles may contain emoji.
The parser must handle these variations safely.

---

## Target Output Type

Create a normalized type called `ParsedDiaryEntry`.

Example:

```ts
type ParsedDiaryEntry = {
  id: string;
  title: string;
  date: string;
  exercise?: string;
  condition?: string;
  rawContent: string;
  sections: {
    facts?: string;
    actions?: string;
    thoughts?: string;
    lessons?: string;
    discomforts?: string;
    nextSteps?: string;
    oneLine?: string;
  };
  nextStepsList: string[];
  summarySourceText: string;
};
````

You may slightly adjust naming if needed, but keep the structure simple and readable.

---

## Requirements

### 1. Create parser module

Create:

`src/services/parseDiaryEntry.ts`

Responsibilities:

* read Notion database properties
* extract title
* extract date
* extract exercise
* extract condition
* read page content blocks
* convert blocks into plain text
* detect diary sections
* map sections to normalized keys
* allow missing sections
* generate `nextStepsList`
* generate `summarySourceText`

---

### 2. Extract page content

Implement logic to read Notion page blocks.

Responsibilities:

* fetch page child blocks
* support common text blocks
* convert blocks into plain text
* merge text into `rawContent`

Ignore decorative template content when possible.

Supported block types can initially be limited to common text-based blocks.

---

### 3. Section detection

Detect diary sections using heading patterns.

Examples:

* 오늘 있었던 일
* 오늘 있었던 일 (사실)
* 실제로 행동한 일
* 떠오른 생각
* 배운 것
* 불편한 것
* 불편한 것 / 막힌 것
* 다음에 할 것
* 한 문장

Emoji in headings should not break parsing.

Use simple and readable matching rules.

---

### 4. nextStepsList

Extract TODO items from the section:

`다음에 할 것`

Convert bullet points into a string array.

Example output:

```ts
[
  "Re:Day #1 PR 테스트 진행",
  "화이트데이 선물 선정"
]
```

---

### 5. summarySourceText

Create a text block used later for AI reflection summaries.

Combine these sections:

* facts
* actions
* thoughts
* lessons
* discomforts

Do not include:

* nextSteps
* oneLine

The goal is to create a clean reflection input for the summary model.

---

### 6. Update fetch flow

Update:

`src/services/fetchDiaryEntries.ts`

New flow:

1. Query Notion database rows
2. Fetch page blocks
3. Parse page into `ParsedDiaryEntry`
4. Return `ParsedDiaryEntry[]`

---

### 7. Console output

Update `src/index.ts` to print parsed results in a readable format.

Example output:

제목: 습관을 조금씩 만들어봐여
날짜: 2026-03-10
운동: 홈트
컨디션: 보통

[오늘 있었던 일]
연말 정산을 포함한 월급이 들어왔어요

[실제로 행동한 일]
처음으로 출퇴근에 책을 10분 이상씩 읽었습니다
퇴근하자마자 밥을 먹고 샤워를 했습니다요

[다음에 할 것]

* Re:Day #1 PR 테스트 진행
* 화이트데이 선물 선정

---

### 8. Error handling

Handle safely when:

* title is missing
* date is missing
* page body is empty
* sections are missing
* unsupported block types appear

The parser must not crash because of partial or messy diary data.

---

### 9. Code style

Follow rules in `AGENTS.md`.

Important:

* avoid over-engineering
* avoid unnecessary abstractions
* minimize `any`
* keep code readable
* use explicit types
* isolate Notion parsing logic

---

### 10. Learning mode

After finishing the implementation, explain in Korean:

1. files created or modified
2. role of each file
3. why the normalize layer is needed
4. how Notion blocks were parsed
5. Node.js / TypeScript concepts worth learning
6. suggested next 3 tasks

---

## Git Workflow

Create a feature branch:

`feat/diary-parser`

Use small commits.
Do not commit directly to main.
Open a Pull Request after finishing.

The PR description must be written in Korean and follow the repository PR template.

````

