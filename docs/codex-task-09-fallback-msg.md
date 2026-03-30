# Codex Task 09

Fallback Message for Empty Data

---

## Goal

Add fallback messages when Re:Day cannot generate a reflection or reminder
due to missing data.

Instead of skipping delivery, the system should send a lightweight fallback message.

---

## Product Direction

Fallback messages should:

* inform the current state (no data)
* avoid pressure or forcing behavior
* gently encourage re-entry into the logging loop

The tone must remain consistent with Re:Day:

* calm
* neutral
* non-judgmental

---

## Current Problem

Current behavior:

* If no new diary exists → reflection is not sent
* If no TODO exists → reminder is not sent

Problems:

* system feels inactive
* user loses continuity
* no feedback about why nothing was sent

---

## Target Behavior

### Reflection Fallback

When no new diary exists:

```
🌿 Re:Day

이번 회고는 보낼 기록이 없었어.
마지막 기록은 {lastDate} 이야.

오늘 한 줄만 남겨두면
다음 회고부터 다시 이어질 수 있어.
```

---

### Reminder Fallback

When no TODO exists:

```
🔔 Re:Day

최근 적어둔 "다음에 할 것"이 없어.

오늘 떠오른 거 하나만 적어두면
다음 리마인더에 다시 보여줄게.
```

---

## Requirements

### 1. Trigger Conditions

* Reflection fallback:

  * no new diary entries since last reflection

* Reminder fallback:

  * no TODO items available

---

### 2. Separation of Logic

* Do NOT modify existing reflection/reminder generation logic
* Add fallback as an additional branch

---

### 3. Message Formatting

* Use fixed template strings
* Do NOT use AI
* Keep Slack-friendly format

---

### 4. Tone Constraints

Must NOT:

* sound like a warning
* force user action
* include advice or judgment

Must:

* remain neutral
* be short and readable

---

### 5. Optional Data

* Reflection fallback may include:

  * last diary date

---

### 6. Scope Limitation

This task must NOT:

* modify Notion parsing logic
* change scheduling logic
* introduce AI logic
* change existing message formats

---

## Implementation Hint

* Add condition branch before message generation
* If data is empty → return fallback message
* Otherwise → proceed with existing flow

---

## Files to update

* reflection delivery logic
* reminder delivery logic
* message formatter (if needed)

---

## Learning mode

After implementation, explain in Korean:

1. 어떤 조건에서 fallback이 발생하는지
2. 기존 로직과 어떻게 분리했는지
3. 메시지 생성 위치
4. Slack 메시지 구조 처리 방식
5. fallback 추가로 생긴 변화
6. 다음 개선 아이디어 3개

---

## Git Workflow

Create branch:

```
feat/fallback-message
```

Use small commits.

Do not commit directly to main.

Open a Pull Request after finishing.

PR description must be written in Korean.