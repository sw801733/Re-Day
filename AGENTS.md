# AGENTS.md

## Project
Re:Day is a small personal automation project.
Its purpose is to read recent diary entries from Notion, generate a short reminder card, and send it to Slack on a schedule.

## Priorities
1. Fast MVP delivery
2. Readable code
3. Small, incremental steps
4. Easy debugging
5. Beginner-friendly explanations

## Coding rules
- Prefer simple Node.js + TypeScript structure
- Avoid over-engineering
- Avoid unnecessary abstractions
- Keep files focused by role
- Use explicit types where possible
- Minimize use of `any`
- Handle null/undefined safely
- Keep future OpenAI and Slack integration easy

## Working style
- Always explain what each new file does
- Explain why a folder or module split was chosen
- Prefer small steps over big one-shot implementations
- Suggest the next 3 steps after each task
- Assume the developer is learning while building

## Current MVP scope
- Read diary entries from Notion
- Filter new entries
- Generate reminder text
- Send Slack DM
- Run on Monday/Thursday 07:30 KST
- Skip sending if there are no new entries

## Git workflow
- Always create a feature branch
- Never commit directly to main
- Use small commits
- Use clear commit messages
- Open a PR after completing a task