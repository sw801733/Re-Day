import { fetchDiaryEntries } from "./services/fetchDiaryEntries";
import type { ParsedDiaryEntry, ParsedDiarySections } from "./types/diary";

type PrintableSectionKey = keyof ParsedDiarySections;

const PRINTABLE_SECTIONS: Array<{
  key: PrintableSectionKey;
  label: string;
}> = [
  { key: "facts", label: "오늘 있었던 일" },
  { key: "actions", label: "실제로 행동한 일" },
  { key: "thoughts", label: "떠오른 생각" },
  { key: "lessons", label: "배운 것" },
  { key: "discomforts", label: "불편한 것" },
];

function printField(label: string, value: string | undefined): void {
  if (value) {
    console.log(`${label}: ${value}`);
  }
}

function printSection(label: string, value: string | undefined): void {
  if (!value) {
    return;
  }

  console.log("");
  console.log(`[${label}]`);
  console.log(value);
}

function printNextSteps(entry: ParsedDiaryEntry): void {
  if (!entry.sections.nextSteps && entry.nextStepsList.length === 0) {
    return;
  }

  console.log("");
  console.log("[다음에 할 것]");

  if (entry.nextStepsList.length > 0) {
    for (const nextStep of entry.nextStepsList) {
      console.log(`* ${nextStep}`);
    }

    return;
  }

  console.log(entry.sections.nextSteps);
}

function printEntry(entry: ParsedDiaryEntry): void {
  printField("제목", entry.title);
  printField("날짜", entry.date);
  printField("운동", entry.exercise);
  printField("컨디션", entry.condition);

  for (const section of PRINTABLE_SECTIONS) {
    printSection(section.label, entry.sections[section.key]);
  }

  printNextSteps(entry);
  printSection("한 문장", entry.sections.oneLine);
}

async function main(): Promise<void> {
  const diaryEntries = await fetchDiaryEntries();

  if (diaryEntries.length === 0) {
    console.log("조회된 일기가 없습니다.");
    return;
  }

  for (const [index, diaryEntry] of diaryEntries.entries()) {
    if (index > 0) {
      console.log("");
    }

    printEntry(diaryEntry);
    console.log("");
    console.log("---");
  }
}

main().catch((error: unknown) => {
  console.error("Re:Day 실행 중 오류가 발생했습니다.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
