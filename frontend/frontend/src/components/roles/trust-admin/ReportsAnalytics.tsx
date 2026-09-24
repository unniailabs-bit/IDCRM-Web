import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, Users, CreditCard, FileText, Loader2 } from 'lucide-react';
import {
  analyticsApi,
  AnalyticsOverview,
  MonthlyTrend,
  SchoolPerformance,
  CreditDistribution,
  IdCardStatus,
} from '@/api/analytics';
import { toast } from 'sonner';

export function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [schoolPerformanceData, setSchoolPerformanceData] = useState<SchoolPerformance[]>([]);
  const [creditDistributionData, setCreditDistributionData] = useState<CreditDistribution[]>([]);
  const [idCardStatusData, setIdCardStatusData] = useState<IdCardStatus[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [overviewRes, monthlyRes, schoolRes, creditRes, idCardRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getMonthlyTrends(),
        analyticsApi.getSchoolPerformance(),
        analyticsApi.getCreditDistribution(),
        analyticsApi.getIdCardStatus(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (monthlyRes.success) setMonthlyData(monthlyRes.data);
      if (schoolRes.success) setSchoolPerformanceData(schoolRes.data);
      if (creditRes.success) setCreditDistributionData(creditRes.data);
      if (idCardRes.success) setIdCardStatusData(idCardRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (reportType: string) => {
    alert(`Exporting ${reportType} report...`);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Reports & Analytics
            </h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">
              Comprehensive analytics and performance metrics
            </p>
          </div>
          <button
            className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          >
            <Download className="w-7 h-7" />
            Export All Reports
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-xl rounded-xl border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-gray-900 text-2xl font-semibold">
                      {formatNumber(overview?.totalStudents || 0)}
                    </p>
                    {overview && overview.studentsGrowth > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ↑ {overview.studentsGrowth}% from last month
                      </p>
                    )}
                    {overview && overview.studentsGrowth < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        ↓ {Math.abs(overview.studentsGrowth)}% from last month
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl rounded-xl border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Credits Used</p>
                    <p className="text-gray-900 text-2xl font-semibold">
                      {formatNumber(overview?.creditsUsed || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Remaining: {formatNumber(overview?.creditsRemaining || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl rounded-xl border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ID Cards Generated</p>
                    <p className="text-gray-900 text-2xl font-semibold">
                      {formatNumber(overview?.totalIdCards || 0)}
                    </p>
                    {overview && overview.idCardsGrowth > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ↑ {overview.idCardsGrowth}% this month
                      </p>
                    )}
                    {overview && overview.idCardsGrowth < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        ↓ {Math.abs(overview.idCardsGrowth)}% this month
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl rounded-xl border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                    <p className="text-gray-900 text-2xl font-semibold">
                      {overview?.successRate || 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(overview?.totalSchools || 0)} Schools,{' '}
                      {formatNumber(overview?.totalTeachers || 0)} Teachers
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Trends */}
            <Card className="shadow-xl border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Monthly Trends (Last 6 Months)</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('Monthly Trends')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="students"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Students"
                      />
                      <Line
                        type="monotone"
                        dataKey="idCards"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="ID Cards"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* School Performance */}
            <Card className="shadow-xl border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>School-wise Performance</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('School Performance')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {schoolPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={schoolPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="school" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="students" fill="#3b82f6" name="Students" />
                      <Bar dataKey="creditsUsed" fill="#f97316" name="Credits Used" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Credit Distribution */}
            <Card className="shadow-xl border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Credit Distribution</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('Credit Distribution')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {creditDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={creditDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${formatNumber(value)} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {creditDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID Card Status */}
            <Card className="shadow-xl border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>ID Card Status</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('ID Card Status')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {idCardStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={idCardStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${formatNumber(value)} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {idCardStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Quick Reports</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('School-wise Summary')}
                >
                  <FileText className="w-6 h-6" />
                  School-wise Summary
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('Credit Usage Report')}
                >
                  <CreditCard className="w-6 h-6" />
                  Credit Usage Report
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('Student Statistics')}
                >
                  <Users className="w-6 h-6" />
                  Student Statistics
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('ID Card Report')}
                >
                  <FileText className="w-6 h-6" />
                  ID Card Report
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('Monthly Performance')}
                >
                  <TrendingUp className="w-6 h-6" />
                  Monthly Performance
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-green-700 hover:text-green-800 hover:bg-green-100
                   hover:border-green-200 border cursor-pointer"
                  onClick={() => handleExport('Financial Summary')}
                >
                  <CreditCard className="w-6 h-6" />
                  Financial Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
