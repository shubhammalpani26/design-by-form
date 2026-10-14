import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload } from "lucide-react";

type Result = {
  stl_url: string;
  glb_url: string;
  size: { x: number; y: number; z: number };
  report: { watertight: boolean; volumeCm3: number; triangleCount: number; warnings: string[]; blockers: string[] } | null;
};

export function ImageTo3D() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sizeMm, setSizeMm] = useState(140);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-image-to-3d", { body });
    if (error) throw new Error((data as any)?.error || error.message);
    if ((data as any)?.error && !(data as any)?.status) throw new Error((data as any).error);
    return data as any;
  };

  const poll = (taskId: string) => {
    timer.current = window.setTimeout(async () => {
      try {
        setStatus(progress >= 99 ? "Making it printable…" : "Building 3D model…");
        const d = await call({ action: "poll", task_id: taskId, size_mm: sizeMm });
        if (d.status === "SUCCEEDED" && d.stl_url) {
          setResult(d);
          setBusy(false);
          setStatus("Done");
          setProgress(100);
        } else if (d.status === "FAILED" || d.status === "CANCELED") {
          throw new Error(d.error || "Model generation failed");
        } else {
          setProgress(d.progress ?? 0);
          poll(taskId);
        }
      } catch (e) {
        setBusy(false);
        setStatus("");
        toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
      }
    }, 5000);
  };

  const start = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setProgress(0);
    try {
      setStatus("Uploading image…");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `admin-image-to-3d/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      setStatus("Starting…");
      const d = await call({ action: "start", image_url: pub.publicUrl });
      poll(d.task_id);
    } catch (e) {
      setBusy(false);
      setStatus("");
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const r = result?.report;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Image to 3D</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload any image — get a downloadable, print-ready STL. Takes 2–5 minutes.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="i3d-file">Image</Label>
            <Input id="i3d-file" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
              onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            {preview && <img src={preview} alt="Uploaded" className="h-48 w-full rounded border border-border object-contain" />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="i3d-size">Longest side (mm)</Label>
            <Input id="i3d-size" type="number" min={20} max={2000} value={sizeMm} disabled={busy}
              onChange={(e) => setSizeMm(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Any size — not limited to the 220 mm pet-piece envelope.</p>
            <Button onClick={start} disabled={!file || busy} className="w-full">
              <Upload className="mr-2 h-4 w-4" /> {busy ? "Working…" : "Create 3D model"}
            </Button>
            {busy && (
              <div className="space-y-1">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">{status} {progress}%</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded border border-border p-4">
            <p className="text-sm">
              Size: {result.size.x.toFixed(0)} × {result.size.y.toFixed(0)} × {result.size.z.toFixed(0)} mm
              {r && <> · {r.volumeCm3.toFixed(1)} cm³ · {r.watertight ? "watertight" : "not watertight"}</>}
            </p>
            {r?.blockers?.length ? (
              <ul className="list-disc pl-5 text-sm text-destructive">{r.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            ) : (
              <p className="text-sm text-muted-foreground">No printability blockers found.</p>
            )}
            {r?.warnings?.length ? (
              <ul className="list-disc pl-5 text-xs text-muted-foreground">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild><a href={result.stl_url} download><Download className="mr-2 h-4 w-4" />Download STL</a></Button>
              <Button asChild variant="outline"><a href={result.glb_url} target="_blank" rel="noreferrer">GLB (viewing)</a></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
