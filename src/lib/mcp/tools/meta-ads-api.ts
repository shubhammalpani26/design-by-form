import { ToolError } from "@lovable.dev/mcp-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { getMetaAccessToken } from "./meta-token";

export const ADS_API = "https://graph.facebook.com/v21.0";

/** Hard safety cap. Nothing may be created or raised above this daily budget without a code change. */
export const MAX_DAILY_BUDGET_USD = 200;

export async function graph<T = unknown>(
  path: string,
  token: string,
  init: RequestInit & { form?: Record<string, string> } = {},
): Promise<T> {
  const { form, ...rest } = init;
  const res = await fetch(`${ADS_API}${path}`, {
    ...rest,
    method: form ? "POST" : (rest.method ?? "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(rest.headers ?? {}),
    },
    body: form ? new URLSearchParams(form).toString() : rest.body,
  });
  const text = await res.text();
  if (!res.ok) throw new ToolError(`Meta Ads ${res.status} ${path}: ${text.slice(0, 700)}`);
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    return { raw: text } as T;
  }
}

export async function adsToken(ctx: ToolContext): Promise<string> {
  if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
  return getMetaAccessToken(ctx);
}

export function normalizeActId(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

export function assertBudget(usd: number) {
  if (!Number.isFinite(usd) || usd <= 0) throw new ToolError("Daily budget must be a positive number of USD.");
  if (usd > MAX_DAILY_BUDGET_USD) {
    throw new ToolError(
      `Daily budget $${usd} exceeds the built-in safety cap of $${MAX_DAILY_BUDGET_USD}/day. Ask the owner to raise MAX_DAILY_BUDGET_USD in code.`,
    );
  }
}

export function text(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}
