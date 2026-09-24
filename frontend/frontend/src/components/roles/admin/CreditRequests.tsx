import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { creditRequestService } from '../../../api/platform_admin/creditRequestService';
import { approveCreditRequest, rejectCreditRequest, topUpTrustCredits } from '@/api/platform_admin/credit';

interface TrustMessage {
  id: number;
  trust_id: number;
  trust_name: string; // Moved to top level
  credit_amount: number;
  message: string;
  created_at: string;
  // Removed nested trust object
}

export function CreditRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<TrustMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: 'date' | 'credit'; order: 'asc' | 'desc' }>(
    { field: 'date', order: 'desc' }
  );

  const filteredRequests = requests
    .filter((req) => {
      const trustName = req.trust_name || '';
      const message = req.message || '';
      const searchLower = searchTerm.toLowerCase();
      return (
        trustName.toLowerCase().includes(searchLower) || message.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortConfig.field === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortConfig.order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.field === 'credit') {
        const creditA = a.credit_amount;
        const creditB = b.credit_amount;
        return sortConfig.order === 'asc' ? creditA - creditB : creditB - creditA;
      }
      return 0;
    });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await creditRequestService.getRequests();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(t('creditRequests.fetchError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);



  return (
    <div className="px-8 py-5 bg-white min-h-dvh">
      <div className="mb-8 md:mb-10 gap-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('creditRequests.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('creditRequests.subtitle')}
        </p>
      </div>
      <Card className="shadow-lg border-2 rounded-2xl px-4 py-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('creditRequests.incomingRequests')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('creditRequests.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setSortConfig((prev) => ({
                    field: 'date',
                    order: prev.field === 'date' && prev.order === 'asc' ? 'desc' : 'asc',
                  }))
                }
                className="gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {t('creditRequests.sortByDate')}{' '}
                {sortConfig.field === 'date' &&
                  `(${sortConfig.order === 'asc' ? t('creditRequests.oldest') : t('creditRequests.newest')})`}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSortConfig((prev) => ({
                    field: 'credit',
                    order: prev.field === 'credit' && prev.order === 'asc' ? 'desc' : 'asc',
                  }))
                }
                className="gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {t('creditRequests.sortByCredits')}{' '}
                {sortConfig.field === 'credit' &&
                  `(${sortConfig.order === 'asc' ? t('creditRequests.lowToHigh') : t('creditRequests.highToLow')})`}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p className="font-semibold">{t('creditRequests.errorOccurred')}</p>
              <p>{error}</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredRequests.map((request, index) => (
                <RequestCard key={`${request.id}-${index}`} request={request} onRefresh={fetchRequests} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>{t('creditRequests.noMessages')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestCard({ request, onRefresh }: { request: TrustMessage; onRefresh: () => void }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const trustName = request.trust_name || t('creditRequests.unknownTrust');

  const handleGrantCredits = async ({ trustId, messageId, creditsToAdd }: { trustId: number, messageId: number, creditsToAdd: number }) => {
    if (!trustId || !creditsToAdd || creditsToAdd <= 0) {
      toast.error(t('creditRequests.validationError'));
      return;
    }
    // setIsSubmitting(true);
    try {
      const topUpResponse = await topUpTrustCredits(trustId, {
        credit: creditsToAdd,
        reason: t('creditRequests.grantReason'),
      });

      if (!topUpResponse.success) {
        toast.error(topUpResponse.message || t('creditRequests.failedAdd'));
        return;
      }

      const approveResponse = await approveCreditRequest(messageId, {
        status: "Approved",
      });

      if (approveResponse.success) {
        toast.success(t('creditRequests.grantSuccess', { credits: creditsToAdd, name: trustName }));
        onRefresh(); // Refresh the data
      } else {
        toast.error(approveResponse.message || t('creditRequests.approveError'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('creditRequests.grantError'));
    } finally {
      // setIsSubmitting(false);
    }
  };

  const handleRejectCredits = async ({ messageId }: { messageId: number }) => {
    if (!messageId) {
      toast.error(t('creditRequests.invalidId'));
      return;
    }
    // setIsSubmitting(true);
    try {
      const response = await rejectCreditRequest(messageId, {
        status: "Rejected",
      });

      if (response.success) {
        toast.success(t('creditRequests.rejectSuccess', { name: trustName }));
        onRefresh(); // Refresh the data
      } else {
        toast.error(response.message || t('creditRequests.rejectError'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('creditRequests.rejectApiError'));
    } finally {
      // setIsSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader
        className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <CardTitle className="text-base font-semibold">{trustName}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-bold text-green-700 text-base">
            {request.credit_amount.toLocaleString()} {t('creditRequests.credits')}
          </p>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2 px-4 pb-4 space-y-3 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{t('creditRequests.requestedOn', { date: new Date(request.created_at).toLocaleString() })}</span>
          </div>
          {request.message && (
            <div className="p-3 bg-green-50 rounded-md text-sm text-green-800 border border-green-100">
              <p className="font-medium mb-1 flex items-center gap-2 text-green-700">
                <MessageSquare className="w-3 h-3" /> {t('creditRequests.messageFromAdmin')}
              </p>
              <p>{request.message}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleRejectCredits({ messageId: request.id })}
            >
              {t('creditRequests.reject')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleGrantCredits({ trustId: request.trust_id, messageId: request.id, creditsToAdd: request.credit_amount })}
            >
              {t('creditRequests.accept')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
