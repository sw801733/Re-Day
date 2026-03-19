import { env } from "../config/env";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const REFLECTION_TEMPERATURE = 0.25;

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function readOpenAIEnv(name: "OPENAI_API_KEY" | "OPENAI_MODEL"): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required for reflection generation.`);
  }

  return value;
}

function truncateErrorText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

export async function createOpenAIChatCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = readOpenAIEnv("OPENAI_API_KEY");
  const model = readOpenAIEnv("OPENAI_MODEL");

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: REFLECTION_TEMPERATURE,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const message = truncateErrorText(errorText, 240);

    throw new Error(`OpenAI 요청이 실패했습니다 (${response.status}). ${message}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI 응답에서 reflection 내용을 찾지 못했습니다.");
  }

  return content;
}
