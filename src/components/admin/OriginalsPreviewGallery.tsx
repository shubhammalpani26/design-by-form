import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Images, Trash2, Box } from "lucide-react";
import { ModelViewer3D } from "@/components/ModelViewer3D";

interface PreviewPersonalization {
  colorLabel?: string;
  heading?: string;
  footnote?: string;
  tweak?: string;
  [key: string]: unknown;
}

interface PreviewRow {
  id: string;
  sku_slug: string;
  source_image_url: string | null;
  preview_image_url: string | null;
  personalization: PreviewPersonalization | null;
  user_id: string | null;
  ip_hash: string | null;
  print_file_url: string | null;
  model_status: string | null;
  created_at: string;
}

interface GalleryItem extends PreviewRow {
  signedSourceUrl: string | null;
}

const PAGE_SIZE = 24;

/**
 * Admin-only review of real customer uploads next to the render each produced.
 * Source photos live in the private originals-uploads bucket; admins read them
 * through short-lived signed URLs (RLS: admins can view originals uploads).
 */
export function OriginalsPreviewGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modelOpen, setModelOpen] = useState<string | null>(null);

  /**
   * Removes a preview and its files everywhere: the uploaded photo, the
   * render, and the database rows. Server-side function enforces admin-only.
   */
  const deletePreview = async (item: GalleryItem) => {
    const label = item.personalization?.heading || item.sku_slug;
    if (!window.confirm(`Delete this preview (${label})? The customer's photo and its render are removed permanently.`)) return;
    setDeletingId(item.id);
    setError(null);
    const { error: dError } = await supabase.rpc("admin_delete_originals_preview", {
      p_preview_id: item.id,
    });
    if (dError) {
      setError(`Couldn't delete: ${dError.message}`);
    } else {
      setItems((prev) => prev.filter((p) => p.id !== item.id));
    }
    setDeletingId(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await supabase
      .from("originals_previews")
      .select("id, sku_slug, source_image_url, preview_image_url, personalization, user_id, ip_hash, print_file_url, model_status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (qError) {
      setError(qError.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as PreviewRow[];

    // Sign each private source photo (1 hour expiry, batch in parallel).
    const signed = await Promise.all(
      rows.map(async (row) => {
        if (!row.source_image_url) return { ...row, signedSourceUrl: null };
        const { data: s } = await supabase.storage
          .from("originals-uploads")
          .createSignedUrl(row.source_image_url, 3600);
        return { ...row, signedSourceUrl: s?.signedUrl ?? null };
      }),
    );
    setItems(signed);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = showAll ? items : items.slice(0, PAGE_SIZE);
  const visitorKey = (i: GalleryItem) => i.user_id ?? i.ip_hash ?? "unknown";
  const distinctVisitors = new Set(items.map(visitorKey)).size;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Images className="h-4 w-4" /> Customer photo review
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Every real upload next to the render it produced — {items.length} previews from{" "}
              {distinctVisitors} visitor{distinctVisitors === 1 ? "" : "s"}. Private; only admins
              can see this.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">Couldn't load previews: {error}</p>}
        {!error && !loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No customer previews yet.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((item) => (
            <div key={item.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs">
                  {item.sku_slug}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Delete this preview, its photo and its render"
                    disabled={deletingId === item.id}
                    onClick={() => deletePreview(item)}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Their photo
                  </p>
                  {item.signedSourceUrl ? (
                    <a href={item.signedSourceUrl} target="_blank" rel="noreferrer">
                      <img
                        src={item.signedSourceUrl}
                        alt="Customer upload"
                        className="aspect-square w-full rounded object-contain bg-muted"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Render
                  </p>
                  {item.preview_image_url ? (
                    <a href={item.preview_image_url} target="_blank" rel="noreferrer">
                      <img
                        src={item.preview_image_url}
                        alt="Generated render"
                        className="aspect-square w-full rounded object-contain bg-muted"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No render
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span>Visitor {(visitorKey(item) ?? "").slice(0, 8)} · {item.user_id ? "signed in" : "guest"}</span>
                {item.personalization?.colorLabel && (
                  <span className="font-medium text-foreground">Colour: {item.personalization.colorLabel}</span>
                )}
                {(item.personalization?.heading || item.personalization?.footnote) && (
                  <span>
                    Lettering: {item.personalization.heading || "—"}
                    {item.personalization.footnote ? ` · ${item.personalization.footnote}` : ""}
                  </span>
                )}
              </div>
              {item.print_file_url ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModelOpen(modelOpen === item.id ? null : item.id)}>
                      <Box className="mr-1 h-3.5 w-3.5" /> {modelOpen === item.id ? "Hide 3D model" : "View 3D model"}
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <a href={item.print_file_url} download>Download STL</a>
                    </Button>
                  </div>
                  {modelOpen === item.id && (
                    <div className="h-72 w-full overflow-hidden rounded border">
                      <ModelViewer3D modelUrl={item.print_file_url} productName={item.personalization?.heading || item.sku_slug} />
                    </div>
                  )}
                </div>
              ) : item.model_status ? (
                <p className="text-[10px] text-muted-foreground">3D model: {item.model_status}</p>
              ) : null}
            </div>
          ))}
        </div>
        {!showAll && items.length > PAGE_SIZE && (
          <div className="pt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
              Show all {items.length}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
