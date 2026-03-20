import { sendSlackTextMessage, type SlackSendMessageResult } from "../clients/slackClient";
import { env } from "../config/env";

function readReflectionChannel(): string {
  const channel = env.SLACK_REFLECTION_CHANNEL;

  if (!channel) {
    throw new Error(
      "SLACK_REFLECTION_CHANNEL environment variable is required for reflection delivery.",
    );
  }

  return channel;
}

export async function sendReflectionMessage(
  message: string,
): Promise<SlackSendMessageResult> {
  return sendSlackTextMessage(readReflectionChannel(), message);
}
