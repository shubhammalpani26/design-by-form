import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Designer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  phone_number: string | null;
  design_background: string | null;
  user_id: string;
}

export function DesignersManagement() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | 'activate' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from("designer_profiles")
        .select(
          "id, user_id, name, status, slug, plan_tier, is_house, portfolio_url, design_background, furniture_interests, profile_picture_url, cover_image_url, terms_accepted, terms_accepted_at, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Email/phone are admin-only and served by a role-checked function
      const { data: contacts } = await supabase.rpc("admin_get_designer_contacts");
      const contactById = new Map((contacts || []).map((c: any) => [c.id, c]));
      setDesigners(
        (data || []).map((d: any) => ({
          ...d,
          email: contactById.get(d.id)?.email ?? "",
          phone_number: contactById.get(d.id)?.phone_number ?? null,
        }))
      );
    } catch (error) {
      console.error("Error fetching designers:", error);
      toast({
        title: "Error",
        description: "Failed to load designers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (designerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("designer_profiles")
        .update({ status: newStatus })
        .eq("id", designerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Designer ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`,
      });

      fetchDesigners();
      setSelectedDesigner(null);
      setActionType(null);
    } catch (error) {
      console.error("Error updating designer:", error);
      toast({
        title: "Error",
        description: "Failed to update designer status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDesigner = async (designerId: string) => {
    try {
      const { error } = await supabase
        .from("designer_profiles")
        .delete()
        .eq("id", designerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Designer deleted successfully",
      });

      fetchDesigners();
      setSelectedDesigner(null);
      setActionType(null);
    } catch (error) {
      console.error("Error deleting designer:", error);
      toast({
        title: "Error",
        description: "Failed to delete designer",
        variant: "destructive",
      });
    }
  };

  const confirmAction = () => {
    if (!selectedDesigner || !actionType) return;

    if (actionType === 'delete') {
      handleDeleteDesigner(selectedDesigner.id);
    } else if (actionType === 'suspend') {
      handleUpdateStatus(selectedDesigner.id, 'suspended');
    } else if (actionType === 'activate') {
      handleUpdateStatus(selectedDesigner.id, 'approved');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading designers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Designers</h2>
        <Badge variant="secondary">{designers.length} Total</Badge>
      </div>

      <div className="grid gap-4">
        {designers.map((designer) => (
          <Card key={designer.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{designer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{designer.email}</p>
                </div>
                <Badge variant={
                  designer.status === 'approved' ? 'default' :
                  designer.status === 'suspended' ? 'destructive' :
                  'secondary'
                }>
                  {designer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                {designer.phone_number && (
                  <div>
                    <span className="font-medium">Phone:</span> {designer.phone_number}
                  </div>
                )}
                {designer.design_background && (
                  <div>
                    <span className="font-medium">Background:</span> {designer.design_background}
                  </div>
                )}
                <div>
                  <span className="font-medium">Joined:</span> {new Date(designer.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                {designer.status !== 'suspended' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedDesigner(designer);
                      setActionType('suspend');
                    }}
                  >
                    Suspend
                  </Button>
                )}
                {designer.status === 'suspended' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedDesigner(designer);
                      setActionType('activate');
                    }}
                  >
                    Activate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDesigner(designer);
                    setActionType('delete');
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!actionType} onOpenChange={() => {
        setActionType(null);
        setSelectedDesigner(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' ? 'Delete Designer' :
               actionType === 'suspend' ? 'Suspend Designer' :
               'Activate Designer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' 
                ? 'Are you sure you want to permanently delete this designer? This action cannot be undone and will remove all their products.'
                : actionType === 'suspend'
                ? 'Are you sure you want to suspend this designer? They will lose access to the platform.'
                : 'Are you sure you want to activate this designer?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
