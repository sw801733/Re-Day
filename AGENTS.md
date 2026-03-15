# AGENTS.md

## Project Overview

Re:Day is a small personal automation project.

It reads diary entries from Notion and sends two types of Slack messages on a schedule.

1. Reflection messages
2. Reminder messages

Reflection messages help revisit the recent state and flow of life.

Reminder messages surface the user's written "next steps" so they are not forgotten.

The goal is not to give self-improvement advice, but to gently revisit recent experiences and intentions.

---

## Priorities

1. Fast MVP delivery
2. Readable code
3. Small incremental development
4. Easy debugging
5. Learning-friendly explanations

---

## Coding Guidelines

- Use a simple Node.js + TypeScript structure
- Avoid over-engineering
- Avoid unnecessary abstractions
- Organize files by clear responsibilities
- Prefer explicit TypeScript types
- Minimize use of `any`
- Handle null / undefined safely
- Keep OpenAI and Slack integration easy to extend

---

## Development Style

- Explain the purpose of each new file
- Explain why folders or modules are split
- Prefer small incremental implementations
- Avoid large one-shot implementations
- After each task, suggest the next 3 steps
- Assume the developer is learning while building

---

## Pull Request Rules

All Pull Request descriptions must be written **in Korean**.

PR content must preserve **proper Markdown formatting** and avoid broken line breaks.

Each PR must include the following sections.

## Summary

Short description of the feature implemented.

## Changes

List of major changes.

## Key Files

Important files added or modified.

## How to Test

Steps to run or verify the feature.

## Learning

Key concepts used in this implementation.

This section must remain short.

Example:

Learning

- async / await  
  Syntax for writing Promise-based async logic in a synchronous style

- dotenv  
  Library for loading environment variables

## Next Step

Suggested next development tasks.

---

## Git Workflow

- Always create a feature branch
- Never commit directly to main
- Use small commits
- Write clear commit messages
- Open a Pull Request after completing a task

Branch naming convention
    feat/<feature-name>

Example branches

```
feat/notion-fetch
feat/diary-parser
feat/reminder-job
feat/reflection-job
feat/slack-message
feat/github-actions
```

Commit style example
```
feat: add notion diary fetch
feat: implement diary parser
feat: add slack message sender
```
---

## Current MVP Scope

The MVP includes the following features.

- Read diary entries from Notion
- Parse and normalize diary content
- Extract "next steps" from diary entries
- Send reminder messages to Slack
- Generate reflection summaries
- Send reflection messages on Monday / Thursday at 07:30 KST
- Skip reflection messages when there are no new diary entries

---

## Development Principle

Re:Day is a small personal project.

Prefer

- Simple implementation
- Readable code
- Gradual extension

Avoid complex architecture unless clearly necessary.
