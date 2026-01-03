import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Mail, Calendar, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface DesignerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  profile_picture_url: string | null;
}

interface UserWithRole extends UserRole {
  email?: string;
  name?: string;
  profile_picture_url?: string | null;
}

export function UsersManagement() {
  const [roles, setRoles] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "designer" | "customer">("customer");
  const [selectedRole, setSelectedRole] = useState<UserWithRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [designers, setDesigners] = useState<DesignerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from("designer_profiles")
        .select("id, user_id, name, email, profile_picture_url");

      if (error) throw error;
      setDesigners(data || []);
    } catch (error) {
      console.error("Error fetching designers:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch designer profiles to get emails and names
      const { data: designerData, error: designerError } = await supabase
        .from("designer_profiles")
        .select("user_id, name, email, profile_picture_url");

      if (designerError) throw designerError;

      // Map roles with designer info
      const rolesWithInfo: UserWithRole[] = (rolesData || []).map((role) => {
        const designer = designerData?.find((d) => d.user_id === role.user_id);
        return {
          ...role,
          email: designer?.email,
          name: designer?.name,
          profile_picture_url: designer?.profile_picture_url,
        };
      });

      setRoles(rolesWithInfo);
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
        description: "Please enter a user ID or select a user",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUserEmail,
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
        description: "Failed to assign role. User may already have this role.",
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

  const filteredDesigners = designers.filter(
    (d) =>
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter((role) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      role.email?.toLowerCase().includes(query) ||
      role.name?.toLowerCase().includes(query) ||
      role.user_id.toLowerCase().includes(query) ||
      role.role.toLowerCase().includes(query)
    );
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "designer":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Select from Designers */}
          {filteredDesigners.length > 0 && searchQuery && (
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm text-muted-foreground">Select a user:</p>
              {filteredDesigners.slice(0, 5).map((designer) => (
                <button
                  key={designer.user_id}
                  onClick={() => {
                    setNewUserEmail(designer.user_id);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={designer.profile_picture_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(designer.name, designer.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{designer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{designer.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="User ID (UUID) or search above"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              {newUserEmail && (
                <p className="text-xs text-muted-foreground">
                  Selected: {designers.find((d) => d.user_id === newUserEmail)?.email || newUserEmail}
                </p>
              )}
            </div>
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
        {filteredRoles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No users found matching your search.
            </CardContent>
          </Card>
        ) : (
          filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={role.profile_picture_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(role.name, role.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {role.name || "Unknown User"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {role.email || "No email available"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Assigned: {new Date(role.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                        ID: {role.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge className={getRoleBadgeColor(role.role)}>{role.role}</Badge>
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
          ))
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>{selectedRole?.role}</strong> role from{" "}
              <strong>{selectedRole?.name || selectedRole?.email || "this user"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
