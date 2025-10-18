import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { designSubmissionSchema } from "@/lib/validations";

const DesignStudio = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"2d" | "3d" | "ar">("2d");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [leadTime, setLeadTime] = useState<number | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dimensions, setDimensions] = useState({
    length: "",
    breadth: "",
    height: ""
  });
  const [submissionData, setSubmissionData] = useState({
    name: "",
    description: "",
    category: "chairs",
    basePrice: 0,
    designerPrice: 0,
    plagiarismTermsAccepted: false,
  });
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
    setGeneratedVariations([]);
    setSelectedVariation(null);
    
    try {
      const variationPromises = [1, 2, 3].map(async (variationNum) => {
        const { data, error } = await supabase.functions.invoke('generate-design', {
          body: { prompt, variationNumber: variationNum }
        });

        if (error) throw new Error(error.message || 'Failed to generate design');
        if (!data?.imageUrl) throw new Error('No image generated');

        return data.imageUrl;
      });

      const variations = await Promise.all(variationPromises);
      setGeneratedVariations(variations);
      
      const assumedCubicFeet = 3.5;
      const costPerCubicFoot = 18000;
      const baseCost = assumedCubicFeet * costPerCubicFoot;
      setEstimatedCost(baseCost);
      setLeadTime(28); // 4 weeks
      
      toast({
        title: "Designs Generated!",
        description: "3 variations created. Select your favorite to continue.",
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

  const handleSelectVariation = (index: number) => {
    setSelectedVariation(index);
    setGeneratedDesign(generatedVariations[index]);
    setShowWorkflow(true);
    setShowSubmissionForm(true);
    if (estimatedCost) {
      setSubmissionData(prev => ({
        ...prev,
        basePrice: estimatedCost,
        designerPrice: estimatedCost * 1.5,
      }));
    }
    toast({
      title: "Variation Selected",
      description: "Fill out the submission form below to list your design.",
    });
  };

  const handleSubmitDesign = async () => {
    if (!generatedDesign) {
      toast({
        title: "No Design Selected",
        description: "Please generate and select a design first.",
        variant: "destructive",
      });
      return;
    }

    if (!dimensions.length || !dimensions.breadth || !dimensions.height) {
      toast({
        title: "Dimensions Required",
        description: "Please enter the dimensions (L × B × H) for your design.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate submission data
      const validatedData = designSubmissionSchema.parse({
        ...submissionData,
        imageUrl: generatedDesign,
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your design.",
          variant: "destructive",
        });
        return;
      }

      // Get designer profile
      const { data: profile, error: profileError } = await supabase
        .from("designer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your designer profile first.",
          variant: "destructive",
        });
        return;
      }

      // Check for plagiarism
      const { data: plagiarismData, error: plagiarismError } = await supabase.functions.invoke(
        'check-plagiarism',
        { body: { imageUrl: generatedDesign } }
      );

      if (plagiarismError) {
        console.error('Plagiarism check error:', plagiarismError);
      }

      if (plagiarismData?.isPlagiarized) {
        toast({
          title: "Similar Design Detected",
          description: `This design appears similar to ${plagiarismData.similarCount} existing design(s). Please ensure your design is original.`,
          variant: "destructive",
        });
        return;
      }

      // Create product with dimensions
      const { error: productError } = await supabase.from("designer_products").insert({
        designer_id: profile.id,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        base_price: validatedData.basePrice,
        designer_price: validatedData.designerPrice,
        original_designer_price: validatedData.designerPrice,
        image_url: generatedDesign,
        dimensions: {
          length: parseFloat(dimensions.length),
          breadth: parseFloat(dimensions.breadth),
          height: parseFloat(dimensions.height)
        },
        status: 'pending',
      });

      if (productError) throw productError;

      toast({
        title: "Design Submitted!",
        description: "We'll review your design for manufacturing feasibility and notify you via email/SMS when it's approved.",
      });

      // Reset form
      setGeneratedDesign(null);
      setGeneratedVariations([]);
      setSelectedVariation(null);
      setShowSubmissionForm(false);
      setShowWorkflow(false);
      setDimensions({ length: "", breadth: "", height: "" });
      setSubmissionData({
        name: "",
        description: "",
        category: "chairs",
        basePrice: 0,
        designerPrice: 0,
        plagiarismTermsAccepted: false,
      });
      setPrompt("");

    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast({
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your input.",
          variant: "destructive",
        });
      } else {
        console.error('Submission error:', error);
        toast({
          title: "Submission Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
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
              Transform your ideas into real, production-ready furniture pieces. 
              We manufacture and deliver your custom designs. No design experience required.
            </p>
          </div>
        </section>

        {/* Design Interface */}
        <section className="container py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Side */}
              <div className="space-y-6">
                <Card className="border-primary/20 shadow-medium">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Describe Your Design</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Describe your furniture piece in detail. Include style, dimensions, colors, and finishes.
                      </p>
                    </div>

                    <Textarea
                      placeholder="Example: A modern minimalist dining table with organic curved edges, matte black finish, 72×40×30 inches..."
                      className="min-h-[160px] text-base"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />

                    {/* Quick Ideas */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">💡 Quick Ideas:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Modern dining table with curved edges",
                          "Sculptural chair with flowing lines",
                          "Minimalist side table",
                          "Organic shelf unit",
                        ].map((example, i) => (
                          <button
                            key={i}
                            onClick={() => setPrompt(example)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-accent transition-all"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Finish Selection */}
                    <div className="space-y-3 pt-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Finish:</p>
                        <div className="flex flex-wrap gap-2">
                          {['Matte', 'Glossy', 'Metallic', 'Marble', 'Wood Grain', 'Concrete'].map((finish) => (
                            <button
                              key={finish}
                              onClick={() => {
                                setSelectedFinish(finish);
                                const finishRegex = /,?\s*\b(matte|glossy|metallic|marble|wood grain|concrete|terrazzo)\s+(finish|effect)\b/gi;
                                if (prompt.match(finishRegex)) {
                                  setPrompt(prev => prev.replace(finishRegex, `, ${finish.toLowerCase()} finish`));
                                } else {
                                  setPrompt(prev => `${prev}${prev ? ', ' : ''}${finish.toLowerCase()} finish`);
                                }
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                selectedFinish === finish
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-secondary/10 hover:bg-secondary/20 border-secondary/20 hover:border-secondary'
                              }`}
                            >
                              {finish}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

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
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          {uploadedImage ? "✓ Sketch" : "Upload Sketch"}
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

                {/* 3D Upload Option */}
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Already Have a Model?
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload your .OBJ, .STL, or .FBX file and we'll prepare it for manufacturing
                    </p>
                     <Button variant="outline" size="sm" className="w-full" asChild>
                      <label className="cursor-pointer">
                        <input type="file" accept=".obj,.stl,.fbx" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            toast({
                              title: "Model Uploaded",
                              description: "We'll review your model for manufacturing feasibility",
                            });
                          }
                        }} />
                        Upload Model File
                      </label>
                    </Button>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-accent border-border">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-foreground">💡 Design Guidelines</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Focus on <strong className="text-foreground">single-piece forms</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Describe <strong className="text-foreground">surface finishes</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Include <strong className="text-foreground">style & shape</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span className="line-through">Avoid wheels, hinges, or multi-material assemblies</span>
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
                        {generatedVariations.length > 0 ? (
                          <div className="space-y-4">
                            {leadTime && (
                              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-foreground">Lead Time</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{leadTime} days (~4 weeks)</span>
                              </div>
                            )}
                            {dimensions.length && dimensions.breadth && dimensions.height && (
                              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                  <span className="text-sm font-semibold text-foreground">Dimensions</span>
                                </div>
                                <span className="text-sm font-bold text-primary">{dimensions.length}" × {dimensions.breadth}" × {dimensions.height}"</span>
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                              {generatedVariations.map((imageUrl, index) => (
                                <div key={index} className="space-y-3">
                                  <button
                                    onClick={() => handleSelectVariation(index)}
                                    className={`group relative overflow-hidden rounded-xl transition-all w-full ${
                                      selectedVariation === index
                                        ? "ring-4 ring-primary shadow-elegant scale-[1.02]"
                                        : "hover:shadow-soft hover:scale-[1.01]"
                                    }`}
                                  >
                                    <div className="aspect-square bg-accent">
                                      <img src={imageUrl} alt={`Design Variation ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white font-semibold">Variation {index + 1}</p>
                                      </div>
                                    </div>
                                    {selectedVariation === index && (
                                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                  
                                  {selectedVariation === index && (
                                    <Card className="border-primary/20 bg-primary/5">
                                      <CardContent className="p-4 space-y-3">
                                        <h4 className="font-semibold text-foreground">Enter Dimensions for This Design</h4>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Dimensions (L × B × H in inches):</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            <Input
                                              type="number"
                                              placeholder="L"
                                              value={dimensions.length}
                                              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                                              className="text-sm"
                                            />
                                            <Input
                                              type="number"
                                              placeholder="B"
                                              value={dimensions.breadth}
                                              onChange={(e) => setDimensions({ ...dimensions, breadth: e.target.value })}
                                              className="text-sm"
                                            />
                                            <Input
                                              type="number"
                                              placeholder="H"
                                              value={dimensions.height}
                                              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                                              className="text-sm"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Or select a preset:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {['48"×24"×30"', '60"×36"×18"', '72"×40"×30"', '36"×36"×16"'].map((size) => (
                                              <button
                                                key={size}
                                                onClick={() => {
                                                  const [l, b, h] = size.replace(/"/g, '').split('×');
                                                  setDimensions({ length: l, breadth: b, height: h });
                                                  setSelectedSize(size);
                                                }}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                  selectedSize === size
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background hover:bg-accent border-border hover:border-primary'
                                                }`}
                                              >
                                                {size}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-muted-foreground text-sm">Your generated designs will appear here</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="3d" className="mt-0">
                        {generatedDesign ? (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent">
                            <ModelViewer3D productName="Generated Design" />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <p className="text-muted-foreground text-sm">3D model will be available after selecting a design</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="ar" className="mt-0">
                        {generatedDesign ? (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent">
                            <ARViewer productName="Generated Design" />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <p className="text-muted-foreground text-sm">AR preview will be available after selecting a design</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Set Your Price & Earnings */}
                {generatedDesign && estimatedCost && (
                  <Card className="border-primary/20">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-lg text-foreground">Set Your Price & Earnings</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between pb-2 border-b border-border">
                          <span className="text-muted-foreground">Base Manufacturing Cost</span>
                          <span className="font-semibold text-foreground">₹{estimatedCost.toLocaleString()}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Your Selling Price (₹)</label>
                          <input
                            type="number"
                            min={estimatedCost}
                            defaultValue={estimatedCost * 1.5}
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                            onChange={(e) => {
                              const markup = parseInt(e.target.value) - estimatedCost;
                              const commission = estimatedCost * 0.05;
                              const total = markup + commission;
                              document.getElementById('markup-display')!.textContent = `₹${markup.toLocaleString()}`;
                              document.getElementById('commission-display')!.textContent = `₹${commission.toLocaleString()}`;
                              document.getElementById('total-earnings')!.textContent = `₹${total.toLocaleString()}`;
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Minimum: ₹{estimatedCost.toLocaleString()}</p>
                        </div>

                        <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Your Markup (100% yours)</span>
                            <span id="markup-display" className="font-semibold text-primary">₹{(estimatedCost * 0.5).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Commission (5% on base)</span>
                            <span id="commission-display" className="font-semibold text-secondary">₹{(estimatedCost * 0.05).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-primary/20">
                            <span className="font-semibold text-foreground">Per Sale Earnings</span>
                            <span id="total-earnings" className="font-bold text-primary">₹{(estimatedCost * 0.55).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-accent/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-2">📈 If you sell 10 units/month:</p>
                          <p className="text-sm font-bold text-foreground">Monthly Income: ₹{(estimatedCost * 5.5).toLocaleString()}</p>
                        </div>

                        {leadTime && (
                          <div className="flex justify-between pt-2">
                            <span className="text-muted-foreground">Manufacturing Time</span>
                            <span className="font-semibold text-foreground">{leadTime} days</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Design Submission Form */}
        {showSubmissionForm && (
          <section className="bg-accent/20 py-16">
            <div className="container max-w-3xl mx-auto">
              <Card className="border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Submit Your Design</h2>
                  <p className="text-muted-foreground mb-6">
                    Complete the details below to submit your design for review and listing
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Design Name *</label>
                      <Input 
                        placeholder="e.g., Modern Curve Chair"
                        value={submissionData.name}
                        onChange={(e) => setSubmissionData({ ...submissionData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Description *</label>
                      <Textarea 
                        placeholder="Describe your design, its features, and what makes it unique..."
                        className="min-h-[100px]"
                        value={submissionData.description}
                        onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Category *</label>
                      <select
                        className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                        value={submissionData.category}
                        onChange={(e) => setSubmissionData({ ...submissionData, category: e.target.value })}
                      >
                        <option value="chairs">Chairs</option>
                        <option value="tables">Tables</option>
                        <option value="storage">Storage</option>
                        <option value="decor">Decor</option>
                        <option value="lighting">Lighting</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Dimensions (L × B × H) *</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input 
                            type="number"
                            placeholder="L"
                            value={dimensions.length}
                            disabled
                          />
                          <Input 
                            type="number"
                            placeholder="B"
                            value={dimensions.breadth}
                            disabled
                          />
                          <Input 
                            type="number"
                            placeholder="H"
                            value={dimensions.height}
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dimensions.length && dimensions.breadth && dimensions.height 
                            ? `${dimensions.length}" × ${dimensions.breadth}" × ${dimensions.height}"`
                            : "Please enter dimensions above"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Base Price (₹) *</label>
                        <Input 
                          type="number"
                          value={submissionData.basePrice}
                          onChange={(e) => setSubmissionData({ ...submissionData, basePrice: parseFloat(e.target.value) })}
                          min={1000}
                          required
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">Manufacturing cost</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Your Price (₹) *</label>
                        <Input 
                          type="number"
                          value={submissionData.designerPrice}
                          onChange={(e) => setSubmissionData({ ...submissionData, designerPrice: parseFloat(e.target.value) })}
                          min={submissionData.basePrice}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">Your selling price</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Your Earnings Per Sale</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{((submissionData.designerPrice - submissionData.basePrice) + (submissionData.basePrice * 0.05)).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Markup: ₹{(submissionData.designerPrice - submissionData.basePrice).toLocaleString()} + 
                        Commission: ₹{(submissionData.basePrice * 0.05).toLocaleString()}
                      </p>
                    </div>

                    <div className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="plagiarism" 
                          checked={submissionData.plagiarismTermsAccepted}
                          onCheckedChange={(checked) => 
                            setSubmissionData({ ...submissionData, plagiarismTermsAccepted: checked as boolean })
                          }
                          required
                        />
                        <label
                          htmlFor="plagiarism"
                          className="text-sm leading-relaxed cursor-pointer text-foreground"
                        >
                          <strong>I confirm that this design is my original work.</strong>
                          <br />
                          I certify that this design does not infringe on any existing copyrights, trademarks, 
                          or intellectual property rights. I understand that plagiarized designs will be removed 
                          and may result in account suspension.
                        </label>
                      </div>
                    </div>

                    <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                      <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Order Notifications
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        You'll receive email and SMS notifications when someone places an order for your design. 
                        Make sure your contact details in your creator profile are up to date.
                      </p>
                    </div>

                    <Button 
                      variant="hero" 
                      className="w-full" 
                      onClick={handleSubmitDesign}
                      disabled={isSubmitting || !submissionData.plagiarismTermsAccepted}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Submitting Design...
                        </>
                      ) : (
                        "Submit Design for Review"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Workflow Section */}
        {showWorkflow && (
          <section className="bg-accent/30 py-16">
            <div className="container max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">What Happens Next?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: "Design Refinement", desc: "We'll review and optimize your design for manufacturing feasibility" },
                  { step: 2, title: "Manufacturing", desc: "Your piece is manufactured using premium FRP and hand-finished" },
                  { step: 3, title: "Listing & Sales", desc: "We list your design on Forma marketplace and handle all sales" },
                  { step: 4, title: "You Earn", desc: "You'll receive notifications when orders are placed and earn income automatically" }
                ].map((item) => (
                  <Card key={item.step} className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{item.step}</span>
                      </div>
                      <h4 className="font-semibold mb-2 mt-6 text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DesignStudio;
