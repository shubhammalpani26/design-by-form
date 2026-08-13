import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import getProductTool from "./tools/get-product";
import listMyDesignsTool from "./tools/list-my-designs";
import getMyCreditsTool from "./tools/get-my-credits";
import metaMeTool from "./tools/meta-me";
import metaIgPostTool from "./tools/meta-ig-post";
import metaAdsAccountsTool from "./tools/meta-ads-accounts";
import metaAdsInsightsTool from "./tools/meta-ads-insights";
import metaAdsManageTool from "./tools/meta-ads-manage";
import metaAdsCreateCampaignTool from "./tools/meta-ads-create";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nyzora",
  title: "Nyzora",
  version: "0.3.0",
  instructions:
    "Tools for Nyzora, an AI design-to-manufacturing marketplace. Use `search_products` and `get_product` to explore the published catalog, `list_my_designs` to check the signed-in creator's submissions and review status, and `get_my_credits` for their remaining AI design credits. Use `meta_me` to inspect the connected Meta/Instagram account, and `meta_ig_post` to publish an image post to Instagram. For paid media use `meta_ads_accounts` (ad accounts, campaigns, ad sets, ads), `meta_ads_insights` (spend, CTR, CPM, ROAS), `meta_ads_create_campaign` (drafts a full campaign that is always created PAUSED) and `meta_ads_manage` (pause/resume/rebudget). Anything that can start or increase ad spend requires the owner\u2019s explicit confirm string \u2014 never launch an ad without asking the owner first.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProductsTool, getProductTool, listMyDesignsTool, getMyCreditsTool, metaMeTool, metaIgPostTool, metaAdsAccountsTool, metaAdsInsightsTool, metaAdsCreateCampaignTool, metaAdsManageTool],
});
