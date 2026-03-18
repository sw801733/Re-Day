# Re:Day

## 프로젝트 개요

Re:Day는 Notion에 작성한 일기를 기반으로  
Slack으로 리마인드 메시지를 보내주는 개인 자동화 도구다.

이 프로젝트의 목적은 두 가지다.

1. 최근의 상태와 흐름을 다시 마주치게 하기
2. 일기에 적어둔 "다음에 할 것"을 잊지 않게 상기시키기

Re:Day는 자기계발 조언을 제공하는 시스템이 아니라  
기록된 삶의 흐름을 다시 보여주는 가벼운 회고 도구다.

---

# 핵심 개념

Re:Day는 다음 루프를 자동화한다.

```

기록 → 회고 → 상기

```

사용자는 Notion에 일기를 기록하고  
Re:Day는 그 기록을 기반으로 Slack 메시지를 생성한다.

---

# MVP 기능

이번 MVP에서는 아래 기능만 구현한다.

1. Notion Daily_Log DB에서 최근 일기 조회
2. 직전 전송 이후 새 일기 존재 여부 확인
3. 일기 내용 파싱
4. "다음에 할 것" 항목 추출
5. Slack 메시지 생성
6. Slack DM 전송
7. GitHub Actions로 자동 실행

---

# 전송 규칙

## 실행 시점

- 월요일
- 목요일
- 오전 07:30 (KST)

## 전송 조건

- 마지막 전송 이후 새로운 일기가 있을 때만 전송
- 새 기록이 없으면 아무 것도 보내지 않음

---

# 리마인드 카드 방향

### 말투

반말

### 스타일

- 담백함
- 상태 중심
- 감정 흐름 중심

### 금지 요소

다음 표현은 사용하지 않는다.

- 자기계발 조언
- 행동 지시
- 교훈 정리

예

❌ "이번 주는 조금 더 쉬어보는 것도 좋겠다"  
❌ "이제 루틴을 만들면 좋겠다"

---

# 시스템 흐름

```

GitHub Actions (Scheduler)
↓
Run Script
↓
Read state file
↓
Fetch Notion diary entries
↓
Filter new entries
↓
Generate reflection summary
↓
Send Slack DM
↓
Update state

```

---

# 기술 스택

- Node.js
- TypeScript
- Notion API
- OpenAI API
- Slack API
- GitHub Actions

---

# 성공 기준

다음 조건이 충족되면 MVP 성공이다.

- 월/목 07:30 자동 실행
- 새 일기 없으면 메시지 없음
- 새 일기 있으면 Slack DM 전송
- 중복 전송 없음
