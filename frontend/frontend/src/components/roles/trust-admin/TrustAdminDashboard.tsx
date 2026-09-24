import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '../../common/MetricCard';
import { GraduationCap, CreditCard, FileText, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { analyticsApi, AnalyticsOverview, MonthlyTrend, SchoolPerformance } from '@/api/analytics';
import { trustSchoolApi } from '@/api/trust/schools';
import { toast } from 'sonner';
import { trustService } from '@/api/trustService';
import { useTranslation } from 'react-i18next';

interface CreditSummary {
  trust_id: number;
  current_credit: number;
  total_received: number;
  total_edited: number;
  total_used: number;
  remaining_credit: number;
  school_usage: any[];
}

interface GeneratedIdsSummary {
  total_ids_generated: number;
  school_summary: any[];
}

export interface RecentActivity {
  id: string;
  school: string;
  action: string;
  date: string;
  credits: number;
}

export function TrustAdminDashboard() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [schoolPerformanceData, setSchoolPerformanceData] = useState<SchoolPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [generatedIdsSummary, setGeneratedIdsSummary] = useState<GeneratedIdsSummary | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /* New state for accurate school count */
  const [totalSchoolsCount, setTotalSchoolsCount] = useState<number>(0);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch schools directly from trust school API for accurate count
      try {
        const schoolsRes = await trustSchoolApi.getAllSchools(0);
        if (schoolsRes.success && schoolsRes.data) {
          setTotalSchoolsCount(schoolsRes.data.length);
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      }

      // Use Promise.allSettled to handle individual failures gracefully
      const [
        overviewRes,
        monthlyRes,
        schoolRes,
        activityRes,
        creditSummaryRes,
        generatedIdsSummaryRes,
      ] = await Promise.allSettled([
        analyticsApi.getOverview().catch((err) => {
          console.error('Error fetching overview:', err);
          return { success: false, data: null };
        }),
        analyticsApi.getMonthlyTrends().catch((err) => {
          console.error('Error fetching monthly trends:', err);
          return { success: false, data: [] };
        }),
        analyticsApi.getSchoolPerformance().catch((err) => {
          console.error('Error fetching school performance:', err);
          return { success: false, data: [] };
        }),
        analyticsApi.getRecentActivity().catch((err) => {
          console.error('Error fetching recent activity:', err);
          return { success: false, data: [] };
        }),
        trustService.getCreditSummary().catch((err) => {
          console.error('Error fetching credit summary:', err);
          return { success: false, data: null };
        }),
        trustService.getGeneratedIdsSummary().catch((err) => {
          console.error('Error fetching generated IDs summary:', err);
          return { success: false, data: null };
        }),
      ]);

      // Handle overview
      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value.data);
      }
      if (creditSummaryRes.status === 'fulfilled' && creditSummaryRes.value.success) {
        setCreditSummary(creditSummaryRes.value.data);
      }
      if (generatedIdsSummaryRes.status === 'fulfilled' && generatedIdsSummaryRes.value.success) {
        setGeneratedIdsSummary(generatedIdsSummaryRes.value.data);
      }

      // Handle monthly trends
      if (monthlyRes.status === 'fulfilled' && monthlyRes.value.success) {
        setMonthlyData(monthlyRes.value.data);
      }

      // Handle school performance
      let schoolData: SchoolPerformance[] = [];
      if (schoolRes.status === 'fulfilled' && schoolRes.value.success) {
        schoolData = schoolRes.value.data;
        setSchoolPerformanceData(schoolData);
      }

      // Handle recent activity
      if (
        activityRes.status === 'fulfilled' &&
        activityRes.value.success &&
        activityRes.value.data &&
        activityRes.value.data.length > 0
      ) {
        setRecentActivity(activityRes.value.data);
      } else {
        // Fallback: create activity from school performance data
        if (schoolData.length > 0) {
          const activity = schoolData.slice(0, 5).map((school, index) => ({
            id: `activity-${index}`,
            school: school.school,
            action: t('trustAdminDashboard.generatedIds', { count: school.idCards }),
            date: new Date().toLocaleString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
            credits: school.creditsUsed,
          }));
          setRecentActivity(activity);
        } else {
          setRecentActivity([]);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(t('trustAdminDashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Prepare monthly trend data for chart
  const monthlyTrendChartData = monthlyData.map((item) => ({
    month: item.month,
    ids: item.idCards,
    students: item.students,
    credits: item.credits,
  }));

  // Prepare school performance chart data
  const schoolChartData = schoolPerformanceData.slice(0, 10).map((school) => ({
    school: school.school.length > 15 ? school.school.substring(0, 15) + '...' : school.school,
    generated: school.idCards,
    students: school.students,
  }));

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 min-h-screen pb-12 mx-auto bg-white overflow-y-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('trustAdminDashboard.title')}</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {userData?.trust_name} {t('trustAdminDashboard.overview')}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('trustAdminDashboard.schoolsManaged')}
            value={formatNumber(totalSchoolsCount)}
            icon={GraduationCap}
            trend={
              totalSchoolsCount > 0
                ? `${totalSchoolsCount} ${t('trustAdminDashboard.active')}`
                : t('trustAdminDashboard.noSchoolsYet')
            }
            trendUp={true}
            variant="orange"
          />
        </Card>

        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('trustAdminDashboard.totalIdsGenerated')}
            value={formatNumber(generatedIdsSummary?.total_ids_generated || 0)}
            icon={FileText}
            trend={
              overview && overview.idCardsGrowth > 0
                ? `+${overview.idCardsGrowth}% ${t('trustAdminDashboard.thisMonth')}`
                : overview && overview.idCardsGrowth < 0
                  ? `${overview.idCardsGrowth}% ${t('trustAdminDashboard.thisMonth')}`
                  : t('trustAdminDashboard.noChange')
            }
            trendUp={overview ? overview.idCardsGrowth > 0 : false}
            variant="orange"
          />
        </Card>

        <Card className="shadow-xl rounded-xl">
          {' '}
          <MetricCard
            title={t('trustAdminDashboard.totalCreditsAllocated')}
            value={formatNumber(creditSummary?.total_credits_allocated || 0)}
            icon={CreditCard}
            trend={`${formatNumber(creditSummary?.total_used || 0)} ${t('trustAdminDashboard.used')}`}
            variant="orange"
          />
        </Card>

        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('trustAdminDashboard.creditsRemaining')}
            value={formatNumber(creditSummary?.remaining_credit || 0)}
            icon={TrendingUp}
            trend={
              creditSummary && creditSummary.current_credit > 0
                ? `${(
                  (creditSummary.remaining_credit / creditSummary.current_credit) *
                  100
                ).toFixed(1)}% ${t('trustAdminDashboard.remaining')}`
                : `0% ${t('trustAdminDashboard.remaining')}`
            }
            trendUp={
              creditSummary
                ? creditSummary.remaining_credit > (creditSummary.current_credit || 0) * 0.3
                : false
            }
            variant="orange"
          />
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 border shadow-xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('trustAdminDashboard.schoolPerformanceComparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            {schoolChartData.length > 0 ? (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schoolChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="generated" fill="#3b82f6" name={t('trustAdminDashboard.idCardsGenerated')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 md:h-80 flex items-center justify-center text-gray-400">
                {t('trustAdminDashboard.noDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('trustAdminDashboard.monthlyIdGenerationTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrendChartData.length > 0 ? (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="ids"
                      stroke="#10b981"
                      strokeWidth={2}
                      name={t('trustAdminDashboard.idCardsGenerated')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 md:h-80 flex items-center justify-center text-gray-400">
                {t('trustAdminDashboard.noDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* School Credits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">{t('trustAdminDashboard.schoolPerformanceOverview')}</CardTitle>
          </CardHeader>
          <CardContent className="px-12">
            {schoolPerformanceData.length > 0 ? (
              <div className="space-y-4">
                {schoolPerformanceData.slice(0, 5).map((school, index) => {
                  const totalCredits =
                    school.creditsUsed +
                    (overview?.creditsRemaining || 0) / (overview?.totalSchools || 1);
                  const percentage =
                    totalCredits > 0 ? (school.creditsUsed / totalCredits) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{school.school}</span>
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="bg-orange-50 text-orange-400 px-2 py-0.5 rounded-md font-semibold">
                            {formatNumber(school.idCards)} {t('trustAdminDashboard.ids')}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="bg-green-50 text-green-400 px-2 py-0.5 rounded-md font-semibold">
                            {formatNumber(school.creditsUsed)} {t('trustAdminDashboard.credits')}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${percentage > 80
                            ? 'bg-red-500'
                            : percentage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">{t('trustAdminDashboard.noSchoolDataAvailable')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('trustAdminDashboard.quickStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-gray-600">{t('trustAdminDashboard.totalStudents')}</span>
                <span className="font-semibold">{formatNumber(overview?.totalStudents || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-gray-600">{t('trustAdminDashboard.totalTeachers')}</span>
                <span className="font-semibold">{formatNumber(overview?.totalTeachers || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-gray-600">{t('trustAdminDashboard.idCardsGenerated')}</span>
                <span className="font-semibold text-green-600">
                  {formatNumber(overview?.totalIdCards || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-gray-600">{t('trustAdminDashboard.successRate')}</span>
                <span className="font-semibold">{overview?.successRate?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-600">{t('trustAdminDashboard.creditsUsed')}</span>
                <span className="font-semibold text-blue-600">
                  {formatNumber(overview?.creditsUsed || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-xl rounded-xl border">
        <CardHeader>
          <CardTitle className="text-2xl">{t('trustAdminDashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent className="px-12">
          {recentActivity.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('trustAdminDashboard.school')}</TableHead>
                      <TableHead>{t('trustAdminDashboard.activity')}</TableHead>
                      <TableHead>{t('trustAdminDashboard.dateTime')}</TableHead>
                      <TableHead>{t('trustAdminDashboard.creditsUsedHeader')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.school}</TableCell>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{activity.date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.credits > 0 ? formatNumber(activity.credits) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">{t('trustAdminDashboard.noRecentActivity')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
