import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
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
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  Calendar,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import * as XLSX from 'xlsx';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SchoolReports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('enrollment');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [formAnalyticsData, setFormAnalyticsData] = useState<any[]>([]);
  const [idCardData, setIdCardData] = useState<any[]>([]);
  const [teacherPerformanceData, setTeacherPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (dateRange === 'custom' && startDate && endDate) {
      loadReports();
    } else if (dateRange !== 'custom') {
      loadReports();
    }
  }, [reportType, dateRange, startDate, endDate]);

  const getDateRange = () => {
    const today = new Date();
    let start = new Date();

    switch (dateRange) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        start.setMonth(today.getMonth() - 1);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  };

  const loadReports = async () => {
    setLoading(true);
    const dates = getDateRange();

    try {
      if (reportType === 'enrollment') {
        const response = await axiosInstance.get('/api/school/reports/enrollment', {
          params: { startDate: dates.start, endDate: dates.end },
        });
        if (response.data.success) setEnrollmentData(response.data.data);
      } else if (reportType === 'forms') {
        const response = await axiosInstance.get('/api/school/reports/form-analytics', {
          params: { startDate: dates.start, endDate: dates.end },
        });
        if (response.data.success) setFormAnalyticsData(response.data.data);
      } else if (reportType === 'idcards') {
        const response = await axiosInstance.get('/api/school/reports/idcard-generation', {
          params: { startDate: dates.start, endDate: dates.end },
        });
        if (response.data.success) setIdCardData(response.data.data);
      } else if (reportType === 'teachers') {
        const response = await axiosInstance.get('/api/school/reports/teacher-performance');
        if (response.data.success) setTeacherPerformanceData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    // Implementation for export
    toast.info(`Exporting ${format.toUpperCase()}...`);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <div className="mb-6">
        <div className="justify-between flex items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Reports & Analytics
            </h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">
              Comprehensive reports and data insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 text-green-700 border-green-700 hover:bg-green-700 hover:text-white"
              onClick={() => handleExport('excel')}
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white"
              onClick={() => handleExport('pdf')}
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-md border rounded-xl">
        <CardContent className="pt-6 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrollment">Student Enrollment</SelectItem>
                  <SelectItem value="forms">Form Submissions</SelectItem>
                  <SelectItem value="idcards">ID Card Generation</SelectItem>
                  <SelectItem value="teachers">Teacher Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enrollment Report */}
          {reportType === 'enrollment' && (
            <Card className="shadow-md rounded-md border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Users className="w-5 h-5" />
                  Student Enrollment Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Students Enrolled"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    No data available for selected period
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Analytics */}
          {reportType === 'forms' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md rounded-md border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    Form Submission Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formAnalyticsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formAnalyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="approved" fill="#10b981" name="Approved" />
                        <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                        <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md rounded-md border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    Form Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formAnalyticsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Approved',
                              value: formAnalyticsData.reduce(
                                (sum, d) => sum + (parseInt(d.approved) || 0),
                                0
                              ),
                            },
                            {
                              name: 'Pending',
                              value: formAnalyticsData.reduce(
                                (sum, d) => sum + (parseInt(d.pending) || 0),
                                0
                              ),
                            },
                            {
                              name: 'Rejected',
                              value: formAnalyticsData.reduce(
                                (sum, d) => sum + (parseInt(d.rejected) || 0),
                                0
                              ),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
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
          )}

          {/* ID Card Generation */}
          {reportType === 'idcards' && (
            <Card className="shadow-md rounded-md border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  ID Card Generation Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {idCardData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={idCardData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        fill="#3b82f6"
                        name="ID Cards Generated"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="credits_used"
                        fill="#f59e0b"
                        name="Credits Used"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    No data available for selected period
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Teacher Performance */}
          {reportType === 'teachers' && (
            <Card className="shadow-md rounded-md border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Users className="w-5 h-5" />
                  Teacher Performance Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacherPerformanceData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-300">
                        <tr className="border-b">
                          <th className="text-left p-3">Teacher Name</th>
                          <th className="text-left p-3">Subject</th>
                          <th className="text-center p-3">Divisions</th>
                          <th className="text-center p-3">Students</th>
                          <th className="text-center p-3">Forms Reviewed</th>
                          <th className="text-center p-3">Forms Approved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherPerformanceData.map((teacher: any) => (
                          <tr key={teacher.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{teacher.name}</td>
                            <td className="p-3">{teacher.subject || 'N/A'}</td>
                            <td className="p-3 text-center">{teacher.divisions_assigned || 0}</td>
                            <td className="p-3 text-center">{teacher.students_managed || 0}</td>
                            <td className="p-3 text-center">{teacher.forms_reviewed || 0}</td>
                            <td className="p-3 text-center text-green-600 font-semibold">
                              {teacher.forms_approved || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
