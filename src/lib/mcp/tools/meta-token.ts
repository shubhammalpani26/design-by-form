import type { ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";

const FB_API = "https://graph.facebook.com/v18.0";
const REFRESH_BUFFER_MS = 24 * 60 * 60 * 1000;

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseProjectUrl(): string {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is required");
  return url;
}

function supabasePublishableKey(): string {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // fall through
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEYS, or SUPABASE_ANON_KEY is required");
}

function appCreds(): { appId: string; appSecret: string; currentEnvToken: string } {
  const appId = runtimeEnv("META_APP_ID");
  const appSecret = runtimeEnv("META_APP_SECRET");
  const currentEnvToken = runtimeEnv("META_ACCESS_TOKEN");
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be configured for Meta/Instagram posting");
  }
  if (!currentEnvToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }
  return { appId, appSecret, currentEnvToken };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meta token exchange failed (${res.status}): ${text.slice(0, 500)}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function exchangeForLongLived(shortToken: string, appId: string, appSecret: string) {
  const url = `${FB_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
  const data = (await fetchJson(url)) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (data.error?.message) {
    throw new Error(`Meta token exchange error: ${data.error.message}`);
  }
  if (!data.access_token) {
    throw new Error("Meta token exchange did not return an access_token");
  }
  const expiresInMs = (data.expires_in ?? 5184000) * 1000;
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "bearer",
    expires_at: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadStoredState(ctx: ToolContext) {
  const userId = ctx.getUserId();
  if (!userId) throw new Error("Not authenticated");
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("user_connector_tokens")
    .select("meta_defaults")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load Meta token state: ${error.message}`);
  const meta_defaults = (data?.meta_defaults ?? {}) as Record<string, unknown>;
  const tokenState = meta_defaults?.meta_token
    ? (meta_defaults.meta_token as { access_token?: string; expires_at?: string; token_type?: string })
    : null;
  return { meta_defaults, tokenState };
}

async function saveTokenState(
  ctx: ToolContext,
  meta_defaults: Record<string, unknown> | null,
  tokenState: { access_token: string; expires_at: string; token_type: string },
) {
  const userId = ctx.getUserId();
  if (!userId) throw new Error("Not authenticated");
  const supabase = supabaseForUser(ctx);
  const next = { ...(meta_defaults ?? {}), meta_token: tokenState };
  const { error } = await supabase
    .from("user_connector_tokens")
    .upsert({ user_id: userId, meta_defaults: next }, { onConflict: "user_id" });
  if (error) throw new Error(`Failed to save Meta token state: ${error.message}`);
}

function isExpiringSoon(tokenState: { access_token?: string; expires_at?: string } | null): boolean {
  if (!tokenState?.access_token) return true;
  if (!tokenState.expires_at) return false;
  const expiresAt = new Date(tokenState.expires_at).getTime();
  return Date.now() + REFRESH_BUFFER_MS >= expiresAt;
}

export async function getMetaAccessToken(ctx: ToolContext): Promise<string> {
  const { appId, appSecret, currentEnvToken } = appCreds();
  const { meta_defaults, tokenState } = await loadStoredState(ctx);

  if (!isExpiringSoon(tokenState)) {
    return tokenState!.access_token!;
  }

  const sourceToken = tokenState?.access_token ?? currentEnvToken;
  const fresh = await exchangeForLongLived(sourceToken, appId, appSecret);
  await saveTokenState(ctx, meta_defaults, fresh);
  return fresh.access_token;
}

export async function getMetaDefaults(ctx: ToolContext) {
  const { meta_defaults } = await loadStoredState(ctx);
  const stored = (meta_defaults ?? {}) as {
    ig_user_id?: string;
    ig_username?: string;
    page_id?: string;
    ad_account_id?: string;
  };
  // Default to the Nyzora Instagram Business account when no preference is stored.
  if (!stored.ig_user_id) {
    return {
      ...stored,
      ig_user_id: "17841436891682401",
      ig_username: "nyzora.ai",
      page_id: "1087872784403919",
    };
  }
  return stored;
}
