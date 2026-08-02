import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search catalog products",
  description:
    "Search Nyzora's published catalog of creator-designed furniture and objects by keyword and/or category.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Keyword to match against product name."),
    category: z.string().trim().max(80).optional().describe("Category filter, e.g. Chair, Lighting, Objects."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("designer_products")
      .select("id, name, slug, category, description, designer_price, image_url, manufacturing_method, production_region, total_sales")
      .eq("status", "approved")
      .order("total_sales", { ascending: false })
      .limit(limit ?? 20);
    if (query) q = q.ilike("name", `%${query}%`);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
