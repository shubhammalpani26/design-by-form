import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { adsToken, assertBudget, graph, text } from "./meta-ads-api";

export default defineTool({
  name: "meta_ads_manage",
  title: "Pause, resume or rebudget a Meta ad",
  description:
    "Changes the status (ACTIVE/PAUSED) or daily budget of an existing Meta campaign, ad set or ad. Turning something ACTIVE starts spending money, so it requires confirm to be set to the exact string 'I APPROVE SPEND'. Pausing never requires confirmation. Daily budgets are capped by a built-in safety limit.",
  inputSchema: {
    object_id: z.string().describe("Campaign, ad set or ad id to modify."),
    status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("New status. ACTIVE requires confirm."),
    daily_budget_usd: z
      .number()
      .positive()
      .optional()
      .describe("New daily budget in USD (campaign or ad set only). Requires confirm."),
    confirm: z
      .string()
      .optional()
      .describe("Must be exactly 'I APPROVE SPEND' for any change that can start or increase spending."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ object_id, status, daily_budget_usd, confirm }, ctx) => {
    const token = await adsToken(ctx);
    const spendy = status === "ACTIVE" || typeof daily_budget_usd === "number";
    if (spendy && confirm !== "I APPROVE SPEND") {
      throw new ToolError(
        "This change can start or increase ad spend. Ask the account owner to approve, then re-run with confirm: 'I APPROVE SPEND'.",
      );
    }
    if (!status && daily_budget_usd === undefined) throw new ToolError("Nothing to change: pass status and/or daily_budget_usd.");
    const form: Record<string, string> = {};
    if (status) form.status = status;
    if (daily_budget_usd !== undefined) {
      assertBudget(daily_budget_usd);
      form.daily_budget = String(Math.round(daily_budget_usd * 100));
    }
    const result = await graph<{ success?: boolean; id?: string }>(`/${object_id}`, token, { form });
    const payload = { object_id, applied: form, result };
    return { ...text(payload), structuredContent: payload };
  },
});
