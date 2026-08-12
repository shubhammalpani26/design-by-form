import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd } from "@/components/JsonLd";
import { ArrowLeft, Wand2, ShieldCheck, Truck, Factory } from "lucide-react";
import { getSku, MAX_ENVELOPE_MM, ORIGINALS_SKUS } from "@/data/originalsSkus";
import { PhotoToPieceFlow } from "@/components/originals/PhotoToPieceFlow";

const OriginalDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const sku = getSku(slug);
  const [values, setValues] = useState<Record<string, string>>({});
  const [remix, setRemix] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);

  const prompt = useMemo(() => {
    if (!sku) return "";
    const base = sku.promptTemplate(values);
    return remix.trim() ? `${base} Additional direction: ${remix.trim()}` : base;
  }, [sku, values, remix]);

  if (!sku) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-light">That Original doesn't exist.</h1>
          <Button className="mt-6 rounded-none" onClick={() => navigate("/")}>Back to the collection</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const startCustomizing = () => {
    const params = new URLSearchParams({ prompt, category: "Objects", sku: sku.slug });
    navigate(`/studio?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${sku.name} — Personalized Piece | Nyzora Originals`}
        description={`${sku.tagline} Made to order in the USA and shipped in 3–5 days. $${sku.price}.`}
        type="product"
      />
      <JsonLd
        id={`original-${sku.slug}`}
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: sku.name,
          description: sku.description,
          brand: { "@type": "Brand", name: "Nyzora Originals" },
          offers: {
            "@type": "Offer",
            price: sku.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
          <ArrowLeft className="mr-2 h-3 w-3" /> Collection
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="border border-border bg-muted/20">
          <img
            src={sku.image}
            alt={`${sku.name} personalized piece`}
            width={1024}
            height={1280}
            className="w-full object-contain"
          />
        </div>

        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Nyzora Originals</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-light tracking-tight">{sku.name}</h1>
          <p className="mt-3 text-lg tabular-nums">
            {sku.sizes.length > 1 ? `From $${Math.min(...sku.sizes.map((s) => s.price))}` : `$${sku.price}`}
            <span className="ml-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">Free US shipping</span>
          </p>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{sku.description}</p>

          {sku.photo && (
            <div className="mt-8">
              <PhotoToPieceFlow sku={sku} />
            </div>
          )}

          {sku.photo && !showTemplate && (
            <button
              type="button"
              onClick={() => setShowTemplate(true)}
              className="mt-4 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              No photo handy? Start from a template instead
            </button>
          )}

          <div className={`mt-8 space-y-4 border-t border-border pt-8 ${sku.photo && !showTemplate ? "hidden" : ""}`}>
            {sku.fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key} className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                  {f.label}
                </Label>
                {f.options ? (
                  <select
                    id={f.key}
                    className="mt-2 h-10 w-full rounded-none border border-input bg-background px-3 text-sm"
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    <option value="">{f.placeholder}</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={f.key}
                    className="mt-2 rounded-none"
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div>
              <Label htmlFor="remix" className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                Remix with AI (optional)
              </Label>
              <Textarea
                id="remix"
                className="mt-2 rounded-none"
                rows={3}
                placeholder="Make the base thicker and the finish charcoal."
                value={remix}
                onChange={(e) => setRemix(e.target.value)}
              />
            </div>
            <Button size="lg" className="w-full rounded-none" onClick={startCustomizing}>
              <Wand2 className="mr-2 h-4 w-4" /> Preview my version
            </Button>
            <p className="text-xs text-muted-foreground">
              You'll see your piece before anything is made or charged.
            </p>
          </div>

          <dl className="mt-10 border-t border-border divide-y divide-border text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Finish</dt>
              <dd>{sku.finish}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Approx. size</dt>
              <dd>{sku.dimensions}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Build envelope</dt>
              <dd>Single part, max {MAX_ENVELOPE_MM} mm cube</dd>
            </div>
          </dl>

          <div className="mt-8 grid grid-cols-3 gap-4 text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            <div className="flex flex-col gap-2"><Factory className="h-4 w-4" /> Made in the USA</div>
            <div className="flex flex-col gap-2"><Truck className="h-4 w-4" /> Ships in 3–5 days</div>
            <div className="flex flex-col gap-2"><ShieldCheck className="h-4 w-4" /> 2-year warranty</div>
          </div>
        </div>
      </div>

      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-14">
          <h2 className="text-xl font-light tracking-tight mb-6">More Originals</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {ORIGINALS_SKUS.filter((s) => s.slug !== sku.slug).map((s) => (
              <Link key={s.slug} to={`/originals/${s.slug}`} className="group">
                <div className="aspect-[4/5] overflow-hidden bg-muted/30 border border-border">
                  <img src={s.image} alt={s.name} loading="lazy" width={1024} height={1280}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <p className="mt-3 text-sm font-light">{s.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">${s.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OriginalDetail;
