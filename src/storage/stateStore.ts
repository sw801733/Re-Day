import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export interface DeliveryState {
  lastReminderDate: string | null;
  lastReflectionDate: string | null;
}

const DEFAULT_STATE: DeliveryState = {
  lastReminderDate: null,
  lastReflectionDate: null,
};

export const STATE_FILE_PATH = path.resolve(process.cwd(), "src/storage/state.json");

function normalizeStateValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeState(input: unknown): DeliveryState {
  if (typeof input !== "object" || input === null) {
    return DEFAULT_STATE;
  }

  return {
    lastReminderDate: normalizeStateValue(
      Reflect.get(input, "lastReminderDate"),
    ),
    lastReflectionDate: normalizeStateValue(
      Reflect.get(input, "lastReflectionDate"),
    ),
  };
}

async function ensureStateDirectory(): Promise<void> {
  await mkdir(path.dirname(STATE_FILE_PATH), { recursive: true });
}

async function writeStateFile(state: DeliveryState): Promise<void> {
  await ensureStateDirectory();

  const tempFilePath = `${STATE_FILE_PATH}.tmp`;
  const content = `${JSON.stringify(state, null, 2)}\n`;

  await writeFile(tempFilePath, content, "utf8");
  await rename(tempFilePath, STATE_FILE_PATH);
}

export async function readState(): Promise<DeliveryState> {
  await ensureStateDirectory();

  try {
    const rawContent = await readFile(STATE_FILE_PATH, "utf8");

    if (!rawContent.trim()) {
      console.warn("[state] state.json이 비어 있어 기본값으로 초기화합니다.");
      await writeStateFile(DEFAULT_STATE);
      return DEFAULT_STATE;
    }

    try {
      return normalizeState(JSON.parse(rawContent));
    } catch {
      console.warn("[state] state.json이 올바른 JSON이 아니어서 기본값으로 초기화합니다.");
      await writeStateFile(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      console.log("[state] state.json이 없어 기본 상태 파일을 생성합니다.");
      await writeStateFile(DEFAULT_STATE);
      return DEFAULT_STATE;
    }

    throw error;
  }
}

export async function updateReminderSendDate(date: string): Promise<DeliveryState> {
  const nextState = {
    ...(await readState()),
    lastReminderDate: date,
  };

  await writeStateFile(nextState);
  return nextState;
}

export async function updateReflectionSendDate(
  date: string,
): Promise<DeliveryState> {
  const nextState = {
    ...(await readState()),
    lastReflectionDate: date,
  };

  await writeStateFile(nextState);
  return nextState;
}
