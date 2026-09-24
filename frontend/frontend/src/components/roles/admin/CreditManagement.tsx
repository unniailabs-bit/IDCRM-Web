import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { TrendingUp, Search, Loader2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTrustCreditSummary,
  topUpTrustCredits,
  getCreditHistory,
  getCreditSummaryAll,
  deductTrustCredits,
} from '../../../api/platform_admin/credit';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';

interface TrustCreditSummary {
  trustId: number;
  trustName: string;
  totalCredits: number;
  used: string;
  remaining: string;
  lastUpdatedAt: string | null;
}

interface CreditSummary {
  total_allocated: number;
  total_used: number;
  total_remaining: number;
}

type CreditStatus = 'Healthy' | 'Warning' | 'Critical';

interface CreditTransaction {
  id: string;
  date: string;
  trustName: string;
  type: 'Top-up' | 'Allocation' | 'Usage' | 'Request' | 'Correction' | 'Deduction' | 'Unknown';
  credits: number;
  reason: string;
  performedBy: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export function CreditManagement() {
  const { t } = useTranslation();
  const [trustCredits, setTrustCredits] = useState<TrustCreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances');
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);

  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTrust, setSelectedTrust] = useState<TrustCreditSummary | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeductDialogOpen, setIsDeductDialogOpen] = useState(false);
  const [creditsToDeduct, setCreditsToDeduct] = useState<number | ''>('');
  const [deductReason, setDeductReason] = useState('');

  const total =
    (selectedTrust ? parseInt(selectedTrust.remaining, 10) : 0) +
    (typeof creditsToAdd === 'number' ? creditsToAdd : 0);

  const totalAfterDeduction =
    (selectedTrust ? parseInt(selectedTrust.remaining, 10) : 0) -
    (typeof creditsToDeduct === 'number' ? creditsToDeduct : 0);

  const fetchTrusts = async () => {
    try {
      setLoading(true);
      const response = await getTrustCreditSummary();
      if (response.success) {
        setTrustCredits(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch trust credit summary.');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'An error occurred while fetching trust credits.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditSummary = async () => {
    try {
      const response = await getCreditSummaryAll();
      if (response.success) {
        setCreditSummary(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch credit summary.');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'An error occurred while fetching credit summary.'
      );
    }
  };

  useEffect(() => {
    fetchTrusts();
    fetchCreditSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await getCreditHistory();
      if (response.success) {
        setTransactions(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch transaction history.');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'An error occurred while fetching transaction history.'
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddCredits = (trust: TrustCreditSummary) => {
    setSelectedTrust(trust);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCreditsToAdd('');
    setReason('');
    setSelectedTrust(null);
  };

  const handleDeductCredits = (trust: TrustCreditSummary) => {
    setSelectedTrust(trust);
    setIsDeductDialogOpen(true);
  };

  const handleCloseDeductDialog = () => {
    setIsDeductDialogOpen(false);
    setCreditsToDeduct('');
    setDeductReason('');
    setSelectedTrust(null);
  };

  const handleAddCreditsSubmit = async () => {
    if (!selectedTrust || !creditsToAdd || creditsToAdd <= 0 || !reason.trim()) {
      toast.error(t('credits.fillAllFields'));
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await topUpTrustCredits(selectedTrust.trustId, {
        credit: creditsToAdd,
        reason: reason,
      });

      if (response.success) {
        toast.success(t('credits.successAdd', { credits: creditsToAdd, name: selectedTrust.trustName }));
        fetchTrusts(); // Refresh the data
        handleCloseDialog();
      } else {
        toast.error(response.message || t('credits.failedAdd'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while adding credits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeductCreditsSubmit = async () => {
    if (!selectedTrust || !creditsToDeduct || creditsToDeduct <= 0 || !deductReason.trim()) {
      toast.error(t('credits.fillAllFields'));
      return;
    }

    const currentBalance = parseInt(selectedTrust.remaining, 10);
    if (creditsToDeduct > currentBalance) {
      toast.error(t('credits.cannotDeductMore'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deductTrustCredits(selectedTrust.trustId, {
        credit: creditsToDeduct,
        reason: deductReason,
      });

      if (response.success) {
        toast.success(
          t('credits.successDeduct', { credits: creditsToDeduct, name: selectedTrust.trustName })
        );
        fetchTrusts(); // Refresh the data
        handleCloseDeductDialog();
      } else {
        toast.error(response.message || t('credits.failedDeduct'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while deducting credits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: CreditStatus) => {
    switch (status) {
      case 'Healthy':
        return 'bg-green-100 text-green-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
    }
  };

  const getTransactionBadgeColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'Top-up':
        return 'bg-blue-100 text-blue-800';
      case 'Allocation':
        return 'bg-green-100 text-green-800';
      case 'Usage':
        return 'bg-orange-100 text-orange-800';
      case 'Request':
        return 'bg-purple-100 text-purple-800';
      case 'Correction':
        return 'bg-indigo-100 text-indigo-800';
      case 'Deduction':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTrusts = trustCredits.filter((trust) => {
    const term = searchTerm.toLowerCase();
    return trust.trustName.toLowerCase().includes(term);
  });

  return (
    <div className="px-8 py-5 bg-white min-h-dvh">
      <div className="mb-8 md:mb-10 gap-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('credits.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('credits.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="shadow-xl border rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('credits.totalAllocated')}</p>
                <p className="mt-2">
                  {creditSummary ? (
                    creditSummary.total_allocated.toLocaleString()
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl border rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('credits.totalUsed')}</p>
                <p className="mt-2">
                  {creditSummary ? (
                    creditSummary.total_used.toLocaleString()
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl border rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('credits.totalRemaining')}</p>
                <p className="mt-2">
                  {creditSummary ? (
                    creditSummary.total_remaining.toLocaleString()
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="shadow-2xl rounded-xl"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balances">{t('credits.balances')}</TabsTrigger>
          <TabsTrigger value="history">{t('credits.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="px-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle className="text-lg font-semibold">{t('credits.trustBalances')}</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t('credits.searchTrust')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('credits.trust')}</TableHead>
                        <TableHead>{t('credits.totalCredits')}</TableHead>
                        <TableHead>{t('credits.used')}</TableHead>
                        <TableHead>{t('credits.remaining')}</TableHead>
                        <TableHead>{t('credits.usagePercent')}</TableHead>
                        <TableHead>{t('credits.status')}</TableHead>
                        <TableHead>{t('credits.lastTopUp')}</TableHead>
                        <TableHead>{t('credits.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredTrusts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-48">
                            {t('credits.noTrustsFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTrusts.map((trust) => {
                          const usagePercent =
                            trust.totalCredits > 0
                              ? Math.round((parseInt(trust.used, 10) / trust.totalCredits) * 100)
                              : 0;

                          let status: CreditStatus;
                          if (usagePercent > 80) {
                            status = 'Critical';
                          } else if (usagePercent > 60) {
                            status = 'Warning';
                          } else {
                            status = 'Healthy';
                          }

                          return (
                            <TableRow key={trust.trustId}>
                              <TableCell>{trust.trustName}</TableCell>
                              <TableCell>{trust.totalCredits.toLocaleString()}</TableCell>
                              <TableCell>{parseInt(trust.used, 10).toLocaleString()}</TableCell>
                              <TableCell>
                                {parseInt(trust.remaining, 10).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${status === 'Critical'
                                        ? 'bg-red-500'
                                        : status === 'Warning'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                        }`}
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 w-12">
                                    {usagePercent}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(status)}>{status}</Badge>
                              </TableCell>
                              <TableCell>
                                {trust.lastUpdatedAt
                                  ? new Date(trust.lastUpdatedAt).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddCredits(trust)}
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Plus className="w-4 h-4" />
                                    {t('credits.add')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeductCredits(trust)}
                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Minus className="w-4 h-4" />
                                    {t('credits.deduct')}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="px-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">{t('credits.history')}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('credits.subtitle')}
                  </p>
                </div>
                {/* <Button variant="outline" size="sm" className="gap-2">
                  <History className="w-4 h-4" />
                  Export
                </Button> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Trust Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Performed By</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-48">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-48">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">{transaction.date}</TableCell>
                          <TableCell className="font-medium">{transaction.trustName}</TableCell>
                          <TableCell>
                            <Badge className={getTransactionBadgeColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                transaction.credits < 0 ||
                                  transaction.type === 'Usage' ||
                                  transaction.type === 'Deduction'
                                  ? 'text-red-600 font-semibold'
                                  : 'text-green-600 font-semibold'
                              }
                            >
                              {transaction.credits > 0 &&
                                transaction.type !== 'Usage' &&
                                transaction.type !== 'Deduction'
                                ? '+'
                                : ''}
                              {transaction.credits.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{transaction.reason}</TableCell>
                          <TableCell className="text-sm">{transaction.performedBy}</TableCell>
                          {/* <TableCell>
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
                        </TableCell> */}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('credits.addCreditsTo', { name: selectedTrust?.trustName })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('credits.currentBalance')}</Label>
                <p className="text-2xl font-semibold">
                  {selectedTrust ? parseInt(selectedTrust.remaining, 10).toLocaleString() : '0'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('credits.newBalance')}</Label>
                <p className="text-2xl font-semibold">{total.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">{t('credits.creditsToAdd')}</Label>
              <Input
                id="credits"
                type="number"
                placeholder={t('credits.placeholderCredits')}
                value={creditsToAdd}
                onChange={(e) =>
                  setCreditsToAdd(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t('credits.reason')}</Label>
              <Input
                id="reason"
                placeholder={t('credits.placeholderReason')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                {t('schools.cancel')}
              </Button>
              <Button
                onClick={handleAddCreditsSubmit}
                disabled={!reason.trim() || !creditsToAdd || creditsToAdd <= 0 || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('credits.adding') : t('credits.addCredits')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeductDialogOpen}
        onOpenChange={(isOpen) => !isOpen && handleCloseDeductDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('credits.deductCreditsFrom', { name: selectedTrust?.trustName })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('credits.currentBalance')}</Label>
                <p className="text-2xl font-semibold">
                  {selectedTrust ? parseInt(selectedTrust.remaining, 10).toLocaleString() : '0'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('credits.newBalance')}</Label>
                <p className="text-2xl font-semibold text-red-600">
                  {totalAfterDeduction.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductCredits">{t('credits.creditsToDeduct')}</Label>
              <Input
                id="deductCredits"
                type="number"
                placeholder={t('credits.placeholderDeductCredits')}
                value={creditsToDeduct}
                onChange={(e) =>
                  setCreditsToDeduct(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductReason">{t('credits.reason')}</Label>
              <Input
                id="deductReason"
                placeholder={t('credits.placeholderDeductReason')}
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseDeductDialog} disabled={isSubmitting}>
                {t('schools.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeductCreditsSubmit}
                disabled={
                  !deductReason.trim() ||
                  !creditsToDeduct ||
                  creditsToDeduct <= 0 ||
                  isSubmitting ||
                  creditsToDeduct > (selectedTrust ? parseInt(selectedTrust.remaining, 10) : 0)
                }
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('credits.deducting') : t('credits.deductCredits')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
