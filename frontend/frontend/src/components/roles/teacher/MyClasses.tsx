import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Users, GraduationCap, FileText, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ClassInfo {
  id: string;
  class: string;
  division: string;
  subject: string;
  totalStudents: number;
  formsSubmitted: number;
  formsPending: number;
}

export function MyClasses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [classesData, setClassesData] = useState<ClassInfo[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const token = localStorage.getItem('token');
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Divisions Dashboard Data
        const dashboardRes = await axios.get(`${BACKEND_URL}/api/teacher/myclass/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dashboard = dashboardRes.data.data;
        setTeacherName(dashboard.teacherName);

        // 2️⃣ Student Forms (for count only)
        const formsRes = await axios.get(`${BACKEND_URL}/api/teacher/student-forms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const forms = formsRes.data.data;

        // 3️⃣ Mapping Data Format
        const formattedData = dashboard.divisions.map((d: any) => {
          const classForms = forms.filter(
            (f: any) => f.class_name === d.class_name && f.division_name === d.division_name
          );

          const submitted = classForms.filter(
            (f: any) => f.status === 'approved' || f.status === 'submitted'
          ).length;

          const pending = classForms.filter((f: any) => f.status === 'submitted').length;

          return {
            id: d.division_id.toString(),
            class: d.class_name,
            division: d.division_name,
            subject: t('teacherClasses.allSubjects'),
            totalStudents: d.student_count,
            formsSubmitted: submitted,
            formsPending: pending,
          };
        });

        setClassesData(formattedData);
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchData();
  }, [BACKEND_URL, token]);

  const totalStudents = classesData.reduce((s, c) => s + c.totalStudents, 0);
  const totalPending = classesData.reduce((s, c) => s + c.formsPending, 0);

  const handleViewDetails = (cls: ClassInfo) => {
    navigate('/teacher-dashboard/class-students', {
      state: {
        classInfo: {
          class: cls.class,
          division: cls.division,
        },
      },
    });
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          {t('teacherClasses.title')}
        </h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('teacherClasses.subtitle', { name: teacherName })}
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600 font-semibold mb-1">
                  {t('teacherClasses.totalClasses')}
                </p>
                <p className="text-gray-900 text-2xl font-bold">{classesData.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600 font-semibold mb-1">
                  {t('teacherClasses.totalStudents')}
                </p>
                <p className="text-gray-900 text-2xl font-bold">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600 font-semibold mb-1">
                  {t('teacherClasses.pendingForms')}
                </p>
                <p className="text-gray-900 text-2xl font-bold">{totalPending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Class Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classesData.map((cls) => (
          <Card key={cls.id} className="shadow-xl rounded-xl border">
            <CardHeader className="bg-indigo-500 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-white font-semibold">
                    {cls.class} - {t('teacherClasses.division')} {cls.division}
                  </CardTitle>
                  <p className="text-sm text-white mt-1">{cls.subject}</p>
                </div>
                {cls.formsPending > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    {cls.formsPending} {t('teacherClasses.pending')}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('teacherClasses.totalStudents')}:</span>
                  <span>{cls.totalStudents}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('teacherClasses.formsSubmitted')}</span>
                  <span className="text-green-600">{cls.formsSubmitted}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('teacherClasses.pendingReview')}</span>
                  <span className="text-orange-600">{cls.formsPending}</span>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{t('teacherClasses.submissionProgress')}</span>
                    <span>
                      {cls.totalStudents > 0
                        ? ((cls.formsSubmitted / cls.totalStudents) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{
                        width: `${cls.totalStudents > 0 ? (cls.formsSubmitted / cls.totalStudents) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* ── View Details Button ── */}
                <button
                  onClick={() => handleViewDetails(cls)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
