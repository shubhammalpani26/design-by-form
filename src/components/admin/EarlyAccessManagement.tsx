import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EarlyAccessSignup {
  id: string;
  email: string | null;
  whatsapp: string | null;
  category: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  linen: "Linen & Soft Furnishings",
  jewelry: "Jewelry",
  "decor-lighting": "Decor & Lighting",
  accessories: "Accessories",
};

export const EarlyAccessManagement = () => {
  const [signups, setSignups] = useState<EarlyAccessSignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    try {
      const { data, error } = await supabase
        .from("early_access_signups" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSignups((data as any) || []);
    } catch (error) {
      console.error("Error fetching early access signups:", error);
    } finally {
      setLoading(false);
    }
  };

  const categoryCounts = signups.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{categoryCounts[key] || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Signups ({signups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <p className="text-muted-foreground text-sm">No early access signups yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Category</th>
                    <th className="pb-2 font-medium text-muted-foreground">Email</th>
                    <th className="pb-2 font-medium text-muted-foreground">WhatsApp</th>
                    <th className="pb-2 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((signup) => (
                    <tr key={signup.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[signup.category] || signup.category}
                        </Badge>
                      </td>
                      <td className="py-3 text-foreground">{signup.email || "—"}</td>
                      <td className="py-3 text-foreground">{signup.whatsapp || "—"}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
