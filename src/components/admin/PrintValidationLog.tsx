import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ValidationEvent {
  id: string;
  preview_id: string | null;
  sku_slug: string | null;
  size_key: string | null;
  stage: string;
  passed: boolean;
  score: number | null;
  metrics: Record<string, unknown> | null;
  blockers: string[] | null;
  warnings: string[] | null;
  repaired: boolean;
  repair_summary: Record<string, unknown> | null;
  model_task_id: string | null;
  model_url: string | null;
  print_file_url: string | null;
  engineering: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

const STAGE_LABEL: Record<string, string> = {
  geometry: "Geometry check",
  repair: "Auto-repair",
  slice: "Partner slice",
};

/**
 * Manufacturing validation log: every geometry check, auto-repair and partner
 * slice attempt, with the Meshy task, STL and engineering inputs behind it.
 */
const PrintValidationLog = () => {
  const [onlyFailures, setOnlyFailures] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["print-validation-events", onlyFailures],
    queryFn: async (): Promise<ValidationEvent[]> => {
      let q = supabase
        .from("print_validation_events")
        .select(
          "id, preview_id, sku_slug, size_key, stage, passed, score, metrics, blockers, warnings, repaired, repair_summary, model_task_id, model_url, print_file_url, engineering, error, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (onlyFailures) q = q.eq("passed", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ValidationEvent[];
    },
    refetchInterval: 60000,
  });

  const events = data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Print validation log</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOnlyFailures((v) => !v)}>
          {onlyFailures ? "Showing failures" : "Showing all"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : events.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No {onlyFailures ? "failures" : "events"} recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((e) => {
              const open = expanded === e.id;
              return (
                <div key={e.id} className="py-3">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setExpanded(open ? null : e.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={e.passed ? "secondary" : "destructive"}>
                          {e.passed ? "Pass" : "Fail"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {STAGE_LABEL[e.stage] ?? e.stage}
                        </span>
                        {e.repaired && <Badge variant="outline">Repaired</Badge>}
                        {typeof e.score === "number" && (
                          <span className="text-xs text-muted-foreground">{e.score}/100</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {e.sku_slug ?? "—"} · {e.size_key ?? "—"} ·{" "}
                        {new Date(e.created_at).toLocaleString()}
                      </p>
                      {e.error && (
                        <p className="mt-1 line-clamp-2 text-xs text-destructive">{e.error}</p>
                      )}
                    </div>
                    {open ? (
                      <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {open && (
                    <div className="mt-3 space-y-3 text-xs">
                      {!!e.blockers?.length && (
                        <div>
                          <p className="font-medium">Blockers</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {e.blockers.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!!e.warnings?.length && (
                        <div>
                          <p className="font-medium">Warnings</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {e.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {e.print_file_url && (
                          <a
                            className="underline"
                            href={e.print_file_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Print file (STL)
                          </a>
                        )}
                        {e.model_url && (
                          <a className="underline" href={e.model_url} target="_blank" rel="noreferrer">
                            Source mesh (GLB)
                          </a>
                        )}
                        {e.model_task_id && (
                          <span className="text-muted-foreground">Mesh task {e.model_task_id}</span>
                        )}
                        {e.preview_id && (
                          <span className="text-muted-foreground">
                            Preview {e.preview_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {e.repair_summary && (
                        <div>
                          <p className="font-medium">Repair</p>
                          <pre className="mt-1 overflow-x-auto bg-muted p-2 text-[11px]">
                            {JSON.stringify(e.repair_summary, null, 2)}
                          </pre>
                        </div>
                      )}
                      {e.metrics && (
                        <div>
                          <p className="font-medium">Measured geometry</p>
                          <pre className="mt-1 max-h-64 overflow-auto bg-muted p-2 text-[11px]">
                            {JSON.stringify(e.metrics, null, 2)}
                          </pre>
                        </div>
                      )}
                      {e.engineering && (
                        <div>
                          <p className="font-medium">Engineering check input</p>
                          <pre className="mt-1 max-h-64 overflow-auto bg-muted p-2 text-[11px]">
                            {JSON.stringify(e.engineering, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrintValidationLog;
