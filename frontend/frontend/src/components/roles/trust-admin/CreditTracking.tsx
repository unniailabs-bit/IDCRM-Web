import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { CreditCard, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreditTransaction {
  id: string;
  date: string;
  schoolName: string;
  type: 'Allocation' | 'Usage' | 'Refund';
  credits: number;
  description: string;
  performedBy: string;
}

export function CreditTracking() {
  const { t } = useTranslation();
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState('0');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    fetchCreditSummary();
    fetchRecentTransactions();
  }, []);

  const fetchCreditSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found. Please login first.');
        return;
      }

      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/trust/credit-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data.data;
      setTotalAllocated(data.current_credit);
      setTotalUsed(data.total_used);
      setTotalRemaining(data.remaining_credit);
      if (data.current_credit > 0) {
        setUsagePercentage(((data.total_used / data.current_credit) * 100).toFixed(1));
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('Unauthorized. Token is invalid or expired. Please login again.');
      } else {
        console.error('Failed to fetch credit summary', error);
      }
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found. Please login first.');
        return;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/trust/generated-ids-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mappedData: CreditTransaction[] = [];
      res.data?.data?.school_summary?.forEach((school: any) => {
        if (Number(school.total_ids_generated) > 0) {
          mappedData.push({
            id: `${school.school_id}-${school.class_id || '0'}-${school.division_id || '0'}`,
            date: new Date().toLocaleString(),
            schoolName: school.school_name,
            type: 'Usage',
            credits: Number(school.total_credits_deducted),
            description: `ID Card Generation - ${school.class_name || ''}${school.division_name ? ` ${school.division_name}` : ''
              } (${school.total_ids_generated} students)`,
            performedBy: 'School Admin',
          });
        }
      });

      setTransactions(mappedData);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('Unauthorized. Token is invalid or expired. Please login again.');
      } else {
        console.error('Failed to fetch transactions', error);
      }
    }
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('creditTracking.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('creditTracking.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-black font-semibold mb-1">{t('creditTracking.totalAllocated')}</p>
                <p className="text-gray-900">{totalAllocated}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-black font-semibold mb-1">{t('creditTracking.totalUsed')}</p>
                <p className="text-orange-600">{totalUsed}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-black font-semibold mb-1">{t('creditTracking.remaining')}</p>
                <p className="text-green-600">{totalRemaining}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-black font-semibold mb-1">{t('creditTracking.usageRate')}</p>
                <p className="text-gray-900">{usagePercentage}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Credit Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{t('creditTracking.recentTransactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('creditTracking.dateTime')}</TableHead>
                    <TableHead>{t('creditTracking.school')}</TableHead>
                    <TableHead>{t('creditTracking.type')}</TableHead>
                    <TableHead>{t('creditTracking.credits')}</TableHead>
                    <TableHead>{t('creditTracking.description')}</TableHead>
                    <TableHead>{t('creditTracking.performedBy')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">{transaction.date}</TableCell>
                      <TableCell className="truncate" title={transaction.schoolName}>
                        {' '}
                        {transaction.schoolName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transaction.type === 'Allocation'
                              ? 'bg-green-100 text-green-800'
                              : transaction.type === 'Usage'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={transaction.credits > 0 ? 'text-green-600' : 'text-orange-600'}
                        >
                          {transaction.credits > 0 ? '+' : ''}
                          {transaction.credits}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-sm">{transaction.performedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
