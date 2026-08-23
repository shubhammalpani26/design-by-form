import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendAppEmail } from "../_shared/appEmail.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const schema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { firstName, lastName, email, subject, message } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Save submission
    const { error: insertError } = await supabase
      .from("contact_submissions")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        subject,
        message,
      });

    if (insertError) throw insertError;

    // Find all admin user IDs
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: "New Contact Nyzora? Submission",
        message: `${firstName} ${lastName} (${email}) — ${subject}`,
        type: "contact_submission",
        link: "/admin?tab=contacts",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Email the enquiry to the internal inbox. Never fail the submission on this:
    // the row is already saved and visible in the admin panel.
    try {
      await sendAppEmail("contact-form-submission", "contact@nyzora.ai", {
        idempotencyKey: `contact-${email}-${subject}-${Date.now()}`,
        templateData: {
          name: `${firstName} ${lastName}`,
          email,
          subject,
          message,
          source: "contact form",
        },
      });
    } catch (e) {
      console.error("contact form: email notification failed", e);
    }


    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
