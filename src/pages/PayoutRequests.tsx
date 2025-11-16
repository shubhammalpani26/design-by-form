import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  bank_account_holder_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
}

interface DesignerProfile {
  id: string;
  bank_account_holder_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_details_verified: boolean;
}

const PayoutRequests = () => {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [requestAmount, setRequestAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const MINIMUM_PAYOUT = 5000;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch designer profile
      const { data: profileData } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profileData) {
        toast({
          title: 'Not a designer',
          description: 'Only designers can access payout requests',
          variant: 'destructive',
        });
        return;
      }

      setProfile(profileData);

      // Fetch payout requests
      const { data: requestsData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('designer_id', profileData.id)
        .order('requested_at', { ascending: false });

      setRequests(requestsData || []);

      // Calculate available balance
      const { data: earnings } = await supabase
        .from('designer_earnings')
        .select('royalty_amount')
        .eq('designer_id', profileData.id)
        .eq('paid_at', null);

      const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.royalty_amount), 0) || 0;
      
      // Subtract pending payout requests
      const pendingPayouts = requestsData
        ?.filter(r => r.status === 'pending' || r.status === 'approved')
        ?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      setAvailableBalance(totalEarnings - pendingPayouts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!profile) return;

    const amount = parseFloat(requestAmount);

    if (isNaN(amount) || amount < MINIMUM_PAYOUT) {
      toast({
        title: 'Invalid amount',
        description: `Minimum payout amount is ${formatPrice(MINIMUM_PAYOUT)}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: 'Insufficient balance',
        description: `You can only request up to ${formatPrice(availableBalance)}`,
        variant: 'destructive',
      });
      return;
    }

    if (!profile.bank_account_holder_name || !profile.bank_account_number) {
      toast({
        title: 'Bank details required',
        description: 'Please add your bank details in your profile',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          designer_id: profile.id,
          amount,
          bank_account_holder_name: profile.bank_account_holder_name,
          bank_account_number: profile.bank_account_number,
          bank_ifsc_code: profile.bank_ifsc_code || '',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payout request submitted successfully',
      });

      setShowDialog(false);
      setRequestAmount('');
      fetchData();
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <AlertCircle className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Payout Requests</h1>
          <p className="text-muted-foreground">
            Manage your earnings and request withdrawals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(availableBalance)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum payout: {formatPrice(MINIMUM_PAYOUT)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(requests.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime payouts</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Request History</h2>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button disabled={availableBalance < MINIMUM_PAYOUT}>
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Request a withdrawal of your earnings. Minimum amount is {formatPrice(MINIMUM_PAYOUT)}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Available Balance</Label>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(availableBalance)}</p>
                </div>
                <div>
                  <Label htmlFor="amount">Payout Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Minimum ${MINIMUM_PAYOUT}`}
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>
                {profile && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold">Bank Details</p>
                    <p className="text-sm">Account Holder: {profile.bank_account_holder_name}</p>
                    <p className="text-sm">Account Number: {profile.bank_account_number}</p>
                    {profile.bank_ifsc_code && (
                      <p className="text-sm">IFSC Code: {profile.bank_ifsc_code}</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestPayout} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No payout requests yet</p>
              <p className="text-sm text-muted-foreground">
                Request your first payout when your balance reaches {formatPrice(MINIMUM_PAYOUT)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </div>
                        </Badge>
                        <span className="text-2xl font-bold">{formatPrice(request.amount)}</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Requested: {new Date(request.requested_at).toLocaleDateString()}</p>
                        {request.processed_at && (
                          <p>Processed: {new Date(request.processed_at).toLocaleDateString()}</p>
                        )}
                        <p>Account: {request.bank_account_holder_name}</p>
                      </div>
                      {request.rejection_reason && (
                        <div className="mt-3 p-3 bg-destructive/10 border border-destructive rounded-lg">
                          <p className="text-sm font-semibold text-destructive">Rejection Reason:</p>
                          <p className="text-sm text-destructive mt-1">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PayoutRequests;
