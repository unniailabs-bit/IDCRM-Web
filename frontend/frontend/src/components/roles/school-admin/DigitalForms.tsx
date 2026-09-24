import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
  Eye,
  CreditCard,
  Download,
  Search,
  Filter,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { summaryService } from '@/api/summaryService';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';


interface StudentData {
  id?: string | number;
  'Form ID'?: string | number;
  'Roll No': string;
  'Student Name': string;
  DOB: string;
  Blood: string;
  Address: string;
  'Father Name': string;
  'Father Phone': string;
  'Mother Name': string;
  'Mother Phone': string;
  Emergency: string;
  Status: string;
}

interface ClassDivision {
  id: string;
  class: string;
  division: string;
  class_teacher?: string;
  totalStudents: number;
  submittedForms: number;
  teacherApproved: number;
  adminApproved: number;
  pending?: number;
  rejected?: number;
  students: StudentData[];
}

interface SummaryStats {
  submittedForms: number;
  adminApproved: number;
  readyForIds: number;
  pending: number;
  rejected: number;
  totalStudents: number;
}

const COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  submitted: '#3b82f6',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DigitalForms() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const navigate = useNavigate();


  const [classData, setClassData] = useState<ClassDivision[]>([]);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [filteredClassData, setFilteredClassData] = useState<ClassDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    submittedForms: 0,
    adminApproved: 0,
    readyForIds: 0,
    pending: 0,
    rejected: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.id) return;

      setLoading(true);
      try {
        const summaryResponse = await summaryService.getSchoolSummary();
        const csvData = await summaryService.getSchoolSummaryCsv();

        let students: StudentData[] = [];

        if (csvData && typeof csvData === 'string') {
          const workbook = XLSX.read(csvData, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          students = XLSX.utils.sheet_to_json<StudentData>(worksheet, { raw: false });
        }

        setAllStudents(students);

        if (summaryResponse.success && Array.isArray(summaryResponse.data)) {
          const formattedClassData = summaryResponse.data.map((item: any) => {
            // Filter students for this specific class and division
            const classStudents = students.filter((student: any) => {
              const studentClass = String(student.Class || student.class_name || '').trim();
              const studentDivision = String(student.Division || student.division || '').trim();
              const itemClass = String(item.class_name || '').trim();
              const itemDivision = String(item.division || '').trim();

              return studentClass === itemClass && studentDivision === itemDivision;
            });

            return {
              id: `${item.class_name}-${item.division}-${item.class_teacher}`,
              class: item.class_name,
              division: item.division,
              class_teacher: item.class_teacher,
              totalStudents: item.total_forms || 0,
              submittedForms: item.total_forms || 0,
              teacherApproved: item.approved || 0,
              adminApproved: item.approved || 0,
              pending: item.pending || 0,
              rejected: item.rejected || 0,
              students: classStudents,
            };
          });

          setClassData(formattedClassData);
          setFilteredClassData(formattedClassData);

          const aggregates = formattedClassData.reduce(
            (acc, curr) => {
              acc.submittedForms += curr.submittedForms || 0;
              acc.adminApproved += curr.adminApproved || 0;
              acc.readyForIds += curr.adminApproved || 0;
              acc.pending += curr.pending || 0;
              acc.rejected += curr.rejected || 0;
              acc.totalStudents += curr.totalStudents || 0;
              return acc;
            },
            {
              submittedForms: 0,
              adminApproved: 0,
              readyForIds: 0,
              pending: 0,
              rejected: 0,
              totalStudents: 0,
            }
          );

          setSummaryStats(aggregates);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error(t('digitalForms.messages.loadError'));
      } finally {

        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClassData(classData);
    } else {
      const filtered = classData.filter(
        (item) =>
          item.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.class_teacher?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClassData(filtered);
    }
  }, [searchQuery, classData]);

  const calculateProgress = (classDiv: ClassDivision) => {
    const submissionRate =
      classDiv.totalStudents > 0 ? (classDiv.submittedForms / classDiv.totalStudents) * 100 : 0;
    const teacherApprovalRate =
      classDiv.submittedForms > 0 ? (classDiv.teacherApproved / classDiv.submittedForms) * 100 : 0;
    const adminApprovalRate =
      classDiv.submittedForms > 0 ? (classDiv.adminApproved / classDiv.submittedForms) * 100 : 0;

    return {
      submission: Math.round(submissionRate),
      teacherApproval: Math.round(teacherApprovalRate),
      adminApproval: Math.round(adminApprovalRate),
    };
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allStudents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'all_students.xlsx');
    toast.success(t('digitalForms.messages.exportSuccess'));
  };


  const handleViewSheet = (classDiv: ClassDivision) => {
    navigate('/school-dashboard/student-data-sheet', {
      state: {
        selectedClass: classDiv,
        allStudents: allStudents,
      },
    });
  };

  const handleGenerateIDs = (classDiv: ClassDivision) => {
    // Navigate directly to template gallery for ID card generation
    navigate('/school-dashboard/id-template', {
      state: { classDiv },
    });
  };

  // Prepare chart data
  const statusDistributionData = [
    {
      name: t('digitalForms.charts.labels.approved'),
      value: summaryStats.adminApproved,
      color: COLORS.approved,
    },
    {
      name: t('digitalForms.charts.labels.pending'),
      value: summaryStats.pending,
      color: COLORS.pending,
    },
    {
      name: t('digitalForms.charts.labels.rejected'),
      value: summaryStats.rejected,
      color: COLORS.rejected,
    },
  ];


  const classComparisonData = filteredClassData.map((item) => ({
    name: `${item.class}-${item.division}`,
    submitted: item.submittedForms,
    approved: item.adminApproved,
    pending: item.pending || 0,
  }));


  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const overallCompletionRate =
    summaryStats.totalStudents > 0
      ? ((summaryStats.adminApproved / summaryStats.totalStudents) * 100).toFixed(1)
      : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('digitalForms.title')}</h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">{t('digitalForms.subtitle')}</p>
          </div>
          <button
            onClick={exportToExcel}
            className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-violet-400 via-violet-600 to-violet-600
          hover:from-violet-400 hover:via-violet-600 hover:to-violet-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          >
            <Download className="w-7 h-7" />
            {t('digitalForms.exportButton')}
          </button>
        </div>


        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('digitalForms.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('digitalForms.stats.totalStudents')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(summaryStats.totalStudents)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('digitalForms.stats.totalStudentsDesc')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">

                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('digitalForms.stats.formsSubmitted')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(summaryStats.submittedForms)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryStats.totalStudents > 0
                    ? t('digitalForms.stats.submissionRate', {
                      rate: ((summaryStats.submittedForms / summaryStats.totalStudents) * 100).toFixed(1),
                    })
                    : t('digitalForms.stats.submissionRate', { rate: '0' })}
                </p>
              </div>

              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('digitalForms.stats.adminApproved')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(summaryStats.adminApproved)}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t('digitalForms.stats.completion', { rate: overallCompletionRate })}
                </p>
              </div>

              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('digitalForms.stats.readyForIds')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(summaryStats.readyForIds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('digitalForms.stats.readyForIdsDesc')}</p>
              </div>

              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              {t('digitalForms.charts.statusDistribution')}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {statusDistributionData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
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
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                {t('digitalForms.charts.noData')}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Class Comparison Bar Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('digitalForms.charts.classWiseStatus')}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {classComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Legend />
                  <Bar
                    dataKey="submitted"
                    fill="#3b82f6"
                    name={t('digitalForms.charts.labels.submitted')}
                  />
                  <Bar
                    dataKey="approved"
                    fill="#10b981"
                    name={t('digitalForms.charts.labels.approved')}
                  />
                  <Bar dataKey="pending" fill="#f59e0b" name={t('digitalForms.charts.labels.pending')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                {t('digitalForms.charts.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">{t('digitalForms.breakdown.approved')}</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(summaryStats.adminApproved)}
                </p>
              </div>

              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">{t('digitalForms.breakdown.pending')}</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatNumber(summaryStats.pending)}
                </p>
              </div>

              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">{t('digitalForms.breakdown.rejected')}</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatNumber(summaryStats.rejected)}
                </p>
              </div>

              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('digitalForms.overview.title')}
            {filteredClassData.length !== classData.length && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                ({filteredClassData.length} {t('digitalForms.overview.of')} {classData.length})
              </span>
            )}
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassData.map((classDiv) => {
            const progress = calculateProgress(classDiv);

            return (
              <Card
                key={classDiv.id}
                className="shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {classDiv.class} - {classDiv.division}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{t('digitalForms.overview.teacherLabel')}</span>{' '}
                        {classDiv.class_teacher || t('digitalForms.overview.notAvailableShort')}
                      </p>

                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{classDiv.totalStudents}</p>
                      <p className="text-xs text-gray-500">{t('digitalForms.overview.studentsLabel')}</p>
                    </div>

                  </div>

                  {/* Enhanced Progress Bars Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('digitalForms.overview.progressMetrics')}
                    </h4>


                    <div className="space-y-5">
                      {/* Submission Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {t('digitalForms.overview.submissionRateLabel')}
                            </span>
                          </div>

                          <span className="text-sm font-bold text-blue-600">
                            {progress.submission}%
                          </span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                              style={{ width: `${progress.submission}%` }}
                            >
                              <div className="absolute inset-0 animate-shimmer"></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {t('digitalForms.overview.submittedCount', {
                                count: classDiv.submittedForms,
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {t('digitalForms.overview.remainingCount', {
                                count: classDiv.totalStudents - classDiv.submittedForms,
                              })}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Approval Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {t('digitalForms.overview.approvalRateLabel')}
                            </span>
                          </div>

                          <span className="text-sm font-bold text-green-600">
                            {progress.adminApproval}%
                          </span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                              style={{ width: `${progress.adminApproval}%` }}
                            >
                              <div className="absolute inset-0 animate-shimmer"></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {t('digitalForms.overview.approvedCount', {
                                count: classDiv.adminApproved,
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {t('digitalForms.overview.pendingCount', {
                                count: classDiv.submittedForms - classDiv.adminApproved,
                              })}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Total Approved Count */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">
                              {t('digitalForms.overview.totalApprovedLabel')}
                            </span>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">
                              {classDiv.adminApproved}
                            </p>
                            <p className="text-xs text-green-600">
                              {classDiv.adminApproved === 0
                                ? t('digitalForms.overview.noApprovalsYet')
                                : t('digitalForms.overview.ofTotalStudents', {
                                  rate: ((classDiv.adminApproved / classDiv.totalStudents) * 100).toFixed(
                                    1
                                  ),
                                })}
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t('digitalForms.overview.statusApproved', { count: classDiv.adminApproved })}
                    </Badge>
                    {classDiv.pending && classDiv.pending > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('digitalForms.overview.statusPending', { count: classDiv.pending })}
                      </Badge>
                    )}
                    {classDiv.rejected && classDiv.rejected > 0 && (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('digitalForms.overview.statusRejected', { count: classDiv.rejected })}
                      </Badge>
                    )}
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white hover:text-white hover:scale-105"
                      onClick={() => handleViewSheet(classDiv)}
                    >
                      <Eye className="w-4 h-4 scale-130" />
                      {t('digitalForms.overview.viewButton')}
                    </Button>

                    {/* <Button
                      onClick={() => handleGenerateIDs(classDiv)}
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={classDiv.adminApproved === 0}
                    >
                      <CreditCard className="w-4 h-4 scale:130" />
                      Generate IDs
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredClassData.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">{t('digitalForms.emptyState')}</p>
          </Card>
        )}

      </div>
    </div >
  );
}
