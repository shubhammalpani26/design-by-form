import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export function UsersManagement() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "designer" | "customer">("customer");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newUserEmail) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUserEmail, // This should be a user ID, not email
          role: newUserRole,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      setNewUserEmail("");
      setNewUserRole("customer");
      fetchRoles();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", selectedRole.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchRoles();
      setShowDeleteDialog(false);
      setSelectedRole(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage User Roles</h2>
        <Badge variant="secondary">{roles.length} Total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="User ID (UUID)"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddRole}>Assign Role</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{role.user_id}</p>
                  <p className="text-sm text-muted-foreground">
                    Assigned: {new Date(role.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge>{role.role}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setShowDeleteDialog(true);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this role assignment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
