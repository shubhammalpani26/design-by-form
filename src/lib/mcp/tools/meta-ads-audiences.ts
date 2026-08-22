import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { adsToken, graph, normalizeActId, text } from "./meta-ads-api";

/**
 * Retargeting plumbing: website custom audiences built off the Nyzora pixel, plus
 * interest lookup so ad sets can target real Meta interest ids instead of guesses.
 *
 * Nothing here can spend money — audiences and interest searches are inert until an
 * ad set references them.
 */

const EVENT_AUDIENCES = {
  customizers: {
    event: "CustomizeProduct",
    days: 30,
    label: "Customized a preview (30d)",
  },
  checkout_starters: {
    event: "InitiateCheckout",
    days: 30,
    label: "Started checkout (30d)",
  },
  viewers: {
    event: "ViewContent",
    days: 30,
    label: "Viewed a product (30d)",
  },
  purchasers: {
    event: "Purchase",
    days: 180,
    label: "Purchased (180d) — use as an exclusion",
  },
} as const;

type AudienceKey = keyof typeof EVENT_AUDIENCES;

export default defineTool({
  name: "meta_ads_audiences",
  title: "List, create and look up Meta audiences",
  description:
    "Manages retargeting inputs. action 'list' returns existing custom audiences on the ad account. action 'create' builds a website custom audience from a Nyzora pixel event (customizers, checkout_starters, viewers, purchasers) — use 'customizers' for retargeting and 'purchasers' as an exclusion. action 'search_interests' looks up Meta detailed-targeting interest ids by keyword (e.g. 'pet loss', 'dog memorial') so ad sets target real ids. Creates no spend of any kind.",
  inputSchema: {
    action: z.enum(["list", "create", "search_interests"]),
    ad_account_id: z.string().optional().describe("Ad account id (act_... or numeric). Required for list and create."),
    pixel_id: z.string().optional().describe("Meta pixel id. Required for action 'create'."),
    audience: z
      .enum(["customizers", "checkout_starters", "viewers", "purchasers"])
      .optional()
      .describe("Which pixel-event audience to create."),
    query: z.string().min(2).max(80).optional().describe("Keyword for action 'search_interests'."),
    limit: z.number().int().min(1).max(50).default(25),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    const token = await adsToken(ctx);

    if (input.action === "search_interests") {
      if (!input.query) throw new ToolError("query is required for action 'search_interests'.");
      const res = await graph<{ data?: Array<Record<string, unknown>> }>(
        `/search?type=adinterest&q=${encodeURIComponent(input.query)}&limit=${input.limit}`,
        token,
      );
      const payload = {
        query: input.query,
        interests: (res.data ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          audience_size: i.audience_size_lower_bound ?? i.audience_size,
          path: i.path,
        })),
      };
      return { ...text(payload), structuredContent: payload };
    }

    if (!input.ad_account_id) throw new ToolError("ad_account_id is required for this action.");
    const act = normalizeActId(input.ad_account_id);

    if (input.action === "list") {
      const res = await graph<{ data?: Array<Record<string, unknown>> }>(
        `/${act}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,delivery_status,operation_status&limit=${input.limit}`,
        token,
      );
      const payload = { ad_account_id: act, audiences: res.data ?? [] };
      return { ...text(payload), structuredContent: payload };
    }

    if (!input.audience) throw new ToolError("audience is required for action 'create'.");
    if (!input.pixel_id) throw new ToolError("pixel_id is required for action 'create'.");

    const spec = EVENT_AUDIENCES[input.audience as AudienceKey];
    const rule = {
      inclusions: {
        operator: "or",
        rules: [
          {
            event_sources: [{ type: "pixel", id: input.pixel_id }],
            retention_seconds: spec.days * 86_400,
            filter: {
              operator: "and",
              filters: [{ field: "event", operator: "eq", value: spec.event }],
            },
          },
        ],
      },
    };

    const created = await graph<{ id: string }>(`/${act}/customaudiences`, token, {
      form: {
        name: `Nyzora — ${spec.label}`,
        subtype: "WEBSITE",
        description: `Auto-built from pixel event ${spec.event} over ${spec.days} days.`,
        rule: JSON.stringify(rule),
        prefill: "1",
      },
    });

    const payload = {
      audience_id: created.id,
      name: `Nyzora — ${spec.label}`,
      pixel_event: spec.event,
      retention_days: spec.days,
      note:
        input.audience === "purchasers"
          ? "Pass this id as excluded_custom_audience_ids on prospecting and retargeting ad sets."
          : "Pass this id as custom_audience_ids on the retargeting ad set. It needs ~1,000 people before it can deliver.",
    };
    return { ...text(payload), structuredContent: payload };
  },
});
