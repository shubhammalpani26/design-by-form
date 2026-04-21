import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Japan",
  "Indonesia",
  "Vietnam",
  "Thailand",
  "Mexico",
  "Brazil",
  "South Africa",
  "Other",
];

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
    <form onSubmit={handleSubmit} className="border border-border rounded-2xl p-6 md:p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
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
        <div>
          <label className={labelCls}>Workshop / Studio</label>
          <Input value={data.workshopName} onChange={(e) => update("workshopName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Primary Craft {required}</label>
          <Input
            value={data.craft}
            onChange={(e) => update("craft", e.target.value)}
            placeholder="e.g. Solid wood joinery, Hand-cast brass"
          />
        </div>
        <div>
          <label className={labelCls}>City {required}</label>
          <Input value={data.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Jaipur" />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <Select value={data.country} onValueChange={(v) => update("country", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Years Active</label>
          <Input value={data.yearsActive} onChange={(e) => update("yearsActive", e.target.value)} placeholder="e.g. 8" />
        </div>
        <div>
          <label className={labelCls}>Team Size</label>
          <Input value={data.teamSize} onChange={(e) => update("teamSize", e.target.value)} placeholder="e.g. 12 artisans" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Tell us about your workshop {required}</label>
          <Textarea
            value={data.facilityDetails}
            onChange={(e) => update("facilityDetails", e.target.value)}
            placeholder="Materials, machinery, finishing capabilities, monthly output, past pieces…"
            className="min-h-[100px]"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Portfolio / Reference Links</label>
          <Input
            value={data.portfolioUrl}
            onChange={(e) => update("portfolioUrl", e.target.value)}
            placeholder="Website, Instagram, Drive folder"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Anything else? (optional)</label>
          <Textarea
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="min-h-[60px]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-border/60">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
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