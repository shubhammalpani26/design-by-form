import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getMetaAccessToken, getMetaDefaults } from "./meta-token";

const FB_API = "https://graph.facebook.com/v18.0";

async function fb(path: string, token: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${FB_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new ToolError(`Meta ${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default defineTool({
  name: "meta_ig_post",
  title: "Post to Instagram",
  description:
    "Publish a single-image Instagram feed post. Uses the default Instagram account configured in user_connector_tokens unless ig_user_id is provided. The image_url must be publicly reachable by Meta's servers.",
  inputSchema: {
    image_url: z.string().url().describe("Publicly reachable image URL"),
    caption: z.string().min(1).describe("Caption text"),
    ig_user_id: z.string().optional().describe("Instagram Business account id (optional; uses default if omitted)"),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ image_url, caption, ig_user_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Not authenticated");
    }
    const token = await getMetaAccessToken(ctx);
    const defaults = await getMetaDefaults(ctx);
    const resolvedIgUserId = ig_user_id ?? defaults.ig_user_id ?? "";
    if (!resolvedIgUserId) {
      throw new ToolError(
        "No Instagram Business account ID configured. Run meta_me to find your account ID, then store it in user_connector_tokens meta_defaults.ig_user_id.",
      );
    }

    const encodedImageUrl = encodeURIComponent(image_url);
    const encodedCaption = encodeURIComponent(caption);
    const container = (await fb(
      `/${resolvedIgUserId}/media?image_url=${encodedImageUrl}&caption=${encodedCaption}`,
      token,
      { method: "POST" },
    )) as { id?: string };

    if (!container.id) {
      throw new ToolError("Instagram media container creation failed");
    }

    let status = "IN_PROGRESS";
    let lastError = "";
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, attempt === 0 ? 2000 : 3000));
      const s = (await fb(`/${container.id}?fields=status_code,status`, token)) as {
        status_code?: string;
        status?: string;
      };
      status = s.status_code ?? "IN_PROGRESS";
      lastError = s.status ?? "";
      if (status === "FINISHED") break;
      if (status === "ERROR" || status === "EXPIRED") {
        throw new ToolError(`Instagram media processing failed (${status}): ${lastError}`);
      }
    }

    if (status !== "FINISHED") {
      throw new ToolError(`Instagram media was still processing after ~60s (status: ${status}). ${lastError}`);
    }

    const published = (await fb(
      `/${resolvedIgUserId}/media_publish?creation_id=${container.id}`,
      token,
      { method: "POST" },
    )) as { id?: string };

    return {
      content: [{ type: "text", text: `Posted to Instagram. Media ID: ${published.id ?? "unknown"}` }],
      structuredContent: { container_id: container.id, media_id: published.id },
    };
  },
});
