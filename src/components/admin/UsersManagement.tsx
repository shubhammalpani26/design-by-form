import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Mail, Calendar, Search, Filter, Shield, UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  status: string;
  profile_picture_url: string | null;
  created_at: string;
}

interface UserWithRoles extends DesignerProfile {
  roles: UserRole[];
}

export function UsersManagement() {
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "designer" | "customer">("customer");
  const [selectedUser, setSelectedUser] = useState<{ user: UserWithRoles; role: UserRole } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      // Fetch all designer profiles
      const { data: designers, error: designersError } = await supabase
        .from("designer_profiles")
        .select("id, user_id, name, email, status, profile_picture_url, created_at")
        .order("created_at", { ascending: false });

      if (designersError) throw designersError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Map designers with their roles
      const usersData: UserWithRoles[] = (designers || []).map((designer) => ({
        ...designer,
        roles: (roles || []).filter((r) => r.user_id === designer.user_id),
      }));

      setUsersWithRoles(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (userId: string, role: "admin" | "designer" | "customer") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      fetchAllUsers();
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
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", selectedUser.role.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchAllUsers();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = usersWithRoles.filter((user) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.user_id.toLowerCase().includes(query);

    // Role filter
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "no-role" && user.roles.length === 0) ||
      user.roles.some((r) => r.role === roleFilter);

    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "designer":
        return "bg-primary/10 text-primary border-primary/20";
      case "customer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Stats
  const totalUsers = usersWithRoles.length;
  const admins = usersWithRoles.filter((u) => u.roles.some((r) => r.role === "admin")).length;
  const designers = usersWithRoles.filter((u) => u.roles.some((r) => r.role === "designer")).length;
  const noRoles = usersWithRoles.filter((u) => u.roles.length === 0).length;

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{designers}</p>
              <p className="text-xs text-muted-foreground">Designers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{noRoles}</p>
              <p className="text-xs text-muted-foreground">No Role</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="no-role">No Role</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {totalUsers} users
        </p>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No users found matching your filters.
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_picture_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{user.name}</p>
                        <Badge className={getStatusBadgeColor(user.status)} variant="outline">
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground/60 font-mono">
                        ID: {user.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    {/* Current Roles */}
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          No roles assigned
                        </Badge>
                      ) : (
                        user.roles.map((role) => (
                          <div key={role.id} className="flex items-center gap-1">
                            <Badge className={getRoleBadgeColor(role.role)}>{role.role}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setSelectedUser({ user, role });
                                setShowDeleteDialog(true);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Role Dropdown */}
                    <div className="flex items-center gap-2">
                      <Select
                        value=""
                        onValueChange={(value: "admin" | "designer" | "customer") => {
                          handleAddRole(user.user_id, value);
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="+ Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {!user.roles.some((r) => r.role === "admin") && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                          {!user.roles.some((r) => r.role === "designer") && (
                            <SelectItem value="designer">Designer</SelectItem>
                          )}
                          {!user.roles.some((r) => r.role === "customer") && (
                            <SelectItem value="customer">Customer</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
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
              Are you sure you want to remove the <strong>{selectedUser?.role.role}</strong> role from{" "}
              <strong>{selectedUser?.user.name}</strong>?
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
