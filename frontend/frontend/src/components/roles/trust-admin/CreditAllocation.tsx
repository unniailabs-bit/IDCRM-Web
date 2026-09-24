import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { AlertCircle, History, Plus, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { requestNewCredits, getCreditSummary } from '../../../api/trust/creditService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CreditTransaction {
  id: string;
  date: string;
  type: 'Allocation' | 'Usage' | 'Top-up' | 'Request';
  credits: number;
  description: string;
  performedBy: string;
  schoolName?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

interface AllocationHistory {
  id: string;
  schoolName: string;
  credits: number;
  allocatedBy: string;
  date: string;
  notes?: string;
}

interface SummaryData {
  remaining_credit: number;
  total_edited: number;
  total_used: number;
}

const mockTransactions: CreditTransaction[] = [
  {
    id: '1',
    date: '2024-11-08 10:30 AM',
    type: 'Usage',
    credits: -25,
    description: 'ID Card Generation - Class 3B (25 students)',
    performedBy: 'School Admin',
    schoolName: 'Sunrise Public School',
  },
  {
    id: '2',
    date: '2024-11-07 02:15 PM',
    type: 'Allocation',
    credits: 200,
    description: 'Monthly credit allocation',
    performedBy: 'Trust Admin',
    schoolName: 'Green Valley School',
  },
  {
    id: '3',
    date: '2024-11-06 11:20 AM',
    type: 'Top-up',
    credits: 5000,
    description: 'Platform admin top-up',
    performedBy: 'Platform Admin',
  },
  {
    id: '4',
    date: '2024-11-05 09:45 AM',
    type: 'Request',
    credits: 5000,
    description: 'Credit balance request',
    performedBy: 'Trust Admin',
    status: 'Approved',
  },
];

const mockAllocationHistory: AllocationHistory[] = [
  {
    id: '1',
    schoolName: 'Cambridge High School',
    credits: 2500,
    allocatedBy: 'Trust Admin',
    date: '2024-10-15',
    notes: 'Initial allocation for academic year 2024-25',
  },
  {
    id: '2',
    schoolName: 'Cambridge Primary School',
    credits: 2000,
    allocatedBy: 'Trust Admin',
    date: '2024-10-15',
    notes: 'Initial allocation for academic year 2024-25',
  },
  {
    id: '3',
    schoolName: 'Cambridge International',
    credits: 1500,
    allocatedBy: 'Trust Admin',
    date: '2024-10-20',
    notes: 'Top-up allocation',
  },
];

export function CreditAllocation() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'allocation'>('request');
  const [transactions, setTransactions] = useState<CreditTransaction[]>(mockTransactions);
  const [allocationHistory, setAllocationHistory] =
    useState<AllocationHistory[]>(mockAllocationHistory);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const response = await getCreditSummary();
        if (response.success) {
          setSummary(response.data);
        } else {
          toast.error(response.message || t('creditAllocation.fetchSummaryError'));
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('creditAllocation.fetchSummaryErrorGeneral'));
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  const handleSendRequest = async () => {
    if (creditAmount <= 0) {
      toast.error(t('creditAllocation.invalidCreditAmount'));
      return;
    }

    if (!userData || !userData.id) {
      toast.error(t('creditAllocation.trustIdentifyError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const trustId = userData.id;
      const response = await requestNewCredits(trustId, {
        credit_amount: creditAmount,
        message: message,
      });

      if (response.success) {
        toast.success(response.message || t('creditAllocation.requestSentTitle'));
        // Add transaction to history for immediate UI feedback
        const newTransaction: CreditTransaction = {
          id: Date.now().toString(),
          date: new Date().toLocaleString(),
          type: 'Request',
          credits: creditAmount,
          description: message || t('creditAllocation.creditBalanceRequest'),
          performedBy: 'Trust Admin',
          status: 'Pending',
        };
        setTransactions([newTransaction, ...transactions]);
        setIsRequestSent(true);

        // Reset form after a delay, but keep showing success message
        setTimeout(() => {
          setCreditAmount(0);
          setMessage('');
        }, 500); // Short delay to allow user to see their input disappear
      } else {
        toast.error(response.message || t('creditAllocation.unknownError'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('creditAllocation.sendRequestError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionBadgeColor = (type: CreditTransaction['type']) => {
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

  const trustCreditBalance = summary?.remaining_credit ?? 0;
  const totalAllocated = (summary as any)?.total_credits_allocated ?? 0;
  const totalCreditsUsed = summary?.total_used ?? 0;

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('creditAllocation.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('creditAllocation.subtitle')}
        </p>
      </div>

      {/* Trust Credit Overview */}
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="border border-gray-300 rounded-2xl p-6">
          {loadingSummary ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('creditAllocation.trustCreditBalance')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {trustCreditBalance.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('creditAllocation.availableCredits')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('creditAllocation.totalAllocated')}</p>
                <p className="text-2xl font-bold">{totalAllocated.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{t('creditAllocation.toSchools')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('creditAllocation.totalUsed')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalCreditsUsed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('creditAllocation.bySchools')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/*<div>
                <p className="text-sm text-gray-600 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(trustCreditBalance - totalAllocated).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available to allocate</p>
              </div>*/}


      {/* Low Balance Warning */}
      {
        trustCreditBalance < 1000 && !loadingSummary && (
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t('creditAllocation.lowBalanceTitle')}</p>
                  <p className="text-sm text-gray-700">
                    {t('creditAllocation.lowBalanceMsg')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Tabs for Request, History, and Allocation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        {/* <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request">Request Credits</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="allocation">Allocation History</TabsTrigger>
        </TabsList> */}

        {/* Request Credits Tab */}
        <TabsContent value="request">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{t('creditAllocation.newCreditRequest')}</CardTitle>
                  <CardDescription>
                    {t('creditAllocation.newCreditRequestDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isRequestSent ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-green-50 rounded-lg">
                      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800">
                        {t('creditAllocation.requestSentTitle')}
                      </h3>
                      <p className="text-gray-600 mt-2">{t('creditAllocation.requestSentDesc')}</p>
                      <Button variant="link" onClick={() => setIsRequestSent(false)}>
                        {t('creditAllocation.makeAnotherRequest')}
                      </Button>
                    </div>
                  ) : (
                    <form className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="credit-amount">{t('creditAllocation.creditAmount')}</Label>
                        <Input
                          id="credit-amount"
                          type="number"
                          min="1"
                          value={creditAmount || ''}
                          onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                          placeholder={t('creditAllocation.creditAmountPlaceholder')}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">{t('creditAllocation.message')}</Label>
                        <Textarea
                          id="message"
                          className="h-24"
                          placeholder={t('creditAllocation.messagePlaceholder')}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendRequest}
                        disabled={creditAmount <= 0 || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t('creditAllocation.sending') : t('creditAllocation.sendRequest')}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle>{t('creditAllocation.trustWallet')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingSummary ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('creditAllocation.currentCreditBalance')}</p>
                          <p className="text-3xl font-bold text-green-600">
                            {trustCreditBalance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('creditAllocation.totalCreditsUsed')}</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {totalCreditsUsed.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{t('creditAllocation.howItWorks')}</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>{t('creditAllocation.howItWorksStep1')}</li>
                        <li>{t('creditAllocation.howItWorksStep2')}</li>
                        <li>{t('creditAllocation.howItWorksStep3')}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Transaction History Tab */}
        {/* <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Transaction History</CardTitle>
                  <CardDescription>
                    View all credit transactions including top-ups, allocations, usage, and requests
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">{transaction.date}</TableCell>
                        <TableCell>
                          <Badge className={getTransactionBadgeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              transaction.credits > 0
                                ? 'text-green-600 font-semibold'
                                : 'text-orange-600 font-semibold'
                            }
                          >
                            {transaction.credits > 0 ? '+' : ''}
                            {transaction.credits.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.description}</TableCell>
                        <TableCell className="text-sm">{transaction.schoolName || '-'}</TableCell>
                        <TableCell className="text-sm">{transaction.performedBy}</TableCell>
                        <TableCell>
                          {transaction.status && (
                            <Badge
                              className={
                                transaction.status === 'Approved'
                                  ? 'bg-green-100 text-green-800'
                                  : transaction.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
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
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Allocation History Tab */}
        {/* <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Allocation History</CardTitle>
                  <CardDescription>
                    View history of credit allocations to schools under your trust
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allocationHistory.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{record.schoolName}</p>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <Badge className="bg-green-100 text-green-800">
                            +{record.credits.toLocaleString()} Credits
                          </Badge>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">{record.date}</p>
                        <p className="text-xs text-gray-500 mt-1">by {record.allocatedBy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div >
  );
}
