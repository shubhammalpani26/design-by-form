import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_designs",
  title: "List my designs",
  description:
    "List the signed-in creator's own submitted designs with their review status (pending, approved, rejected).",
  inputSchema: {
    status: z.enum(["pending", "approved", "rejected"]).optional().describe("Filter by review status."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: profile, error: profileError } = await supabase
      .from("designer_profiles")
      .select("id, name, status")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (profileError) throw new ToolError(profileError.message);
    if (!profile) {
      return {
        content: [{ type: "text", text: "You don't have a creator profile on Nyzora yet." }],
        structuredContent: { designs: [] },
      };
    }

    let q = supabase
      .from("designer_products")
      .select("id, name, slug, category, status, rejection_reason, designer_price, base_price, image_url, total_sales, created_at")
      .eq("designer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50);
    if (input.status) q = q.eq("status", input.status);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { creator: profile.name, designs: data ?? [] },
    };
  },
});
