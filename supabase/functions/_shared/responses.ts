import { createOpenAI } from "npm:@ai-sdk/openai@4.0.106";
import { Output, streamText, type ModelMessage } from "npm:ai@7.0.159";
import type { z } from "npm:zod@4.4.3";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.ts";

export const LOVABLE_AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

/**
 * One-shot structured answer from Lovable AI (OpenAI Responses through the
 * gateway). Streams the gateway leg and resolves the typed object server-side.
 */
export async function generateStructured<T>(
  request: Request,
  config: { apiKey: string; model: string; reasoningEffort?: "low" | "medium" },
  schema: z.ZodType<T>,
  messages: ModelMessage[],
  instructions: string,
): Promise<T> {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: LOVABLE_AI_GATEWAY_URL,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const reasoning = config.model !== "openai/chat-latest";
  let streamError: unknown = null;
  const result = streamText({
    model: provider.responses(config.model),
    instructions,
    messages,
    output: Output.object({ schema }),
    abortSignal: request.signal,
    onError: ({ error }) => { streamError = error; },
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? {
              forceReasoning: true,
              reasoningEffort: config.reasoningEffort ?? "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    },
  });
  try {
    return (await result.output) as T;
  } catch (e) {
    throw streamError ?? e;
  }
}
