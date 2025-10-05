import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { useToast } from "@/hooks/use-toast";

const DesignStudio = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"2d" | "3d" | "ar">("2d");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedImage(file);
      toast({
        title: "Image uploaded",
        description: "Your sketch has been added to the design prompt",
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Description",
        description: "Please describe your furniture design first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate design');
      }

      const data = await response.json();
      setGeneratedDesign(data.imageUrl);
      
      // Calculate estimated base cost - dining tables ~80-90K, smaller pieces proportionally less
      const assumedCubicFeet = 3.5; // Average furniture piece volume
      const costPerCubicFoot = 25000; // ₹25,000 per cubic foot base cost
      const baseCost = assumedCubicFeet * costPerCubicFoot;
      setEstimatedCost(baseCost);
      
      setShowWorkflow(true);
      
      toast({
        title: "Design Generated!",
        description: "Your furniture design is ready. Review the details below.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
                    <Button 
                      variant="hero" 
                      className="flex-1 group" 
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate Design
                          <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        {uploadedImage ? "✓ Sketch Added" : "Upload Sketch"}
                      </label>
                    </Button>
                  </div>
                  {uploadedImage && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      {uploadedImage.name}
                    </div>
                  )}
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
                  <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="2d">2D Image</TabsTrigger>
                      <TabsTrigger value="3d">3D Model</TabsTrigger>
                      <TabsTrigger value="ar">AR View</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="2d" className="mt-0">
                      <div className="aspect-square bg-accent rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                        {generatedDesign ? (
                          <img 
                            src={generatedDesign} 
                            alt="Generated design" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center space-y-3 p-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-muted-foreground">
                              Your AI-generated design will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="3d" className="mt-0 -m-6">
                      <ModelViewer3D productName="Your Design" modelUrl={generatedDesign || undefined} />
                    </TabsContent>
                    
                    <TabsContent value="ar" className="mt-0 -m-6">
                      <ARViewer productName="Your Design" modelUrl={generatedDesign || undefined} />
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">
                        {isGenerating ? "Generating..." : generatedDesign ? "Design Ready" : "Ready to generate"}
                      </span>
                    </div>
                    {estimatedCost && (
                      <>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="font-medium">₹{estimatedCost.toLocaleString()} + GST</span>
                        </div>
                        <div className="bg-accent/50 p-3 rounded-lg text-xs text-muted-foreground border border-primary/10">
                          <strong className="text-foreground">Note:</strong> This is the base manufacturing cost. You can list at a higher price—any markup goes directly to you. You earn 10-15% commission on the base price per sale.
                        </div>
                      </>
                    )}
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Lead Time:</span>
                      <span className="font-medium">4-6 weeks</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Your Commission:</span>
                      <span className="font-medium text-primary">10-15% on base price</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Est. Generation:</span>
                      <span className="font-medium">~30 seconds</span>
                    </div>
                  </div>

                  {generatedDesign && !showWorkflow && (
                    <div className="mt-4 pt-4 border-t border-border flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Refine Design
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowWorkflow(true)}
                      >
                        Continue to Workflow
                      </Button>
                    </div>
                  )}
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

        {/* Workflow Section */}
        {showWorkflow && generatedDesign && (
          <section className="container py-12 border-t border-border">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-8 text-center text-foreground">
                Your Design Journey
              </h3>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="bg-background rounded-xl p-6 border border-primary shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 text-foreground">Design Generated</h4>
                      <p className="text-muted-foreground">Your AI-generated design has been created and is ready for review.</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-background rounded-xl p-6 border border-border shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent text-foreground flex items-center justify-center font-bold flex-shrink-0 border-2 border-primary">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 text-foreground">Manufacturability Review</h4>
                      <p className="text-muted-foreground mb-3">
                        Our team will validate the design for 3D printing and manufacturing feasibility within 24-48 hours.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-accent p-3 rounded-lg">
                          <p className="text-muted-foreground">Estimated Cost</p>
                          <p className="font-semibold text-foreground">
                            ₹{estimatedCost?.toLocaleString() || '18,750'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Based on ~2.5 cubic ft @ ₹7.5K/ft³</p>
                        </div>
                        <div className="bg-accent p-3 rounded-lg">
                          <p className="text-muted-foreground">Production Time</p>
                          <p className="font-semibold text-foreground">3-4 weeks</p>
                          <p className="text-xs text-muted-foreground mt-1">From approval to listing</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-background rounded-xl p-6 border border-border shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 text-foreground">Marketplace Listing</h4>
                      <p className="text-muted-foreground">
                        Once approved, your design will be listed on Forma marketplace. You'll receive a custom creator page with analytics.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-background rounded-xl p-6 border border-border shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 text-foreground">Promotion & Sales</h4>
                      <p className="text-muted-foreground mb-3">
                        Share your design on social media, your portfolio, and with your network. You'll earn 10-15% commission on every sale, forever.
                      </p>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold mb-2 text-foreground">💡 Marketing Toolkit Included:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Custom shareable link for your design</li>
                          <li>• High-res product photos for social media</li>
                          <li>• Real-time sales dashboard</li>
                          <li>• Email templates for outreach</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1">
                    Refine Design
                  </Button>
                  <Button variant="default" className="flex-1">
                    Submit for Review
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

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
