# AGENTS.md

## Project Overview

Re:Day is a small personal automation project.

It reads recent diary entries from Notion, generates a short reminder card,
and sends it to Slack on a schedule.

The purpose is not self-improvement advice,
but to gently revisit the recent state and flow of life.

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

PR content must preserve **proper Markdown formatting** and
avoid broken line breaks.

Each PR must include the following sections:

Summary

Short description of the feature implemented

Changes

List of major changes

Key Files

Important files added or modified

How to Test

Steps to run or verify the feature

Learning

Key concepts used in this implementation

Next Step

Suggested next tasks


The **Learning section must remain short** and focus only on key concepts.

Example:

Learning

async / await
Syntax for writing Promise-based async logic in a synchronous style

dotenv
Library for loading environment variables


---

## Git Workflow
- Always create a feature branch
- Never commit directly to main
- Use small commits
- Write clear commit messages
- Open a Pull Request after completing a task

Example branch names:

feat/notion-fetch
feat/openai-summary
feat/slack-message
feat/reminder-filter
feat/github-actions


---

## Current MVP Scope
The current MVP includes:

- Read diary entries from Notion
- Filter entries created after the last reminder
- Generate reminder text
- Send Slack DM
- Run on Monday / Thursday 07:30 KST
- Skip sending when there are no new entries

---

## Development Principle
Re:Day is a small personal project.

Prefer:
- Simple implementation
- Readable code
- Gradual extension

Avoid complex architecture unless clearly necessary.