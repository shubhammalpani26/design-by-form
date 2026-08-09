import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getMetaAccessToken } from "./meta-token";

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
  name: "meta_me",
  title: "Meta account info",
  description:
    "Returns the connected Meta user id/name and the Facebook pages they manage, including linked Instagram Business accounts. Use this to discover page IDs and Instagram account IDs.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Not authenticated");
    }
    const token = await getMetaAccessToken(ctx);
    const me = (await fb(
      "/me?fields=id,name,accounts{name,id,access_token,instagram_business_account{id,username}}",
      token,
    )) as {
      id?: string;
      name?: string;
      accounts?: {
        data?: Array<{
          id: string;
          name: string;
          instagram_business_account?: { id: string; username: string };
        }>;
      };
    };
    return {
      content: [{ type: "text", text: JSON.stringify(me, null, 2) }],
      structuredContent: {
        user_id: me.id,
        name: me.name,
        pages: me.accounts?.data ?? [],
      },
    };
  },
});
