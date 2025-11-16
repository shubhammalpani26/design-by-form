import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, subject, message }: ContactEmailRequest = await req.json();

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: "Forma <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${firstName}!</h1>
        <p>We have received your message regarding: <strong>${subject}</strong></p>
        <p>We'll get back to you within 24 hours.</p>
        <br/>
        <p>Your message:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">
          ${message}
        </blockquote>
        <br/>
        <p>Best regards,<br>The Forma Team</p>
      `,
    });

    // Send notification to admin/support team
    const adminEmailResponse = await resend.emails.send({
      from: "Forma <onboarding@resend.dev>",
      to: ["support@forma.com"], // Replace with your actual support email
      subject: `New Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 15px;">
          ${message}
        </blockquote>
      `,
    });

    console.log("Emails sent successfully:", { userEmailResponse, adminEmailResponse });

    return new Response(
      JSON.stringify({ 
        success: true,
        userEmail: userEmailResponse,
        adminEmail: adminEmailResponse 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
