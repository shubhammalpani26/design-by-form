import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAppEmail } from "./appEmail.ts";

interface AlertInput {
  orderId?: string | null;
  groupId?: string | null;
  customerEmail?: string | null;
  pieces?: number | null;
  amountUsd?: number | null;
  /** Where it broke, e.g. "partner order" or "3D model". */
  stage?: string;
  error: string;
}

/**
 * A paid order that never reaches the print partner is invisible to the buyer,
 * so every failure has to reach us: an in-dashboard notification for each admin
 * plus one email. Never throws — alerting must not mask the original failure.
 */
export async function alertFulfillmentFailure(
  admin: SupabaseClient,
  input: AlertInput,
): Promise<void> {
  const orderId = input.orderId ?? input.groupId ?? "unknown";
  const short = String(orderId).slice(0, 8);
  const message = input.error.slice(0, 500);

  try {
    const { data: admins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins?.length) {
      const { error: notifyErr } = await admin.from("notifications").insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          title: `Fulfillment failed — order ${short}`,
          message: `${input.stage ?? "Fulfillment"}: ${message}`,
          type: "fulfillment_failed",
          link: "/admin?tab=orders",
          metadata: {
            order_id: input.orderId ?? null,
            group_id: input.groupId ?? null,
            stage: input.stage ?? "fulfillment",
          },
        })),
      );
      if (notifyErr) console.error("fulfillment alert: notification insert error", notifyErr);
    }
  } catch (e) {
    console.error("fulfillment alert: notification insert failed", e);
  }

  try {
    // The template pins the internal recipient; this address is only a fallback.
    await sendAppEmail("fulfillment-failed", "contact@nyzora.ai", {
      idempotencyKey: `fulfillment-failed-${orderId}-${message.slice(0, 60)}`,
      templateData: {
        orderId: input.orderId ?? input.groupId ?? null,
        groupId: input.groupId ?? null,
        customerEmail: input.customerEmail ?? null,
        pieces: input.pieces ?? null,
        amountUsd: input.amountUsd ?? null,
        stage: input.stage ?? "fulfillment",
        error: message,
      },
    });
  } catch (e) {
    console.error("fulfillment alert: email failed", e);
  }
}
