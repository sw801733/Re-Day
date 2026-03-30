import { buildReflectionFallbackMessage } from "../services/buildReflectionFallbackMessage";
import { fetchDiaryEntries } from "../services/fetchDiaryEntries";
import { sendReflectionMessage } from "../services/sendReflectionMessage";
import { sendReminderMessage } from "../services/sendReminderMessage";
import {
  readState,
  updateReflectionSendDate,
  updateReminderSendDate,
} from "../storage/stateStore";
import type { ParsedDiaryEntry } from "../types/diary";
import { prepareReflectionV2Job } from "./reflectionV2Job";
import { prepareReminderJob } from "./reminderJob";

type WeekdayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

interface DeliveryDateContext {
  date: string;
  time: string;
  weekday: WeekdayName;
}

const DELIVERY_TIME_ZONE = "Asia/Seoul";
const DELIVERY_TIME_LABEL = "19:30";
const REMINDER_WEEKDAYS = new Set<WeekdayName>([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
]);
const REFLECTION_WEEKDAYS = new Set<WeekdayName>(["Monday", "Thursday"]);

function getDateRank(value: string): number {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) {
    return -1;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return -1;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return -1;
  }

  return year * 10000 + month * 100 + day;
}

function filterDiaryEntriesBeforeDate(
  entries: ParsedDiaryEntry[],
  endExclusiveDate: string,
): ParsedDiaryEntry[] {
  const endExclusiveDateRank = getDateRank(endExclusiveDate);

  return entries.filter((entry) => {
    const entryDateRank = getDateRank(entry.date);

    if (entryDateRank < 0) {
      return false;
    }

    if (endExclusiveDateRank < 0) {
      return true;
    }

    return entryDateRank < endExclusiveDateRank;
  });
}

function hasNewReflectionDiaryEntries(
  entries: ParsedDiaryEntry[],
  options: { afterDate?: string; todayDate: string },
): boolean {
  const afterDateRank = options.afterDate ? getDateRank(options.afterDate) : -1;

  return filterDiaryEntriesBeforeDate(entries, options.todayDate).some(
    (entry) => getDateRank(entry.date) > afterDateRank,
  );
}

function findLatestDiaryDate(
  entries: ParsedDiaryEntry[],
  todayDate: string,
): string | undefined {
  const entriesBeforeToday = filterDiaryEntriesBeforeDate(entries, todayDate);

  return [...entriesBeforeToday]
    .sort((left, right) => getDateRank(right.date) - getDateRank(left.date))[0]
    ?.date;
}

function getKstDeliveryContext(now: Date = new Date()): DeliveryDateContext {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DELIVERY_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!weekday || !year || !month || !day || !hour || !minute) {
    throw new Error("현재 KST 기준 delivery 시간을 계산하지 못했습니다.");
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    weekday: weekday as WeekdayName,
  };
}

function isReminderDay(context: DeliveryDateContext): boolean {
  return REMINDER_WEEKDAYS.has(context.weekday);
}

function isReflectionDay(context: DeliveryDateContext): boolean {
  return REFLECTION_WEEKDAYS.has(context.weekday);
}

function logMessagePreview(label: "Reminder" | "Reflection", message: string): void {
  console.log(`[delivery] ${label} 전송 내용`);
  console.log(message);
}

async function loadEntries(): Promise<ParsedDiaryEntry[]> {
  console.log("[delivery] Notion 일지 조회를 시작합니다.");
  const entries = await fetchDiaryEntries();
  console.log(`[delivery] Notion 일지 ${entries.length}건을 불러왔습니다.`);
  return entries;
}

export async function runDeliveryJob(now: Date = new Date()): Promise<void> {
  const context = getKstDeliveryContext(now);

  console.log(
    `[delivery] 실행 시작 (${context.date} ${context.weekday} ${context.time} KST)`,
  );
  console.log(
    `[delivery] 설계 기준: 평일 reminder, 월/목 reflection, 기준 시각 ${DELIVERY_TIME_LABEL} KST`,
  );

  const reminderDay = isReminderDay(context);
  const reflectionDay = isReflectionDay(context);

  if (!reminderDay && !reflectionDay) {
    console.log("[delivery] 주말이므로 reminder와 reflection을 모두 건너뜁니다.");
    return;
  }

  const state = await readState();
  const reminderAlreadySent = state.lastReminderDate === context.date;
  const reflectionAlreadySent = state.lastReflectionDate === context.date;

  if (!reminderDay) {
    console.log("[delivery] 오늘은 reminder 발송 대상 요일이 아닙니다.");
  } else if (reminderAlreadySent) {
    console.log("[delivery] reminder는 오늘 이미 성공적으로 전송되어 중복 발송을 건너뜁니다.");
  }

  if (!reflectionDay) {
    console.log("[delivery] 오늘은 reflection 발송 대상 요일이 아닙니다.");
  } else if (reflectionAlreadySent) {
    console.log("[delivery] reflection은 오늘 이미 성공적으로 전송되어 중복 발송을 건너뜁니다.");
  }

  const shouldAttemptReminder = reminderDay && !reminderAlreadySent;
  const shouldAttemptReflection = reflectionDay && !reflectionAlreadySent;

  if (!shouldAttemptReminder && !shouldAttemptReflection) {
    console.log("[delivery] 오늘 실행할 전송 작업이 없습니다.");
    return;
  }

  const entries = await loadEntries();
  const failures: string[] = [];

  if (shouldAttemptReminder) {
    const reminderResult = prepareReminderJob(entries);

    if (reminderResult.itemCount === 0) {
      console.log("[delivery] reminder TODO가 없어 fallback 메시지를 전송합니다.");
    }

    logMessagePreview("Reminder", reminderResult.message);

    try {
      await sendReminderMessage(reminderResult.message);
      await updateReminderSendDate(context.date);
      console.log("[delivery] reminder 전송 성공 후 state를 업데이트했습니다.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[delivery] reminder 전송 실패: ${message}`);
      failures.push(`reminder: ${message}`);
    }
  }

  if (shouldAttemptReflection) {
    const hasNewDiaryEntries = hasNewReflectionDiaryEntries(entries, {
      afterDate: state.lastReflectionDate ?? undefined,
      todayDate: context.date,
    });

    if (!hasNewDiaryEntries) {
      const fallbackMessage = buildReflectionFallbackMessage({
        lastDiaryDate: findLatestDiaryDate(entries, context.date),
      });

      console.log("[delivery] 마지막 회고 이후 새 일지가 없어 fallback 메시지를 전송합니다.");
      logMessagePreview("Reflection", fallbackMessage);

      try {
        await sendReflectionMessage(fallbackMessage);
        await updateReflectionSendDate(context.date);
        console.log("[delivery] reflection 전송 성공 후 state를 업데이트했습니다.");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[delivery] reflection 전송 실패: ${message}`);
        failures.push(`reflection: ${message}`);
      }
    } else {
      const reflectionResult = await prepareReflectionV2Job(entries, {
        afterDate: state.lastReflectionDate ?? undefined,
        todayDate: context.date,
      });

      if (!reflectionResult.message) {
        console.log(
          "[delivery] reflection에 사용할 새 기록이 없거나 근거가 부족해 전송을 건너뜁니다.",
        );
      } else {
        logMessagePreview("Reflection", reflectionResult.message);

        try {
          await sendReflectionMessage(reflectionResult.message);
          await updateReflectionSendDate(context.date);
          console.log("[delivery] reflection 전송 성공 후 state를 업데이트했습니다.");
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[delivery] reflection 전송 실패: ${message}`);
          failures.push(`reflection: ${message}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Delivery finished with errors: ${failures.join(" | ")}`);
  }

  console.log("[delivery] 실행을 마쳤습니다.");
}
