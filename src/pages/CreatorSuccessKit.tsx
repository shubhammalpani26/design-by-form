import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Share2, TrendingUp, Calendar, DollarSign, Camera, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreatorSuccessKit = () => {
  const { toast } = useToast();
  const [copiedText, setCopiedText] = useState<string>("");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedText(""), 2000);
  };

  const captionTemplates = [
    {
      category: "Product Launch",
      templates: [
        "✨ New design alert! Just dropped my latest creation on @forma.design - [Product Name]. What do you think? Link in bio 🔗 #FurnitureDesign #CreatorEconomy",
        "From concept to creation 🎨 My [Product Name] is now live and ready to transform your space. Shop the link in my bio! #SculpturalFurniture #AIDesign",
        "Excited to share my newest piece with you all! [Product Name] combines [key feature] with [key feature]. Available now 👆 #DesignerLife #ModernFurniture"
      ]
    },
    {
      category: "Behind the Scenes",
      templates: [
        "The journey from sketch to reality 📐✨ Here's how [Product Name] came to life. Swipe to see the process → #DesignProcess #BehindTheScenes",
        "POV: You're designing furniture at 2 AM and suddenly... 💡 This is how [Product Name] was born. Full story on my blog (link in bio) #CreativeProcess",
        "Three iterations, countless refinements, and one final masterpiece. Meet [Product Name] 🎯 #DesignJourney #Craftsmanship"
      ]
    },
    {
      category: "Social Proof",
      templates: [
        "Thank you for [X] sales in just [Y] weeks! 🙏 Your support means everything. [Product Name] is still available - link in bio ❤️ #GratefulDesigner",
        "Blown away by your response to [Product Name]! 🤩 If you've been on the fence, now's the time. Limited production run this month 👆 #CustomerLove",
        "Your reviews make my day! ⭐️⭐️⭐️⭐️⭐️ '[Customer quote]' - Shop [Product Name] via link in bio #HappyCustomers #QualityFurniture"
      ]
    },
    {
      category: "Educational",
      templates: [
        "Did you know? [Product Name] is crafted using high-grade resin reinforced with glass fibre 🌱 Advanced materials meet artistic craftsmanship. Learn more → #InnovativeDesign #ArtisanCraft",
        "Material matters: Why I chose advanced composite materials for [Product Name] 🔬 Swipe for a deep dive into the science behind beautiful, durable furniture #MaterialScience #DesignEducation",
        "Furniture 101: How AI is revolutionizing design 🤖 My [Product Name] started as a simple prompt. Here's the full story → #AIDesign #FutureTech"
      ]
    }
  ];

  const photoTips = [
    {
      title: "Natural Lighting",
      description: "Shoot during golden hour (early morning or late afternoon) for soft, flattering light",
      icon: "☀️"
    },
    {
      title: "Multiple Angles",
      description: "Capture front, side, top, and detail shots. Minimum 5-7 photos per product",
      icon: "📸"
    },
    {
      title: "Lifestyle Context",
      description: "Show your furniture in real spaces - living rooms, offices, patios",
      icon: "🏠"
    },
    {
      title: "Clean Background",
      description: "Use neutral backgrounds to make your piece the star. White, gray, or natural wood work best",
      icon: "🎨"
    },
    {
      title: "Scale Reference",
      description: "Include a person or common object to show true size",
      icon: "📏"
    },
    {
      title: "High Resolution",
      description: "Shoot at highest quality. Minimum 2000px width for web use",
      icon: "🔍"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-12">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Creator Success Kit</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Everything You Need to Sell Day One
              </h1>
              <p className="text-lg text-muted-foreground">
                Marketing templates, photo guides, trackable links, and payout schedules to launch your designs successfully
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-12">
          <Tabs defaultValue="captions" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="captions">Caption Templates</TabsTrigger>
              <TabsTrigger value="photos">Photo Guide</TabsTrigger>
              <TabsTrigger value="links">Trackable Links</TabsTrigger>
              <TabsTrigger value="payouts">Payout Schedule</TabsTrigger>
            </TabsList>

            {/* Caption Templates */}
            <TabsContent value="captions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Ready-to-Use Social Media Captions
                  </CardTitle>
                  <CardDescription>
                    Copy, customize, and post. Optimized for Instagram, Facebook, and Twitter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {captionTemplates.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                        {section.category}
                      </h3>
                      {section.templates.map((template, tIdx) => (
                        <Card key={tIdx} className="bg-accent/20">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                              {template}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(template, `${section.category} template ${tIdx + 1}`)}
                              className="w-full sm:w-auto"
                            >
                              <Copy className="w-3 h-3 mr-2" />
                              {copiedText === `${section.category} template ${tIdx + 1}` ? "Copied!" : "Copy Caption"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}

                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20 mt-6">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span>💡</span> Pro Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Replace [Product Name] with your actual product name</li>
                      <li>• Add 3-5 relevant hashtags from your niche</li>
                      <li>• Post when your audience is most active (check insights)</li>
                      <li>• Always include a clear call-to-action and link</li>
                      <li>• Engage with comments within the first hour for better reach</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photo Guide */}
            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Professional Photo Guidelines
                  </CardTitle>
                  <CardDescription>
                    Create stunning product photos that sell
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photoTips.map((tip, idx) => (
                      <Card key={idx} className="bg-accent/20">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">{tip.icon}</span>
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">{tip.title}</h4>
                              <p className="text-sm text-muted-foreground">{tip.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Essential Shot List</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">1</div>
                        <span>Hero shot - main product angle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">2</div>
                        <span>Side profile view</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">3</div>
                        <span>Top-down view</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">4</div>
                        <span>Detail shots (texture, joints)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">5</div>
                        <span>In-context lifestyle photo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">6</div>
                        <span>Scale reference shot</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Resources
                    </h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="w-3 h-3 mr-2" />
                        Photography Checklist PDF
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="w-3 h-3 mr-2" />
                        Lightroom Preset Pack
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="w-3 h-3 mr-2" />
                        Shot List Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trackable Links */}
            <TabsContent value="links" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    Trackable Marketing Links
                  </CardTitle>
                  <CardDescription>
                    Monitor where your sales are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Instagram Bio Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="forma.design/c/your-username?utm_source=instagram&utm_medium=bio"
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-accent/20 text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCopy("forma.design/c/your-username?utm_source=instagram&utm_medium=bio", "Instagram link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Facebook/Meta Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="forma.design/c/your-username?utm_source=facebook&utm_medium=post"
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-accent/20 text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCopy("forma.design/c/your-username?utm_source=facebook&utm_medium=post", "Facebook link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Twitter/X Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="forma.design/c/your-username?utm_source=twitter&utm_medium=tweet"
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-accent/20 text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCopy("forma.design/c/your-username?utm_source=twitter&utm_medium=tweet", "Twitter link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Newsletter Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="forma.design/c/your-username?utm_source=email&utm_medium=newsletter"
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-accent/20 text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCopy("forma.design/c/your-username?utm_source=email&utm_medium=newsletter", "Email link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">YouTube Description Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="forma.design/c/your-username?utm_source=youtube&utm_medium=description"
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-accent/20 text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCopy("forma.design/c/your-username?utm_source=youtube&utm_medium=description", "YouTube link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                    <h4 className="font-semibold text-sm mb-2">🎯 How to Track Performance</h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Use a different link for each platform</li>
                      <li>Check your Creator Dashboard analytics weekly</li>
                      <li>Identify which channels drive the most sales</li>
                      <li>Double down on what works, optimize what doesn't</li>
                      <li>A/B test different captions and posting times</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payout Schedule */}
            <TabsContent value="payouts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Payout Schedule & Earnings
                  </CardTitle>
                  <CardDescription>
                    Understand when and how you get paid
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 text-center">
                        <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h4 className="font-semibold text-foreground mb-1">Monthly Payouts</h4>
                        <p className="text-xs text-muted-foreground">
                          Paid on the 15th of each month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-secondary/5 border-secondary/20">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
                        <h4 className="font-semibold text-foreground mb-1">5% - 10% Commission</h4>
                        <p className="text-xs text-muted-foreground">
                          Based on sales performance
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 text-center">
                        <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h4 className="font-semibold text-foreground mb-1">100% Markup</h4>
                        <p className="text-xs text-muted-foreground">
                          Keep all earnings above base cost
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Commission Tiers</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Standard Tier</p>
                          <p className="text-sm text-muted-foreground">All creators</p>
                        </div>
                        <span className="text-lg font-bold text-primary">5%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Premium Tier</p>
                          <p className="text-sm text-muted-foreground">₹4,15,000+ in sales</p>
                        </div>
                        <span className="text-lg font-bold text-primary">8%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-primary bg-primary/5 rounded-lg">
                        <div>
                          <p className="font-medium">Elite Tier</p>
                          <p className="text-sm text-muted-foreground">₹12,45,000+ in sales</p>
                        </div>
                        <span className="text-lg font-bold text-primary">10%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">1</div>
                        <div>
                          <p className="font-medium">Customer Orders</p>
                          <p className="text-sm text-muted-foreground">Order is confirmed and payment processed</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">2</div>
                        <div>
                          <p className="font-medium">Manufacturing (21 days)</p>
                          <p className="text-sm text-muted-foreground">Your design is manufactured and quality checked</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">3</div>
                        <div>
                          <p className="font-medium">Delivery & Return Window</p>
                          <p className="text-sm text-muted-foreground">15-day window after delivery for customer returns</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">4</div>
                        <div>
                          <p className="font-medium">Payout (Next 15th)</p>
                          <p className="text-sm text-muted-foreground">Earnings paid on the 15th of the following month</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                    <h4 className="font-semibold text-sm mb-2">📊 Example Earnings</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p className="font-medium text-foreground">Product: Chair priced at ₹35,000</p>
                      <p>• Manufacturing base cost: ₹18,000</p>
                      <p>• Your markup*: ₹17,000 (100% yours)</p>
                      <p>• Platform commission (5%): ₹900</p>
                      <p className="font-bold text-foreground pt-2 border-t">Your earnings per sale: ₹17,900</p>
                      <p className="text-xs mt-2">*Platform fees currently waived</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatorSuccessKit;