import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function CreatorSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load any existing settings here if you have a settings table
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings to database here when you create a settings table
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CreatorSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4 p-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Creator Settings</h1>
            </div>
          </header>
          
          <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and preferences
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive order updates via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive order updates via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smsNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive tips and promotional content
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, marketingEmails: checked })
                    }
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="destructive" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  </SidebarProvider>
  );
}
