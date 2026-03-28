# Codex Task 08
Slack Reminder Message Formatting

## Goal

Improve the Slack reminder message format for Re:Day.

This task should ONLY improve how the message is displayed.

It must NOT change:
- data source
- business logic
- scheduling logic
- AI usage

This is a pure formatting task.

---

## Product Direction

Re:Day reminder messages should be:
- easy to scan
- visually grouped
- minimal but structured

The message should feel like a clean daily log,
not a raw data list.

---

## Current Problem

The current message is a flat list:

- {content} · {date}
- {content} · {date}

Problems:
- hard to scan
- no grouping
- weak visual hierarchy

---

## Target Format

Group items by date and improve readability.

### Target Output

:bell: Re:Day

—

🗓️ *3/24 화*
• CodeTune 플젝 다시 재개
• Re:Day 사용해보면서 수정할 요소 찾아보기

🗓️ *3/19 목*
• 오토에버 자소서 써야돼 진짜… 얼마 안남았다…
• Re:Day Task-05 Slack 연결해야지!

🗓️ *3/18 수*
• 이번 주말 집갈 준비하기 (엄마 생일 선물, 뜽히가 준비해준 선물, 보함 자료 챙기기)
• Re:Day task4 에 적용할 GPT API env 설정하기

---

## Requirements

### 1. Group by date

- Items must be grouped by their date
- Each date should appear once
- All items for that date should be listed under it

---

### 2. Sort order

- Sort by date descending (latest first)

---

### 3. Date formatting

- Keep original date string (e.g., "3/24 화")
- Wrap date with bold using `*` (Slack markdown)

Example:

🗓️ *3/24 화*

---

### 4. Item formatting

- Use `•` bullet for each item
- Preserve original text exactly
- Do NOT modify content strings

---

### 5. Layout rules

- Add a separator line after title:

—

- Add one empty line between date blocks
- Keep spacing consistent

---

### 6. Icon usage

- Use: 🗓️
- Do NOT use: 📅 or 📆

---

### 7. Scope limitation

This task must NOT:

- modify Notion parsing logic
- change data structures
- introduce AI logic
- change Slack sending logic
- add new features

Only update the message formatting function.

---

## Implementation Hint

- Transform flat list → grouped structure (Map or object)
- Key: date
- Value: array of items

Then render in order.

---

## Files to update

- message formatter (e.g., `formatReminderMessage.ts` or equivalent)

---

## Learning mode

After implementation, explain in Korean:

1. 수정한 파일
2. 어떤 방식으로 날짜 그룹화를 했는지
3. 문자열 포맷을 어떻게 구성했는지
4. Slack markdown 처리 방식
5. 기존 코드 대비 개선된 점
6. 다음 개선 아이디어 3개

---

## Git Workflow

Create branch:

feat/message-format

Use small commits.

Do not commit directly to main.

Open a Pull Request after finishing.

PR description must be written in Korean.