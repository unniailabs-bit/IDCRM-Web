import { useEffect, useState } from 'react';
import axios from 'axios';
import { MetricCard } from '../../common/MetricCard';
import { Users, FormInput, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { TeacherFormReviewTable } from './TeacherFormReviewTable';

export function TeacherDashboard() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<any>(null);
  const [studentForms, setStudentForms] = useState<any[]>([]);

  const token = localStorage.getItem('token');
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // =========================================
  // 🔥 APPROVE API FUNCTION
  // =========================================
  const handleApprove = async (formId: number) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/teacher/student-forms/${formId}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // UI Update (without reload)
      setStudentForms((prev) =>
        prev.map((f) => (f.id === formId ? { ...f, status: 'approved' } : f))
      );
    } catch (error) {
      console.error('Error approving form:', error);
    }
  };

  // =========================================
  // FETCH DATA
  // =========================================
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [classRes, formRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/teacher/myclass/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/teacher/student-forms`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setDashboard(classRes.data.data);
        setStudentForms(formRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [token, BACKEND_URL]);

  if (!dashboard) return <p className="p-4">{t('teacherDashboard.loading')}</p>;

  const totalStudents = dashboard.totalStudents || 0;
  const teacherName = dashboard.teacherName || '';
  const divisions = dashboard.divisions || [];

  const formsReceived = studentForms.length;
  const approved = studentForms.filter((f) => f.status === 'approved').length;
  const pending = studentForms.filter((f) => f.status === 'submitted').length;

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('teacherDashboard.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">{t('teacherDashboard.welcome', { name: teacherName })}</p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('teacherDashboard.myClasses')}
            value={divisions.length}
            icon={Users}
            trend={t('teacherDashboard.totalStudentsCount', { count: totalStudents })}
            variant="indigo"
          />
        </Card>

        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('teacherDashboard.formsReceived')}
            value={formsReceived}
            icon={FormInput}
            trend={t('teacherDashboard.studentsSubmitted')}
            trendUp={true}
            variant="indigo"
          />
        </Card>

        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('teacherDashboard.approvedForms')}
            value={approved}
            icon={CheckCircle}
            trend={t('teacherDashboard.completedForms')}
            trendUp={true}
            variant="indigo"
          />{' '}
        </Card>

        <Card className="shadow-xl rounded-xl">
          <MetricCard
            title={t('teacherDashboard.pendingApprovals')}
            value={pending}
            icon={Clock}
            trend={t('teacherDashboard.needsReview')}
            variant="indigo"
          />
        </Card>
      </div>

      {/* My Classes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{t('teacherDashboard.myClasses')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {divisions.map((div: any) => (
              <div key={div.division_id} className="p-4 border rounded-lg">
                <h3 className="mb-3 text-gray-900 font-semibold text-lg text-center py-1 bg-gray-200 border rounded-sm">
                  {div.class_name}-{div.division_name}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('teacherDashboard.totalStudents')}</span>
                    <span>{div.student_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('teacherDashboard.formsReceived')}:</span>
                    <span className="text-indigo-600">{formsReceived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('studentForms.approved')}:</span>
                    <span>{approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('teacherClasses.pending')}:</span>
                    <Badge className="bg-orange-100 text-orange-800">{pending}</Badge>
                  </div>
                </div>

                {/* <Button
                  className="w-full mt-4 hover:bg-indigo-100 hover:text-indigo-600"
                  variant="outline"
                >
                  {t('teacherDashboard.viewDetails')}
                </Button> */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Forms Review Table */}
      {/* <TeacherFormReviewTable /> */}
    </div>
  );
}
