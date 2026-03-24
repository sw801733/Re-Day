# Re:Day

Re:Day는 Notion 일기를 읽고 Slack으로 `reminder` 와 `reflection` 메시지를 보내는 개인 자동화 프로젝트입니다.

핵심 로직은 앱 코드가 담당하고, GitHub Actions는 정해진 시각에 앱을 한 번 실행하고 변경된 상태 파일을 저장하는 역할만 맡습니다.

## 실행 스케줄

- 목표 전송 시각: 평일 19:30 KST
- GitHub Actions cron 기준: `30 10 * * 1-5`
- 중요한 점: GitHub Actions cron 표현식은 KST가 아니라 UTC 기준입니다.
- 즉, `10:30 UTC = 19:30 KST` 이므로 workflow에는 UTC 값으로 적습니다.

앱 내부 판단 규칙은 `src/jobs/deliveryJob.ts` 에 있습니다.

- 월요일 / 목요일: reminder + reflection
- 화요일 / 수요일 / 금요일: reminder only
- 토요일 / 일요일: skip

## 로컬 실행

필수 환경변수를 `.env` 에 준비한 뒤 아래 명령으로 실행할 수 있습니다.

```bash
npm run dev
```

프로덕션과 비슷하게 확인하려면 아래 순서로 실행합니다.

```bash
npm run build
npm run start
```

GitHub Actions 추가는 로컬 실행을 대체하지 않습니다. 기존 로컬 실행 흐름은 그대로 유지됩니다.

## GitHub Actions workflow

Workflow 파일은 `.github/workflows/reday-delivery.yml` 입니다.

지원 트리거:

- `schedule`
- `workflow_dispatch`

workflow는 아래 순서만 담당합니다.

1. 저장소 checkout
2. Node.js 설정
3. `npm ci`
4. `npm run build`
5. `npm run start`
6. 변경된 상태 파일 commit / push

비즈니스 로직은 workflow에 중복으로 넣지 않고, 앱 실행 결과에 따라 상태 파일만 저장합니다.

## GitHub Secrets

아래 값들을 GitHub repository secrets에 등록해야 합니다.

- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SLACK_BOT_TOKEN`
- `SLACK_REMINDER_CHANNEL`
- `SLACK_REFLECTION_CHANNEL`

누락된 값이 있으면 앱 실행 중 명확한 에러로 실패합니다.

## 수동 실행

GitHub 저장소의 `Actions` 탭에서 `Re:Day Delivery` workflow를 선택한 뒤 `Run workflow` 로 수동 실행할 수 있습니다.

수동 실행도 동일한 앱 엔트리포인트를 사용하므로, 스케줄 실행과 같은 규칙으로 동작합니다.

## State Persistence

MVP에서는 `data/delivery-state.json` 파일을 Git에 추적하고, workflow 실행 후 이 파일이 바뀐 경우에만 commit / push 합니다.

이 방식의 동작은 다음과 같습니다.

- 앱이 전송 성공 후에만 state를 갱신합니다.
- 전송이 없거나 skip이면 state 파일은 바뀌지 않습니다.
- workflow는 변경된 state 파일이 있을 때만 commit 합니다.
- push 실패는 workflow 실패로 남겨서 silent failure를 피합니다.

기존 로컬 환경에 `src/storage/state.json` 이 남아 있다면, 새 tracked 파일이 없을 때 한 번만 `data/delivery-state.json` 으로 마이그레이션합니다.
