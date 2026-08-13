import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { adsToken, graph, normalizeActId, text } from "./meta-ads-api";

export default defineTool({
  name: "meta_ads_accounts",
  title: "Meta ad accounts & structure",
  description:
    "Lists the Meta ad accounts the connected Nyzora account can manage, including currency, spend cap, amount spent and account status. Optionally drills into one account to list its campaigns, ad sets and ads with their status and budgets. Read-only.",
  inputSchema: {
    ad_account_id: z
      .string()
      .optional()
      .describe("Optional ad account id (with or without the act_ prefix) to list campaigns/ad sets/ads for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ ad_account_id }, ctx) => {
    const token = await adsToken(ctx);
    if (!ad_account_id) {
      const data = await graph<{ data?: unknown[] }>(
        "/me/adaccounts?fields=id,account_id,name,currency,account_status,amount_spent,spend_cap,balance,funding_source_details&limit=50",
        token,
      );
      return { ...text(data), structuredContent: { accounts: data.data ?? [] } };
    }
    const act = normalizeActId(ad_account_id);
    const [campaigns, adsets, ads] = await Promise.all([
      graph<{ data?: unknown[] }>(
        `/${act}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time&limit=50`,
        token,
      ),
      graph<{ data?: unknown[] }>(
        `/${act}/adsets?fields=id,name,status,effective_status,campaign_id,daily_budget,optimization_goal,targeting&limit=50`,
        token,
      ),
      graph<{ data?: unknown[] }>(
        `/${act}/ads?fields=id,name,status,effective_status,adset_id,creative{id,thumbnail_url}&limit=50`,
        token,
      ),
    ]);
    const payload = { ad_account_id: act, campaigns: campaigns.data ?? [], adsets: adsets.data ?? [], ads: ads.data ?? [] };
    return { ...text(payload), structuredContent: payload };
  },
});
