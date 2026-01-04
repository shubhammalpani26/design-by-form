import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Minus, Coins, RefreshCw } from "lucide-react";

interface UserCredit {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
  email?: string;
  name?: string;
}

export function CreditsManagement() {
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersWithCredits();
  }, []);

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    try {
      // Fetch user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("*")
        .order("updated_at", { ascending: false });

      if (creditsError) throw creditsError;

      // Fetch designer profiles to get names/emails
      const { data: designerProfiles, error: profilesError } = await supabase
        .from("designer_profiles")
        .select("user_id, name, email");

      if (profilesError) throw profilesError;

      // Map credits with profile info
      const usersWithInfo = creditsData?.map((credit) => {
        const profile = designerProfiles?.find((p) => p.user_id === credit.user_id);
        return {
          ...credit,
          name: profile?.name || "Unknown",
          email: profile?.email || "N/A",
        };
      }) || [];

      setUsers(usersWithInfo);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentDialog = (user: UserCredit, type: "add" | "deduct") => {
    setSelectedUser(user);
    setAdjustmentType(type);
    setAdjustmentAmount(10);
    setAdjustmentReason("");
    setIsDialogOpen(true);
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const newBalance = adjustmentType === "add" 
        ? selectedUser.balance + adjustmentAmount 
        : Math.max(0, selectedUser.balance - adjustmentAmount);

      // Update credits
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ 
          balance: newBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log the transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: selectedUser.user_id,
          amount: adjustmentType === "add" ? adjustmentAmount : -adjustmentAmount,
          type: adjustmentType === "add" ? "admin_add" : "admin_deduct",
          description: adjustmentReason || `Admin ${adjustmentType === "add" ? "added" : "deducted"} ${adjustmentAmount} credits`,
        });

      if (transactionError) {
        console.error("Failed to log transaction:", transactionError);
      }

      toast({
        title: "Credits Updated",
        description: `${adjustmentType === "add" ? "Added" : "Deducted"} ${adjustmentAmount} credits. New balance: ${newBalance}`,
      });

      setIsDialogOpen(false);
      fetchUsersWithCredits();
    } catch (error) {
      console.error("Error adjusting credits:", error);
      toast({
        title: "Error",
        description: "Failed to adjust credits",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.user_id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                AI Credits Management
              </CardTitle>
              <CardDescription>
                View and adjust user AI credit balances
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchUsersWithCredits} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Balance</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.balance > 10 ? "default" : user.balance > 0 ? "secondary" : "destructive"}>
                            {user.balance} credits
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openAdjustmentDialog(user, "add")}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openAdjustmentDialog(user, "deduct")}
                            >
                              <Minus className="h-4 w-4 mr-1" />
                              Deduct
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "add" ? "Add Credits" : "Deduct Credits"}
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === "add" 
                ? `Add AI credits to ${selectedUser?.name}'s account` 
                : `Deduct AI credits from ${selectedUser?.name}'s account`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <Badge variant="secondary">{selectedUser?.balance} credits</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                max={1000}
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">New Balance</span>
              <span className="text-lg font-bold text-primary">
                {adjustmentType === "add" 
                  ? (selectedUser?.balance || 0) + adjustmentAmount 
                  : Math.max(0, (selectedUser?.balance || 0) - adjustmentAmount)} credits
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustCredits} 
              disabled={isProcessing || adjustmentAmount <= 0}
              variant={adjustmentType === "add" ? "default" : "destructive"}
            >
              {isProcessing ? "Processing..." : adjustmentType === "add" ? "Add Credits" : "Deduct Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
