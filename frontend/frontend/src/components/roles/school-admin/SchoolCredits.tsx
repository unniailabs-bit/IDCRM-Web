import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { schoolDashboardApi } from '@/api/schoolDashboard';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { EmptyState } from '../../common/EmptyState';

interface CreditTransaction {
  id: string;
  date: string;
  type: 'Allocation' | 'Usage' | 'Top-up' | 'Request';
  amount: number;
  description: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export function SchoolCredits() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    setLoading(true);
    try {
      const response = await schoolDashboardApi.getOverview();
      if (response.success) {
        setCreditBalance(response.data.creditBalance);
        setCreditsUsed(response.data.creditsUsed);
      }
      // TODO: Load transactions from API when endpoint is available
      // For now, using empty array
      setTransactions([]);
    } catch (error) {
      console.error('Error loading credit data:', error);
      toast.error('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTopUp = async () => {
    if (!requestAmount || !requestReason) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API call to request top-up
      // const response = await axiosInstance.post('/api/school/credits/request-topup', {
      //   amount: parseInt(requestAmount),
      //   reason: requestReason
      // });

      toast.success('Credit top-up request submitted successfully');
      setIsRequestDialogOpen(false);
      setRequestAmount('');
      setRequestReason('');
    } catch (error: any) {
      console.error('Error requesting top-up:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case 'Allocation':
        return 'bg-green-100 text-green-800';
      case 'Usage':
        return 'bg-orange-100 text-orange-800';
      case 'Top-up':
        return 'bg-blue-100 text-blue-800';
      case 'Request':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Credits & Billing</h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">
              Manage your credit balance and transactions
            </p>
          </div>
          <button
            onClick={() => setIsRequestDialogOpen(true)}
            className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          >
            <Plus className="w-7 h-7" />
            Request Top-up
          </button>
        </div>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(creditBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">Available credits</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Credits Used</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(creditsUsed)}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  This month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 shadow-md hover:shadow-lg transition-shadow ${
            creditBalance < 100 ? 'border-l-red-500' : 'border-l-amber-500'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                <p
                  className={`text-2xl font-bold ${
                    creditBalance < 100 ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  {creditBalance < 100 ? 'Low' : 'Healthy'}
                </p>
                {creditBalance < 100 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Top-up recommended
                  </p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  creditBalance < 100 ? 'bg-red-100' : 'bg-amber-100'
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${creditBalance < 100 ? 'text-red-600' : 'text-amber-600'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-green-700 border-green-700 hover:bg-green-700 hover:text-white"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50">
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getTransactionBadgeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.type === 'Usage' ? '-' : '+'}
                        {formatNumber(transaction.amount)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {transaction.status && (
                          <Badge
                            className={
                              transaction.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No transactions yet"
              description="Your credit transactions will appear here once you start using credits or receive allocations."
            />
          )}
        </CardContent>
      </Card>

      {/* Request Top-up Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Credit Top-up</DialogTitle>
            <DialogDescription>Submit a request to add credits to your account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Credit Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Enter credit amount"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain why you need additional credits"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestTopUp}
              disabled={!requestAmount || !requestReason || submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
