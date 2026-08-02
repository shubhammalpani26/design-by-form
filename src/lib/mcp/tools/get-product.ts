import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Fetch full details for a single published Nyzora product by its slug or id.",
  inputSchema: {
    slug: z.string().trim().min(1).max(200).describe("Product slug (preferred) or product UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const columns =
      "id, name, slug, category, description, materials_description, designer_price, dimensions, weight, image_url, model_url, lead_time_days, manufacturing_method, production_region, total_sales, created_at";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const { data, error } = await supabase
      .from("designer_products")
      .select(columns)
      .eq("status", "approved")
      .eq(isUuid ? "id" : "slug", slug)
      .maybeSingle();

    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No published product found for "${slug}".`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { product: data },
    };
  },
});
