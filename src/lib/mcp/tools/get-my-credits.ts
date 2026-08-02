import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_credits",
  title: "Get my AI credit balance",
  description: "Return the signed-in user's remaining Nyzora AI design credits and recent credit activity.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: credits, error } = await supabase
      .from("user_credits")
      .select("balance, updated_at")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) throw new ToolError(error.message);

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("amount, type, description, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(10);

    const balance = credits?.balance ?? 0;
    return {
      content: [{ type: "text", text: `Credit balance: ${balance}` }],
      structuredContent: { balance, updated_at: credits?.updated_at ?? null, recent: transactions ?? [] },
    };
  },
});
