# Codex Task 01
Re:Day 초기 프로젝트 세팅 + Notion 일기 조회 기능 구현

---

# 목표

Re:Day 프로젝트의 첫 단계로  
Node.js + TypeScript 프로젝트를 초기화하고  
Notion DB에서 최근 일기를 조회하여 콘솔에 출력하는 기능을 구현한다.

---

# 기술 스택

- Node.js
- TypeScript
- dotenv
- Notion SDK

---

# 구현 요구사항

## 1. 프로젝트 초기화

Node.js + TypeScript 프로젝트 생성

필요 파일

- package.json
- tsconfig.json

npm scripts

- dev
- build
- start

---

## 2. 폴더 구조 생성


src/
config/
clients/
services/
types/
utils/
storage/


---

## 3. 환경 변수 설정

`.env.example`


NOTION_API_KEY=
NOTION_DATABASE_ID=


---

## 4. env 로딩 모듈

`src/config/env.ts`

역할

- dotenv 로딩
- env 값 검증
- 타입 안전하게 export

---

## 5. Notion Client

`src/clients/notionClient.ts`

역할

- Notion SDK 초기화
- API 호출을 위한 client 생성

---

## 6. Diary 타입 정의

`src/types/diary.ts`

일기 엔트리 타입 정의

예시

- id
- date
- title
- content

---

## 7. Notion 일기 조회 서비스

`src/services/fetchDiaryEntries.ts`

기능

- Notion DB 조회
- 최근 일기 목록 가져오기
- 날짜 기준 정렬
- property 안전 파싱

---

## 8. 실행 코드

`src/index.ts`

기능

- fetchDiaryEntries 호출
- 결과 콘솔 출력

출력 예


2026-03-05
머리를 자르고 병원 다녀옴
codex 처음 사용해봄


---

# 코드 스타일 규칙

- 읽기 쉬운 구조 우선
- 과한 추상화 금지
- any 최소화
- null/undefined 안전 처리
- TypeScript 타입 최대한 명시

---

# 학습 모드 요구사항

코드를 생성할 때 아래도 같이 제공해줘

1. 생성된 파일 목록
2. 각 파일의 역할 설명
3. 폴더 구조를 이렇게 나눈 이유
4. Node.js 초보자가 알아야 할 핵심 개념 설명
5. 공부해야 할 개념 3~5개
6. 다음 단계 추천 3개