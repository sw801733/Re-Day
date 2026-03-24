import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export interface DeliveryState {
  lastReminderDate: string | null;
  lastReflectionDate: string | null;
}

const PROJECT_ROOT_PATH = path.resolve(__dirname, "..", "..");
const CURRENT_STATE_FILE_LABEL = "data/delivery-state.json";
const LEGACY_STATE_FILE_LABEL = "src/storage/state.json";

export const STATE_FILE_PATH = path.resolve(PROJECT_ROOT_PATH, CURRENT_STATE_FILE_LABEL);
const LEGACY_STATE_FILE_PATH = path.resolve(PROJECT_ROOT_PATH, LEGACY_STATE_FILE_LABEL);

interface ReadStateFileResult {
  state: DeliveryState;
  shouldRewrite: boolean;
}

function buildDefaultState(): DeliveryState {
  return {
    lastReminderDate: null,
    lastReflectionDate: null,
  };
}

function normalizeStateValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeState(input: unknown): DeliveryState {
  if (typeof input !== "object" || input === null) {
    return buildDefaultState();
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

async function readStateFile(
  filePath: string,
  fileLabel: string,
): Promise<ReadStateFileResult | null> {
  try {
    const rawContent = await readFile(filePath, "utf8");

    if (!rawContent.trim()) {
      console.warn(`[state] ${fileLabel}이 비어 있어 기본값으로 초기화합니다.`);
      return {
        state: buildDefaultState(),
        shouldRewrite: true,
      };
    }

    try {
      return {
        state: normalizeState(JSON.parse(rawContent)),
        shouldRewrite: false,
      };
    } catch {
      console.warn(`[state] ${fileLabel}이 올바른 JSON이 아니어서 기본값으로 초기화합니다.`);
      return {
        state: buildDefaultState(),
        shouldRewrite: true,
      };
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}

export async function readState(): Promise<DeliveryState> {
  await ensureStateDirectory();

  const currentStateResult = await readStateFile(STATE_FILE_PATH, CURRENT_STATE_FILE_LABEL);

  if (currentStateResult) {
    if (currentStateResult.shouldRewrite) {
      await writeStateFile(currentStateResult.state);
    }

    return currentStateResult.state;
  }

  const legacyStateResult = await readStateFile(
    LEGACY_STATE_FILE_PATH,
    LEGACY_STATE_FILE_LABEL,
  );

  if (legacyStateResult) {
    console.log(
      `[state] ${LEGACY_STATE_FILE_LABEL} 상태를 ${CURRENT_STATE_FILE_LABEL}로 마이그레이션합니다.`,
    );
    await writeStateFile(legacyStateResult.state);
    return legacyStateResult.state;
  }

  const defaultState = buildDefaultState();

  console.log(`[state] ${CURRENT_STATE_FILE_LABEL}이 없어 기본 상태 파일을 생성합니다.`);
  await writeStateFile(defaultState);

  return defaultState;
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
