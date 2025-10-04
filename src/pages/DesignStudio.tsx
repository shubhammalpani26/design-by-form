import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const DesignStudio = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold text-primary">AI Design Studio - Beta</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Create Furniture with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform your ideas into manufacturable furniture designs in minutes. 
              No design experience required.
            </p>
          </div>
        </section>

        {/* Design Interface */}
        <section className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Input Side */}
            <div className="space-y-6">
              <Card className="border-primary/20 shadow-medium">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Describe Your Design</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tell us what you want to create. Be as detailed or simple as you like.
                    </p>
                  </div>

                  <Textarea
                    placeholder="Example: A modern minimalist chair with curved wooden legs and a soft fabric seat. Scandinavian style with warm oak finish..."
                    className="min-h-[200px] text-base"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <Button variant="hero" className="flex-1 group">
                      Generate Design
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Button>
                    <Button variant="outline">
                      Upload Sketch
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-accent border-border">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3 text-foreground">💡 Tips for better results</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Mention specific materials (wood, metal, fabric)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Describe the style (modern, vintage, minimalist)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Include dimensions or size preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Reference existing furniture you like</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Preview Side */}
            <div className="space-y-6">
              <Card className="border-border shadow-soft">
                <CardContent className="p-6">
                  <div className="aspect-square bg-accent rounded-xl flex items-center justify-center mb-4">
                    <div className="text-center space-y-3 p-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground">
                        Your AI-generated design will appear here
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">Ready to generate</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Your Commission:</span>
                      <span className="font-medium text-primary">10-15% per sale</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Est. Generation:</span>
                      <span className="font-medium">~30 seconds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Process Info */}
              <Card className="bg-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    What happens next?
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">1.</span>
                      <span>AI generates multiple design variations</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">2.</span>
                      <span>You refine and approve your favorite</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">3.</span>
                      <span>We validate manufacturability</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">4.</span>
                      <span>Your design goes live on Forma marketplace</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">5.</span>
                      <span>Earn commissions on every sale forever</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Example Prompts */}
        <section className="container py-12 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center text-foreground">
              Need Inspiration? Try These Prompts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "A mid-century modern coffee table with tapered legs and walnut finish",
                "Contemporary bookshelf with asymmetric compartments and metal frame",
                "Ergonomic office chair with mesh back and adjustable lumbar support",
                "Rustic farmhouse dining table made from reclaimed wood",
                "Minimalist floating desk with hidden cable management",
                "Scandinavian-style armchair with curved wooden frame",
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-accent transition-all group"
                >
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    "{example}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignStudio;
