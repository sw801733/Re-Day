import { runDeliveryJob } from "./jobs/deliveryJob";
import { runReflectionV2Job } from "./jobs/reflectionV2Job";
import { fetchDiaryEntries } from "./services/fetchDiaryEntries";

type RunMode = "delivery" | "reflection-v2";

function readRunMode(argv: string[]): RunMode {
  return argv[2] === "reflection-v2" ? "reflection-v2" : "delivery";
}

async function runReflectionV2Preview(): Promise<void> {
  console.log("[preview] Reflection V2 미리보기를 시작합니다.");
  const entries = await fetchDiaryEntries();
  console.log(`[preview] Notion 일지 ${entries.length}건을 불러왔습니다.`);

  const message = await runReflectionV2Job(entries);

  console.log("[preview] Reflection V2 결과");
  console.log(message);
}

async function main(): Promise<void> {
  const mode = readRunMode(process.argv);

  if (mode === "reflection-v2") {
    await runReflectionV2Preview();
    return;
  }

  await runDeliveryJob();
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
