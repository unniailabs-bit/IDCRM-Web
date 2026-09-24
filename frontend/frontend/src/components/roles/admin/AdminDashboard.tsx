import { Link } from 'react-router-dom';
import { MetricCard } from '../../common/MetricCard';
import {
  Building2,
  GraduationCap,
  CreditCard,
  TrendingUp,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { trustService } from '@/api/trustService';
import { schoolService } from '@/api/schoolService';
import axiosInstance from '@/api/axiosInstance'; // Import axiosInstance
import { useTranslation } from 'react-i18next';

const chartData = [
  { date: 'Nov 1', generated: 245 },
  { date: 'Nov 2', generated: 312 },
  { date: 'Nov 3', generated: 189 },
  { date: 'Nov 4', generated: 428 },
  { date: 'Nov 5', generated: 356 },
  { date: 'Nov 6', generated: 289 },
  { date: 'Nov 7', generated: 402 },
];

export function AdminDashboard() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('7days');
  const [selectedTrust, setSelectedTrust] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [totalTrusts, setTotalTrusts] = useState(0);
  const [trustsThisMonth, setTrustsThisMonth] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  const [schoolsThisMonth, setSchoolsThisMonth] = useState(0);
  const [totalIdsGenerated, setTotalIdsGenerated] = useState(0); // New state for total IDs generated
  const [totalCreditsAllocated, setTotalCreditsAllocated] = useState(0); // New state for total credits allocated

  useEffect(() => {
    const fetchTrusts = async () => {
      try {
        const data = await trustService.getAllTrusts();
        if (data && data.success && Array.isArray(data.data)) {
          setTotalTrusts(data.data.length);

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const newTrustsThisMonth = data.data.filter((trust: any) => {
            const createdAt = new Date(trust.created_at);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
          }).length;
          setTrustsThisMonth(newTrustsThisMonth);
        }
      } catch (error) {
        console.error('Failed to fetch trusts:', error);
      }
    };

    const fetchSchools = async () => {
      try {
        const data = await schoolService.getAllSchools();
        if (data && data.success && Array.isArray(data.data)) {
          setTotalSchools(data.data.length);

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const newSchoolsThisMonth = data.data.filter((school: any) => {
            const createdAt = new Date(school.created_at);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
          }).length;
          setSchoolsThisMonth(newSchoolsThisMonth);
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      }
    };

    fetchTrusts();
    fetchSchools();

    const fetchCreditSummary = async () => {
      try {
        const response = await axiosInstance.get('/api/superadmin/credit-summary-all');
        if (response.data && response.data.success) {
          const { total_ids_generated, total_allocated } = response.data.data;
          setTotalIdsGenerated(total_ids_generated);
          setTotalCreditsAllocated(total_allocated);
        }
      } catch (error) {
        console.error('Failed to fetch credit summary:', error);
      }
    };

    fetchCreditSummary();
  }, []);

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="animate-slide-down">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('dashboard.platformTitle')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('dashboard.platformWelcome')}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <Link
          to="/dashboard/trusts"
          className="block no-underline hover:no-underline shadow-lg rounded-xl"
        >
          <Card>
            <MetricCard
              title={t('dashboard.totalTrusts')}
              value={totalTrusts.toString()}
              icon={Building2}
              trend={`+${trustsThisMonth} ${t('dashboard.thisMonth')}`}
              trendUp={trustsThisMonth > 0}
            />
          </Card>
        </Link>
        <Link
          to="/dashboard/schools"
          className="block no-underline hover:no-underline shadow-lg rounded-xl"
        >
          <Card>
            <MetricCard
              title={t('dashboard.totalSchools')}
              value={totalSchools.toString()}
              icon={GraduationCap}
              trend={`+${schoolsThisMonth} ${t('dashboard.thisMonth')}`}
              trendUp={schoolsThisMonth > 0}
            />
          </Card>
        </Link>
        <Link
          to="/dashboard/credits"
          className="block no-underline hover:no-underline shadow-lg rounded-xl"
        >
          <Card>
            <MetricCard
              title={t('dashboard.totalIdsGenerated')}
              value={totalIdsGenerated.toString()} // Use dynamic data
              icon={FileText}
              trend={`+2,341 ${t('dashboard.thisWeek')}`} // Comment out hardcoded trend
              trendUp={true}
            />
          </Card>
        </Link>
        <Link
          to="/dashboard/credits"
          className="block no-underline hover:no-underline shadow-lg rounded-xl"
        >
          <Card>
            <MetricCard
              title={t('dashboard.totalCredits')}
              value={totalCreditsAllocated.toString()} // Use dynamic data
              icon={CreditCard}
              trend={`+8,500 ${t('dashboard.thisMonth')}`} // Comment out hardcoded trend
              trendUp={true}
            />
          </Card>
        </Link>
        {/*
        <MetricCard
          title="Active Schools"
          value="148"
          icon={TrendingUp}
          trend="94.9% active"
          trendUp={true}
        />
        */}
        {/*
        <MetricCard
          title="Total Revenue"
          value="₹1,04,000"
          icon={DollarSign}
          trend="This month"
          trendUp={true}
        />
        */}
      </div>

      {/* Daily ID Generation Trend Chart */}
      <Card className="border-1 shadow-xl bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                {t('dashboard.generationTrend')}
              </CardTitle>
              <p className="text-sm text-gray-600">{t('dashboard.trackGeneration')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-36 h-9 border-2 border-orange-400 hover:border-orange-600 focus:ring-2 focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">{t('dashboard.last7Days')}</SelectItem>
                  <SelectItem value="30days">{t('dashboard.last30Days')}</SelectItem>
                  <SelectItem value="90days">{t('dashboard.last90Days')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTrust} onValueChange={setSelectedTrust}>
                <SelectTrigger className="w-full sm:w-44 h-9 border-2 border-green-400 hover:border-green-600 focus:ring-2 focus:ring-green-500/20">
                  <SelectValue placeholder={t('dashboard.allTrusts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.allTrusts')}</SelectItem>
                  <SelectItem value="trust1">Cambridge Trust</SelectItem>
                  <SelectItem value="trust2">Oxford Academy Trust</SelectItem>
                  <SelectItem value="trust3">London Schools Trust</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-full sm:w-44 h-9 border-2 border-green-400 hover:border-green-400 focus:ring-2 focus:ring-green-500/20">
                  <SelectValue placeholder={t('dashboard.allSchools')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.allSchools')}</SelectItem>
                  <SelectItem value="school1">St. Mary's Primary</SelectItem>
                  <SelectItem value="school2">King's High School</SelectItem>
                  <SelectItem value="school3">Greenfield Academy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #505662',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="generated"
                  stroke="url(#colorGradient)"
                  strokeWidth={3}
                  name={t('dashboard.idsGenerated')}
                  dot={{ fill: '#f85000', r: 6, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00f25a" />
                    <stop offset="20%" stopColor="#00cc4c" />
                    <stop offset="100%" stopColor="#00a63e" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
