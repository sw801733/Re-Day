import { sendSlackTextMessage, type SlackSendMessageResult } from "../clients/slackClient";
import { env } from "../config/env";

function readReminderChannel(): string {
  const channel = env.SLACK_REMINDER_CHANNEL;

  if (!channel) {
    throw new Error(
      "SLACK_REMINDER_CHANNEL environment variable is required for reminder delivery.",
    );
  }

  return channel;
}

export async function sendReminderMessage(
  message: string,
): Promise<SlackSendMessageResult> {
  return sendSlackTextMessage(readReminderChannel(), message);
}
