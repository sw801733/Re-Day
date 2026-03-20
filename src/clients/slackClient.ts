import { env } from "../config/env";

const SLACK_CHAT_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

interface SlackPostMessageResponse {
  ok?: boolean;
  error?: string;
  channel?: string;
  ts?: string;
}

export interface SlackSendMessageResult {
  channel: string;
  ts: string;
}

function readSlackBotToken(): string {
  const token = env.SLACK_BOT_TOKEN;

  if (!token) {
    throw new Error("SLACK_BOT_TOKEN environment variable is required for Slack delivery.");
  }

  return token;
}

function truncateErrorText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

export async function sendSlackTextMessage(
  channel: string,
  text: string,
): Promise<SlackSendMessageResult> {
  const token = readSlackBotToken();
  const trimmedChannel = channel.trim();

  if (!trimmedChannel) {
    throw new Error("Slack channel is required.");
  }

  const response = await fetch(SLACK_CHAT_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: trimmedChannel,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = truncateErrorText(await response.text(), 240);
    throw new Error(`Slack 요청이 실패했습니다 (${response.status}). ${errorText}`);
  }

  const data = (await response.json()) as SlackPostMessageResponse;

  if (!data.ok) {
    throw new Error(`Slack 메시지 전송이 실패했습니다. ${data.error ?? "unknown_error"}`);
  }

  if (!data.channel || !data.ts) {
    throw new Error("Slack 응답에서 channel 또는 ts 값을 찾지 못했습니다.");
  }

  return {
    channel: data.channel,
    ts: data.ts,
  };
}
