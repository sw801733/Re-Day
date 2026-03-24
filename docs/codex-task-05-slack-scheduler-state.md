
Slack Sender + Scheduler + State Store

## Goal

Implement the delivery layer of Re:Day.

This task should make Re:Day actually runnable as a product by adding:

- Slack message sending
- scheduled execution
- state management to prevent duplicate sends

This task does NOT redesign reminder or reflection content.
It only connects existing outputs to real delivery flow.

---

## Product Direction

Re:Day now has two message types:

1. Reminder message
2. Reflection message

Both should be delivered in the evening so they can work as an action trigger.

Reason:
- morning is less actionable
- evening is closer to the user's available time
- Re:Day should work as a habit signal tied to after-work life

---

## Delivery Schedule

Use Korea Standard Time (KST).

### Reminder
- send on weekdays only
- send in the evening
- default time: 19:30 KST

### Reflection
- send on Monday and Thursday
- send in the evening
- default time: 19:30 KST

At 19:30:
- Monday / Thursday → send reminder + reflection
- Tuesday / Wednesday / Friday → send reminder only
- Saturday / Sunday → send nothing

Keep the scheduling logic easy to change later.

---

## Existing Inputs

Already implemented:

- diary fetch
- diary parser / normalize layer
- reminder job
- reflection job

This task should reuse those outputs.

---

## Requirements

### 1. Create Slack sender

Create:

`src/clients/slackClient.ts`

Responsibilities:
- initialize Slack client
- send a text message to a Slack channel or DM target
- expose a simple send method

Add required env values to configuration, such as:
- SLACK_BOT_TOKEN
- SLACK_REMINDER_CHANNEL
- SLACK_REFLECTION_CHANNEL

Keep the client simple and readable.

---

### 2. Create send services

Create:

`src/services/sendReminderMessage.ts`
`src/services/sendReflectionMessage.ts`

Responsibilities:
- receive final message text
- send through Slack client
- keep delivery concerns separated from message generation

These services should NOT generate content.
They only send already generated text.

---

### 3. Create state store

Create:

`src/storage/stateStore.ts`

Use a simple JSON file state store for MVP.

Create or manage a state file like:

`src/storage/state.json`

Suggested structure:

```json
{
  "lastReminderDate": "2026-03-20",
  "lastReflectionDate": "2026-03-18"
}
````

Responsibilities:

* read current state safely
* initialize default state if file does not exist
* update reminder send date
* update reflection send date
* write back safely

---

### 4. Reminder duplicate prevention

Reminder rule:

* only send once per day
* if today's reminder was already sent, skip sending

Important:

* weekday reminder only
* weekend reminder should be skipped

---

### 5. Reflection duplicate prevention

Reflection rule:

* only send on Monday and Thursday
* only send once on a valid reflection day
* if today's reflection was already sent, skip sending

For MVP:

* it is acceptable to use send-date based prevention first

Optional improvement:

* if possible, also check whether there are valid reflection entries before sending

Do not over-engineer this in this task.

---

### 6. Create scheduler entry flow

Create a coordinator such as:

`src/jobs/deliveryJob.ts`

Responsibilities:

* determine current local date/time in KST
* determine whether today is a reminder day
* determine whether today is a reflection day
* check state before sending
* call reminder job if needed
* call reflection job if needed
* send Slack messages
* update state after successful send only

---

### 7. Scheduling approach

Use a scheduling approach that fits the current project.

Recommended:

* GitHub Actions cron for production-like scheduled runs

Optional local development support:

* manual execution from `src/index.ts`

For this task:

* implement the application logic so it can run once per execution
* make it easy to connect to GitHub Actions next

Do NOT implement complex internal cron scheduling unless needed.

---

### 8. Update entry point

Update:

`src/index.ts`

Add a delivery test flow so local execution can run:

1. reminder flow
2. reflection flow
3. Slack send flow
4. state update flow

Console logs should clearly show:

* what is being sent
* what is skipped
* why it is skipped

---

### 9. Empty / skip behavior

Reminder:

* if no reminder content is available, skip safely

Reflection:

* if no valid reflection content is available, skip safely

State:

* only update after successful Slack send

Never update send state before delivery succeeds.

---

### 10. Error handling

Handle safely when:

* Slack token is missing
* Slack send fails
* state file is missing
* state JSON is invalid
* reminder/reflection returns empty content

The app must not crash silently.
Use readable logs.

---

### 11. Code style

Follow `AGENTS.md`.

Important:

* keep implementation simple
* avoid over-engineering
* separate generation from delivery
* separate scheduler logic from Slack client logic
* separate state logic from message logic
* use explicit types
* minimize `any`

---

### 12. Learning mode

After implementation, explain in Korean:

1. 생성/수정한 파일 목록
2. 각 파일의 역할
3. delivery flow 설명
4. state store 설계 이유
5. duplicate prevention 처리 방식
6. 직접 공부하면 좋은 Node.js / TypeScript 개념 3~5개
7. 다음 작업 3개

---

## Git Workflow

Create branch:

`feat/delivery-layer`

Use small commits.

Do not commit directly to main.

Open a Pull Request after finishing.

PR description must be written in Korean and follow the repository PR template.
