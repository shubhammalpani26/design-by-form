import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  workshopName: "",
  craft: "",
  city: "",
  country: "India",
  yearsActive: "",
  teamSize: "",
  facilityDetails: "",
  portfolioUrl: "",
  notes: "",
};

export const MakerApplicationForm = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState(initialState);

  const update = (key: keyof typeof initialState, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.craft ||
      !data.city ||
      !data.facilityDetails
    ) {
      toast({
        title: "Missing information",
        description: "Please complete the required fields marked with *.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const message = [
        `New Maker Application`,
        ``,
        `Workshop / Studio: ${data.workshopName || "—"}`,
        `Primary Craft: ${data.craft}`,
        `Location: ${data.city}, ${data.country}`,
        `Phone: ${data.phone || "—"}`,
        `Years Active: ${data.yearsActive || "—"}`,
        `Team Size: ${data.teamSize || "—"}`,
        ``,
        `Facility & Capabilities:`,
        data.facilityDetails,
        ``,
        `Portfolio / Reference Links:`,
        data.portfolioUrl || "—",
        ``,
        `Additional Notes:`,
        data.notes || "—",
      ].join("\n");

      const { error } = await supabase.functions.invoke("submit-contact-form", {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          subject: `Maker Application — ${data.craft}`,
          message,
        },
      });
      if (error) throw error;

      setSubmitted(true);
      setData(initialState);
      toast({
        title: "Application received",
        description: "Our maker partnerships team will be in touch within a few days.",
      });
    } catch {
      toast({
        title: "Couldn't submit",
        description: "Something went wrong. Please try again or email contact@nyzora.ai.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="border border-border rounded-2xl p-10 md:p-14 text-center bg-background">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-6" strokeWidth={1.5} />
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-3">
          Thank you for applying
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
          We review every application personally. Our maker partnerships team will reach out within a few days to learn more about your craft.
        </p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setSubmitted(false)}
        >
          Submit another application
        </Button>
      </div>
    );
  }

  const labelCls = "text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-2 block font-medium";
  const required = <span className="text-primary/80 ml-0.5">*</span>;

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-2xl p-8 md:p-12 bg-background space-y-8">
      {/* About you */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-5">
          About You
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>First Name {required}</label>
            <Input value={data.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Last Name {required}</label>
            <Input value={data.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email {required}</label>
            <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Phone / WhatsApp</label>
            <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 ..." />
          </div>
        </div>
      </div>

      {/* Craft */}
      <div className="pt-2 border-t border-border/60">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-5 mt-6">
          Your Craft
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls}>Workshop / Studio Name</label>
            <Input value={data.workshopName} onChange={(e) => update("workshopName", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Primary Craft / Discipline {required}</label>
            <Input
              value={data.craft}
              onChange={(e) => update("craft", e.target.value)}
              placeholder="e.g. Solid wood joinery, Hand-cast brass, Upholstery"
            />
          </div>
          <div>
            <label className={labelCls}>Years Active</label>
            <Input value={data.yearsActive} onChange={(e) => update("yearsActive", e.target.value)} placeholder="e.g. 8" />
          </div>
          <div>
            <label className={labelCls}>Team Size</label>
            <Input value={data.teamSize} onChange={(e) => update("teamSize", e.target.value)} placeholder="e.g. 12 artisans" />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="pt-2 border-t border-border/60">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-5 mt-6">
          Location
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>City {required}</label>
            <Input value={data.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Jaipur" />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <Input value={data.country} onChange={(e) => update("country", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Facility */}
      <div className="pt-2 border-t border-border/60">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-5 mt-6">
          Facility & Capabilities
        </p>
        <div className="space-y-5">
          <div>
            <label className={labelCls}>
              Tell us about your workshop {required}
            </label>
            <Textarea
              value={data.facilityDetails}
              onChange={(e) => update("facilityDetails", e.target.value)}
              placeholder="Materials you work with, machinery, finishing capabilities, monthly output, types of pieces you've made…"
              className="min-h-[140px]"
            />
          </div>
          <div>
            <label className={labelCls}>Portfolio / Reference Links</label>
            <Textarea
              value={data.portfolioUrl}
              onChange={(e) => update("portfolioUrl", e.target.value)}
              placeholder="Website, Instagram, Drive folder — paste any links to past work"
              className="min-h-[80px]"
            />
          </div>
          <div>
            <label className={labelCls}>Anything else we should know?</label>
            <Textarea
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-sm">
          We review every application personally and reply within a few days.
        </p>
        <Button type="submit" className="rounded-full" disabled={submitting}>
          {submitting ? "Sending..." : "Submit Application"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default MakerApplicationForm;