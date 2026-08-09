import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import getProductTool from "./tools/get-product";
import listMyDesignsTool from "./tools/list-my-designs";
import getMyCreditsTool from "./tools/get-my-credits";
import metaMeTool from "./tools/meta-me";
import metaIgPostTool from "./tools/meta-ig-post";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nyzora",
  title: "Nyzora",
  version: "0.2.0",
  instructions:
    "Tools for Nyzora, an AI design-to-manufacturing marketplace. Use `search_products` and `get_product` to explore the published catalog, `list_my_designs` to check the signed-in creator's submissions and review status, and `get_my_credits` for their remaining AI design credits. Use `meta_me` to inspect the connected Meta/Instagram account, and `meta_ig_post` to publish an image post to Instagram.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProductsTool, getProductTool, listMyDesignsTool, getMyCreditsTool, metaMeTool, metaIgPostTool],
});
