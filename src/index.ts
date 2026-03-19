import { fetchDiaryEntries } from "./services/fetchDiaryEntries";
import { runReflectionJob } from "./jobs/reflectionJob";

async function main(): Promise<void> {
  const diaryEntries = await fetchDiaryEntries();
  const reflectionMessage = await runReflectionJob(diaryEntries);
  console.log(reflectionMessage);
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
