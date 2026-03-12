import { fetchDiaryEntries } from "./services/fetchDiaryEntries";

async function main(): Promise<void> {
  const diaryEntries = await fetchDiaryEntries();

  if (diaryEntries.length === 0) {
    console.log("조회된 일기가 없습니다.");
    return;
  }

  for (const diaryEntry of diaryEntries) {
    console.log(diaryEntry.date);
    console.log(diaryEntry.title);

    if (diaryEntry.content) {
      console.log(diaryEntry.content);
    }

    console.log("");
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
