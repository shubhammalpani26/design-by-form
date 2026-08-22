import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  adsToken,
  assertBudget,
  getVideoThumbnail,
  graph,
  normalizeActId,
  text,
  uploadAdVideo,
  waitForVideoReady,
} from "./meta-ads-api";

/**
 * Builds a complete campaign -> ad set -> creative -> ad stack for a Nyzora Originals
 * product. Everything is created PAUSED. Nothing spends until the owner explicitly
 * flips it live via `meta_ads_manage` with confirm: 'I APPROVE SPEND'.
 */
export default defineTool({
  name: "meta_ads_create_campaign",
  title: "Draft a Meta ads campaign (paused)",
  description:
    "Creates a complete Meta ads stack — campaign, ad set with targeting and daily budget, image OR video creative and ad — for a Nyzora product. Pass image_url for a static ad or video_url for a video ad (the video is uploaded to the ad account and transcoded first). Everything is created in PAUSED state and cannot spend money. Use meta_ads_manage with confirm to launch it after the owner approves.",
  inputSchema: {
    ad_account_id: z.string().describe("Ad account id (act_... or numeric)."),
    page_id: z.string().describe("Facebook Page id that the ad runs from."),
    name: z.string().min(3).max(120).describe("Campaign name, e.g. 'Originals — Pet Bust — US Prospecting'."),
    objective: z
      .enum(["OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT"])
      .default("OUTCOME_SALES"),
    daily_budget_usd: z.number().positive().describe("Daily budget in USD for the ad set."),
    image_url: z
      .string()
      .url()
      .optional()
      .describe("Publicly reachable image URL for a static ad creative. Provide either image_url or video_url."),
    video_url: z
      .string()
      .url()
      .optional()
      .describe(
        "Publicly reachable MP4 URL for a video ad creative. The video is uploaded to the ad account and Meta transcodes it before the creative is built.",
      ),
    video_thumbnail_url: z
      .string()
      .url()
      .optional()
      .describe("Optional custom thumbnail for the video ad. Defaults to Meta's preferred auto-generated frame."),
    primary_text: z.string().min(1).max(500).describe("Main ad body copy."),
    headline: z.string().min(1).max(60).describe("Ad headline."),
    link_url: z.string().url().describe("Landing page URL on nyzora.ai."),
    call_to_action: z.enum(["SHOP_NOW", "LEARN_MORE", "ORDER_NOW", "SIGN_UP"]).default("SHOP_NOW"),
    countries: z.array(z.string().length(2)).default(["US"]).describe("ISO country codes to target."),
    age_min: z.number().int().min(18).max(65).default(25),
    age_max: z.number().int().min(18).max(65).default(55),
    pixel_id: z
      .string()
      .optional()
      .describe(
        "Meta pixel id. Required for OUTCOME_SALES so the ad set optimizes for a conversion event instead of clicks.",
      ),
    optimize_for: z
      .enum(["PURCHASE", "INITIATE_CHECKOUT", "CONTENT_VIEW", "LEAD"])
      .default("PURCHASE")
      .describe("Pixel event the sales ad set optimizes for. Use INITIATE_CHECKOUT while purchase volume is thin."),
    interest_ids: z
      .array(z.string())
      .default([])
      .describe("Meta detailed-targeting interest ids (look them up with meta_ads_audiences search_interests)."),
    locales: z
      .array(z.number().int())
      .default([])
      .describe("Meta locale ids, e.g. 6 = English (US), 24 = English (UK). Empty means all languages."),
    custom_audience_ids: z
      .array(z.string())
      .default([])
      .describe("Custom audience ids to target — used for the retargeting ad set."),
    excluded_custom_audience_ids: z
      .array(z.string())
      .default([])
      .describe("Custom audience ids to exclude, e.g. past purchasers."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    const token = await adsToken(ctx);
    assertBudget(input.daily_budget_usd);
    if (input.age_max < input.age_min) throw new ToolError("age_max must be greater than or equal to age_min.");
    if (!input.image_url && !input.video_url) {
      throw new ToolError("Provide either image_url (static ad) or video_url (video ad).");
    }
    if (input.image_url && input.video_url) {
      throw new ToolError("Provide only one of image_url or video_url, not both.");
    }
    const act = normalizeActId(input.ad_account_id);

    const campaign = await graph<{ id: string }>(`/${act}/campaigns`, token, {
      form: {
        name: input.name,
        objective: input.objective,
        status: "PAUSED",
        special_ad_categories: "[]",
      },
    });

    const isSales = input.objective === "OUTCOME_SALES";
    if (isSales && !input.pixel_id) {
      throw new ToolError(
        "pixel_id is required for OUTCOME_SALES — without it Meta optimizes for clicks, not buyers.",
      );
    }
    const optimization_goal = isSales
      ? "OFFSITE_CONVERSIONS"
      : input.objective === "OUTCOME_AWARENESS"
        ? "REACH"
        : "LINK_CLICKS";

    const targeting: Record<string, unknown> = {
      geo_locations: { countries: input.countries },
      age_min: input.age_min,
      age_max: input.age_max,
    };
    if (input.interest_ids.length) {
      targeting.flexible_spec = [{ interests: input.interest_ids.map((id) => ({ id })) }];
    }
    if (input.locales.length) targeting.locales = input.locales;
    if (input.custom_audience_ids.length) {
      targeting.custom_audiences = input.custom_audience_ids.map((id) => ({ id }));
    }
    if (input.excluded_custom_audience_ids.length) {
      targeting.excluded_custom_audiences = input.excluded_custom_audience_ids.map((id) => ({ id }));
    }

    const adsetForm: Record<string, string> = {
      name: `${input.name} — Ad set`,
      campaign_id: campaign.id,
      daily_budget: String(Math.round(input.daily_budget_usd * 100)),
      billing_event: "IMPRESSIONS",
      optimization_goal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify(targeting),
      status: "PAUSED",
    };
    if (isSales && input.pixel_id) {
      adsetForm.promoted_object = JSON.stringify({
        pixel_id: input.pixel_id,
        custom_event_type: input.optimize_for,
      });
    }
    const adset = await graph<{ id: string }>(`/${act}/adsets`, token, { form: adsetForm });


    let videoId: string | undefined;
    let objectStorySpec: Record<string, unknown>;

    if (input.video_url) {
      videoId = await uploadAdVideo(act, token, input.video_url, `${input.name} — Video`);
      await waitForVideoReady(videoId, token);
      const thumbnail = input.video_thumbnail_url ?? (await getVideoThumbnail(videoId, token));
      if (!thumbnail) {
        throw new ToolError("No thumbnail available for the uploaded video. Pass video_thumbnail_url explicitly.");
      }
      objectStorySpec = {
        page_id: input.page_id,
        video_data: {
          video_id: videoId,
          image_url: thumbnail,
          message: input.primary_text,
          title: input.headline,
          call_to_action: { type: input.call_to_action, value: { link: input.link_url } },
        },
      };
    } else {
      objectStorySpec = {
        page_id: input.page_id,
        link_data: {
          link: input.link_url,
          message: input.primary_text,
          name: input.headline,
          picture: input.image_url,
          call_to_action: { type: input.call_to_action, value: { link: input.link_url } },
        },
      };
    }

    const creative = await graph<{ id: string }>(`/${act}/adcreatives`, token, {
      form: {
        name: `${input.name} — Creative`,
        object_story_spec: JSON.stringify(objectStorySpec),
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
      creative_type: input.video_url ? "video" : "image",
      ...(videoId ? { video_id: videoId } : {}),
      ad_id: ad.id,
      daily_budget_usd: input.daily_budget_usd,
      launch_instructions:
        "Owner approval required. To go live, call meta_ads_manage with the campaign_id, ad set id and ad id set to ACTIVE and confirm: 'I APPROVE SPEND'.",
    };
    return { ...text(payload), structuredContent: payload };
  },
});
