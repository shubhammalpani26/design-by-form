import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { adsToken, graph, normalizeActId, text } from "./meta-ads-api";

export default defineTool({
  name: "meta_ads_insights",
  title: "Meta ads performance",
  description:
    "Reads Meta Ads performance (spend, impressions, reach, clicks, CTR, CPC, CPM, purchases, purchase value and ROAS) for an ad account, campaign, ad set or ad over a date preset. Read-only — never changes anything.",
  inputSchema: {
    object_id: z.string().describe("Ad account id (act_... or numeric), campaign id, ad set id or ad id."),
    level: z.enum(["account", "campaign", "adset", "ad"]).default("campaign").describe("Breakdown level."),
    date_preset: z
      .enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month", "maximum"])
      .default("last_7d"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ object_id, level, date_preset }, ctx) => {
    const token = await adsToken(ctx);
    const id = /^\d+$/.test(object_id) && object_id.length > 14 ? object_id : normalizeActId(object_id);
    const target = object_id.startsWith("act_") || (/^\d{1,16}$/.test(object_id) && level === "account") ? normalizeActId(object_id) : object_id;
    const fields =
      "campaign_name,adset_name,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas";
    const data = await graph<{ data?: unknown[] }>(
      `/${target || id}/insights?level=${level}&date_preset=${date_preset}&fields=${fields}&limit=100`,
      token,
    );
    const payload = { object_id: target, level, date_preset, rows: data.data ?? [] };
    return { ...text(payload), structuredContent: payload };
  },
});
