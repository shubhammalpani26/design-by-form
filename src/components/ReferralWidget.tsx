import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, CheckCircle, Users, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  total: number;
  activated: number;
  creditsEarned: number;
}

export const ReferralWidget = ({ designerId, designerSlug }: { designerId: string; designerSlug: string | null }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralUrl = designerSlug
    ? `${window.location.origin}/?ref=${encodeURIComponent(designerSlug)}`
    : "";

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designerId]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("status, credits_awarded")
        .eq("referrer_designer_id", designerId);
      if (error) throw error;
      const total = data?.length || 0;
      const activated = data?.filter((r) => r.status === "activated").length || 0;
      const creditsEarned = (data || []).reduce((s, r) => s + (r.credits_awarded || 0), 0);
      setStats({ total, activated, creditsEarned });
    } catch (err) {
      console.error("[ReferralWidget] load failed", err);
      setStats({ total: 0, activated: 0, creditsEarned: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({ title: "Referral link copied!", description: "Share it with other creators." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = "Join me on Nyzora — design custom furniture with AI and earn from every sale ✨";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Nyzora", text, url: referralUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${referralUrl}`)}`, "_blank");
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Refer creators, earn credits
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Earn <strong>30 free credits</strong> every time a creator you invited gets their first design approved.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Invites" value={stats?.total ?? 0} icon={<Users className="h-4 w-4" />} />
            <Stat label="Activated" value={stats?.activated ?? 0} icon={<CheckCircle className="h-4 w-4" />} />
            <Stat label="Credits earned" value={stats?.creditsEarned ?? 0} icon={<Gift className="h-4 w-4" />} highlight />
          </div>
        )}

        {designerSlug ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-mono truncate flex-1">{referralUrl}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleCopy} variant="outline" className="rounded-full">
                {copied ? <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> : <Link2 className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button onClick={handleShare} className="rounded-full">
                Share now
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Your referral link will appear once your creator profile is approved.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) => (
  <div className={`p-3 rounded-md border ${highlight ? "bg-primary/10 border-primary/30" : "bg-background"}`}>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
      {icon}
      {label}
    </div>
    <div className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
  </div>
);