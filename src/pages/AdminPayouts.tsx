import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PayoutRequest {
  id: string;
  designer_id: string;
  amount: number;
  status: string;
  rejection_reason: string | null;
  requested_at: string;
  bank_account_holder_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  designer: {
    name: string;
    email: string;
    phone_number: string;
  };
}

const AdminPayouts = () => {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: 'Access denied',
          description: 'Admin access required',
          variant: 'destructive',
        });
        return;
      }

      fetchRequests();
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('payout_requests')
      .select(`
        *,
        designer:designer_profiles(name, email, phone_number)
      `)
      .order('requested_at', { ascending: false });

    setRequests(data || []);
  };

  const handleApprove = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification
      const { data: designerProfile } = await supabase
        .from('designer_profiles')
        .select('user_id')
        .eq('id', request.designer_id)
        .single();

      if (designerProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: designerProfile.user_id,
            title: 'Payout Approved! ✅',
            message: `Your payout request of ${formatPrice(request.amount)} has been approved and will be processed shortly.`,
            type: 'payout',
            link: '/payout-requests',
          });
      }

      toast({
        title: 'Success',
        description: 'Payout request approved',
      });
      fetchRequests();
    } catch (error) {
      console.error('Error approving payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payout',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Send notification
      const { data: designerProfile } = await supabase
        .from('designer_profiles')
        .select('user_id')
        .eq('id', selectedRequest.designer_id)
        .single();

      if (designerProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: designerProfile.user_id,
            title: 'Payout Request Rejected',
            message: `Your payout request of ${formatPrice(selectedRequest.amount)} was rejected. Reason: ${rejectionReason}`,
            type: 'payout',
            link: '/payout-requests',
          });
      }

      toast({
        title: 'Success',
        description: 'Payout request rejected',
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payout',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'paid',
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payout marked as paid',
      });
      fetchRequests();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark as paid',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-blue-500';
      case 'paid':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filterByStatus = (status?: string) => {
    return status ? requests.filter(r => r.status === status) : requests;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <h1 className="text-4xl font-bold mb-8">Payout Management</h1>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filterByStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid ({filterByStatus('paid').length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          </TabsList>

          {['pending', 'approved', 'paid', 'all'].map(status => (
            <TabsContent key={status} value={status} className="mt-6">
              {filterByStatus(status === 'all' ? undefined : status).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No {status} payout requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filterByStatus(status === 'all' ? undefined : status).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status.toUpperCase()}
                              </Badge>
                              <span className="text-2xl font-bold">{formatPrice(request.amount)}</span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <p><strong>Designer:</strong> {request.designer.name}</p>
                              <p><strong>Email:</strong> {request.designer.email}</p>
                              <p><strong>Phone:</strong> {request.designer.phone_number}</p>
                              <p><strong>Requested:</strong> {new Date(request.requested_at).toLocaleString()}</p>
                            </div>

                            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                              <p className="text-sm font-semibold mb-2">Bank Details:</p>
                              <p className="text-sm">Holder: {request.bank_account_holder_name}</p>
                              <p className="text-sm">Account: {request.bank_account_number}</p>
                              {request.bank_ifsc_code && (
                                <p className="text-sm">IFSC: {request.bank_ifsc_code}</p>
                              )}
                            </div>

                            {request.rejection_reason && (
                              <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-sm font-semibold text-destructive">Rejection Reason:</p>
                                <p className="text-sm text-destructive mt-1">{request.rejection_reason}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(request.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payout Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this payout request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPayouts;
