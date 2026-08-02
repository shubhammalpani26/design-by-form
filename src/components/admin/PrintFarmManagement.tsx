import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Truck, Factory } from "lucide-react";

interface Fulfillment {
  id: string;
  order_id: string | null;
  product_id: string | null;
  slant_order_id: string | null;
  order_number: string | null;
  quantity: number;
  status: string;
  tracking_numbers: unknown;
  error: string | null;
  last_synced_at: string | null;
  created_at: string;
}

interface QuotableProduct {
  id: string;
  name: string;
  print_file_url: string | null;
  model_url: string | null;
  slant3d_price_usd: number | null;
  slant3d_quote_error: string | null;
  base_price: number | null;
}

/** Nyzora margin applied on top of the partner's landed print cost. */
const US_MARKUP = 1.25;

const statusTone: Record<string, string> = {
  shipped: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  needs_file: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

export function PrintFarmManagement() {
  const [jobs, setJobs] = useState<Fulfillment[]>([]);
  const [products, setProducts] = useState<QuotableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [jobsRes, productsRes] = await Promise.all([
      supabase
        .from("slant3d_fulfillments")
        .select(
          "id, order_id, product_id, slant_order_id, order_number, quantity, status, tracking_numbers, error, last_synced_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("designer_products")
        .select(
          "id, name, print_file_url, model_url, slant3d_price_usd, slant3d_quote_error, base_price",
        )
        .eq("manufacturing_method", "fdm_us")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (jobsRes.error) console.error(jobsRes.error);
    if (productsRes.error) console.error(productsRes.error);
    setJobs((jobsRes.data as Fulfillment[]) ?? []);
    setProducts((productsRes.data as QuotableProduct[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncTracking = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("slant3d-tracking-sync", {
        body: {},
      });
      if (error) throw error;
      toast({ title: "Tracking synced", description: `${data?.synced ?? 0} job(s) refreshed.` });
      await load();
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getQuote = async (product: QuotableProduct) => {
    setQuoting(product.id);
    try {
      const { data, error } = await supabase.functions.invoke("slant3d-quote", {
        body: {
          product_id: product.id,
          file_url: fileUrls[product.id]?.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "MBP updated",
        description: `${product.name}: $${Number(data.mbp_usd).toFixed(2)}/unit (≈ ₹${Number(
          data.mbp_inr,
        ).toLocaleString("en-IN")}) — print $${Number(data.print_usd ?? 0).toFixed(
          2,
        )} + shipping $${Number(data.shipping_usd ?? 0).toFixed(2)} + 25% margin${
          data.shipping_estimated ? "" : " (shipping estimate unavailable)"
        }`,
      });
      await load();
    } catch (e) {
      toast({
        title: "Quote failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setQuoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base font-medium tracking-tight">
            <Truck className="h-4 w-4" /> US print jobs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={syncTracking} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Sync tracking
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No US print jobs yet. Paid orders with US-made pieces route here automatically.
            </p>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {jobs.map((job) => {
                const tracking = Array.isArray(job.tracking_numbers)
                  ? (job.tracking_numbers as unknown[])
                  : [];
                return (
                  <div
                    key={job.id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {job.order_number ?? job.id.slice(0, 8)}
                        <span className="ml-2 text-muted-foreground">×{job.quantity}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.slant_order_id
                          ? `Print job ${job.slant_order_id}`
                          : "Not submitted"}
                        {tracking.length > 0 && ` · ${tracking.join(", ")}`}
                      </p>
                      {job.error && (
                        <p className="mt-1 line-clamp-2 text-xs text-destructive">{job.error}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={statusTone[job.status] ?? ""}>
                      {job.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium tracking-tight">
            <Factory className="h-4 w-4" /> US-made catalogue — MBP quoting
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            MBP = print cost + average US shipping + 25% Nyzora margin. Customers see free
            shipping at checkout.
          </p>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No products are set to US manufacturing yet.
            </p>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {products.map((product) => (
                <div key={product.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.slant3d_price_usd != null
                          ? `MBP $${(Number(product.slant3d_price_usd) * US_MARKUP).toFixed(
                              2,
                            )}/unit${
                              product.base_price
                                ? ` · ₹${Number(product.base_price).toLocaleString("en-IN")}`
                                : ""
                            }`
                          : "Not quoted"}
                      </p>
                      {product.slant3d_quote_error && (
                        <p className="mt-1 line-clamp-2 text-xs text-destructive">
                          {product.slant3d_quote_error}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getQuote(product)}
                      disabled={quoting === product.id}
                    >
                      {quoting === product.id && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      Get quote
                    </Button>
                  </div>
                  <Input
                    value={
                      fileUrls[product.id] ?? product.print_file_url ?? product.model_url ?? ""
                    }
                    onChange={(e) =>
                      setFileUrls((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    placeholder="https://…/model.stl"
                    className="h-9 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}