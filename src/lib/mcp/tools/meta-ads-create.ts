import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { adsToken, assertBudget, graph, normalizeActId, text } from "./meta-ads-api";

/**
 * Builds a complete campaign -> ad set -> creative -> ad stack for a Nyzora Originals
 * product. Everything is created PAUSED. Nothing spends until the owner explicitly
 * flips it live via `meta_ads_manage` with confirm: 'I APPROVE SPEND'.
 */
export default defineTool({
  name: "meta_ads_create_campaign",
  title: "Draft a Meta ads campaign (paused)",
  description:
    "Creates a complete Meta ads stack — campaign, ad set with targeting and daily budget, image creative and ad — for a Nyzora product. Everything is created in PAUSED state and cannot spend money. Use meta_ads_manage with confirm to launch it after the owner approves.",
  inputSchema: {
    ad_account_id: z.string().describe("Ad account id (act_... or numeric)."),
    page_id: z.string().describe("Facebook Page id that the ad runs from."),
    name: z.string().min(3).max(120).describe("Campaign name, e.g. 'Originals — Pet Bust — US Prospecting'."),
    objective: z
      .enum(["OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT"])
      .default("OUTCOME_SALES"),
    daily_budget_usd: z.number().positive().describe("Daily budget in USD for the ad set."),
    image_url: z.string().url().describe("Publicly reachable image URL for the ad creative."),
    primary_text: z.string().min(1).max(500).describe("Main ad body copy."),
    headline: z.string().min(1).max(60).describe("Ad headline."),
    link_url: z.string().url().describe("Landing page URL on nyzora.ai."),
    call_to_action: z.enum(["SHOP_NOW", "LEARN_MORE", "ORDER_NOW", "SIGN_UP"]).default("SHOP_NOW"),
    countries: z.array(z.string().length(2)).default(["US"]).describe("ISO country codes to target."),
    age_min: z.number().int().min(18).max(65).default(25),
    age_max: z.number().int().min(18).max(65).default(55),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    const token = await adsToken(ctx);
    assertBudget(input.daily_budget_usd);
    if (input.age_max < input.age_min) throw new ToolError("age_max must be greater than or equal to age_min.");
    const act = normalizeActId(input.ad_account_id);

    const campaign = await graph<{ id: string }>(`/${act}/campaigns`, token, {
      form: {
        name: input.name,
        objective: input.objective,
        status: "PAUSED",
        special_ad_categories: "[]",
      },
    });

    const optimization_goal = input.objective === "OUTCOME_SALES" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS";
    const targeting = {
      geo_locations: { countries: input.countries },
      age_min: input.age_min,
      age_max: input.age_max,
    };

    const adsetForm: Record<string, string> = {
      name: `${input.name} — Ad set`,
      campaign_id: campaign.id,
      daily_budget: String(Math.round(input.daily_budget_usd * 100)),
      billing_event: "IMPRESSIONS",
      optimization_goal: optimization_goal === "OFFSITE_CONVERSIONS" ? "LINK_CLICKS" : optimization_goal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify(targeting),
      status: "PAUSED",
    };
    const adset = await graph<{ id: string }>(`/${act}/adsets`, token, { form: adsetForm });

    const creative = await graph<{ id: string }>(`/${act}/adcreatives`, token, {
      form: {
        name: `${input.name} — Creative`,
        object_story_spec: JSON.stringify({
          page_id: input.page_id,
          link_data: {
            link: input.link_url,
            message: input.primary_text,
            name: input.headline,
            picture: input.image_url,
            call_to_action: { type: input.call_to_action, value: { link: input.link_url } },
          },
        }),
        degrees_of_freedom_spec: JSON.stringify({ creative_features_spec: { standard_enhancements: { enroll_status: "OPT_OUT" } } }),
      },
    });

    const ad = await graph<{ id: string }>(`/${act}/ads`, token, {
      form: {
        name: `${input.name} — Ad`,
        adset_id: adset.id,
        creative: JSON.stringify({ creative_id: creative.id }),
        status: "PAUSED",
      },
    });

    const payload = {
      status: "PAUSED — nothing is spending yet",
      ad_account_id: act,
      campaign_id: campaign.id,
      adset_id: adset.id,
      creative_id: creative.id,
      ad_id: ad.id,
      daily_budget_usd: input.daily_budget_usd,
      launch_instructions:
        "Owner approval required. To go live, call meta_ads_manage with the campaign_id, ad set id and ad id set to ACTIVE and confirm: 'I APPROVE SPEND'.",
    };
    return { ...text(payload), structuredContent: payload };
  },
});
