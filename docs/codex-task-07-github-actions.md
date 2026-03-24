# Codex Task 07
GitHub Actions Scheduled Delivery

## Goal

Implement GitHub Actions based scheduled execution for Re:Day.

This task should make the project runnable automatically on schedule without requiring a local machine.

The workflow should:
- run the delivery flow automatically
- use GitHub Actions cron schedule
- support Korea Standard Time based evening delivery logic
- keep local manual execution available

This task does NOT redesign reminder/reflection logic.
It only connects the existing delivery flow to scheduled automation.

---

## Product Direction

Re:Day should behave like a lightweight personal automation system.

The application already decides:
- whether today is a reminder day
- whether today is a reflection day
- whether sending should be skipped
- whether state should be updated

GitHub Actions should simply run the application once on schedule.

Important:
- scheduling responsibility should stay simple
- business logic should remain inside the app
- GitHub Actions should not duplicate application rules

---

## Target Behavior

Use GitHub Actions to run the app once per scheduled execution.

The application should then decide:
- Monday / Thursday → reminder + reflection
- Tuesday / Wednesday / Friday → reminder only
- Saturday / Sunday → skip
- duplicate send prevention → based on state

The workflow should support evening delivery in KST.

---

## Scheduling Strategy

GitHub Actions cron uses UTC.

Target local schedule:
- 19:30 KST on weekdays

Equivalent UTC schedule:
- 10:30 UTC on weekdays

Important:
- document clearly that GitHub Actions cron is written in UTC
- keep the schedule easy to change later

---

## Requirements

### 1. Create GitHub Actions workflow

Create:

`.github/workflows/reday-delivery.yml`

Responsibilities:
- trigger on weekday schedule
- allow manual run via workflow_dispatch
- checkout repository
- install dependencies
- run the delivery entry point

Use a clean and readable workflow.

---

### 2. Add workflow triggers

The workflow should support:

1. scheduled execution
2. manual execution

Use:
- `schedule`
- `workflow_dispatch`

This allows:
- real scheduled runs
- manual testing from GitHub UI

---

### 3. Configure Node environment

The workflow should:
- use a stable Node.js version
- install dependencies with npm
- run the project in a production-like way

Recommended flow:
- checkout
- setup-node
- npm ci
- npm run build
- npm run start

Keep it simple.

---

### 4. Pass required secrets / env values

The workflow must use GitHub Secrets for sensitive values.

Expected secrets may include:
- NOTION_API_KEY
- NOTION_DATABASE_ID
- OPENAI_API_KEY
- OPENAI_MODEL
- SLACK_BOT_TOKEN
- SLACK_REMINDER_CHANNEL
- SLACK_REFLECTION_CHANNEL

Do not hardcode secrets.

Document which values should be added to GitHub Secrets.

---

### 5. State file strategy

The current MVP uses a JSON state store.

GitHub Actions runs in a fresh environment each time,
so local filesystem state is NOT automatically persisted.

This task must choose one simple persistence approach for MVP.

Recommended MVP approach:
- commit and update a state file in the repository

Possible alternatives can be mentioned in comments,
but this task should implement one concrete working approach.

If using repo-based state persistence:
- read state from tracked file
- update file after successful send
- commit and push updated state back to repository

Keep the implementation simple and explicit.

Important:
- do not update state if send failed
- avoid silent failure

---

### 6. Add state persistence support

If needed, update the application so the state file path is stable and Git-friendly.

Keep state handling readable.

If using repo commit-back strategy:
- configure git user inside workflow
- commit only when state file changed
- skip commit if no change
- push back to the current branch safely

---

### 7. Keep application logic unchanged where possible

Important:
- day-of-week logic stays in app code
- duplicate prevention stays in app code
- reminder/reflection generation stays in app code

GitHub Actions should only:
- run the app
- provide env
- persist state if needed

---

### 8. Update documentation

Update:

`README.md`

Add:
- how scheduled delivery works
- why cron is UTC
- which GitHub Secrets are required
- how to manually trigger the workflow
- how state persistence works in MVP

Keep the explanation simple and practical.

---

### 9. Local/manual execution compatibility

Do not break local development.

The project should still be runnable locally with:

- `npm run dev`
- `npm run build`
- `npm run start`

GitHub Actions is an additional execution layer, not a replacement.

---

### 10. Error handling

Handle safely when:
- secrets are missing
- workflow run fails
- state file commit is unnecessary
- push fails
- app exits without send

The workflow should be readable from logs.

Use clear step names.

---

### 11. Code style

Follow `AGENTS.md`.

Important:
- keep workflow readable
- avoid over-engineering
- keep business logic inside app code
- minimize workflow complexity
- document assumptions clearly

---

### 12. Learning mode

After implementation, explain in Korean:

1. 생성/수정한 파일 목록
2. 각 파일의 역할
3. GitHub Actions 실행 흐름
4. 왜 cron은 UTC로 써야 하는지
5. state persistence를 어떻게 처리했는지
6. 직접 공부하면 좋은 GitHub Actions / Node.js 개념 3~5개
7. 다음 작업 3개

---

## Git Workflow

Create branch:

`feat/github-actions`

Use small commits.

Do not commit directly to main.

Open a Pull Request after finishing.

PR description must be written in Korean and follow the repository PR template.