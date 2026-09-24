import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ArrowLeft, Mail, Phone, BookOpen, Users, Edit } from 'lucide-react';
import { teachersApi, Teacher } from '@/api/teachers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '../../ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function TeacherDetail() {
  const { t, i18n } = useTranslation();
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (teacherId && userData?.id) {
      fetchTeacherDetail();
    }
  }, [teacherId, userData]);

  const fetchTeacherDetail = async () => {
    try {
      if (!userData?.id || !teacherId) {
        console.warn('TeacherDetail: userData.id or teacherId is missing', {
          schoolId: userData?.id,
          teacherId
        });
        return;
      }

      setLoading(true);
      // console.log('TeacherDetail: Fetching teachers for school:', userData.id);
      const response = await teachersApi.getAll(userData.id);

      // console.log('TeacherDetail: API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        // Use string comparison to be robust against number/string ID types
        const foundTeacher = response.data.find(
          (t: Teacher) => String(t.id) === String(teacherId)
        );

        if (foundTeacher) {
          setTeacher(foundTeacher);
          // Use subject as the teacher's class assignment
          if (foundTeacher.subject) {
            setClasses([{ id: foundTeacher.id, class_name: foundTeacher.subject }]);
          }
        } else {
          console.error(`TeacherDetail: Teacher with ID ${teacherId} not found in school ${userData.id}'s list of ${response.data.length} teachers`);
          toast.error(t('teacherDetail.notFound'));
          navigate('/school-dashboard/teachers');
        }
      } else {
        console.error('TeacherDetail: API returned error or non-array data', response);
      }
    } catch (error: any) {
      console.error('TeacherDetail: Error fetching teacher detail:', error);
      toast.error(error.response?.data?.message || t('teacherDetail.messages.fetchError'));
      navigate('/school-dashboard/teachers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">{t('teacherDetail.notFound')}</p>
            <Button onClick={() => navigate('/school-dashboard/teachers')} className="mt-4">
              {t('teacherDetail.backToTeachers')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <div className="flex flex-row md:items-center justify-between mb-8 md:mb-10 gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/school-dashboard/teachers')}
            className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('teacherDetail.backButton')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">{t('teacherDetail.title')}</p>
          </div>
        </div>
        {/* <Button variant="outline" onClick={() => navigate(`/school-dashboard/teachers?edit=${teacher.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button> */}
      </div>

      {/* Basic Information */}
      <Card className="mb-6 border shadow-xl rounded-xl w-fit mx-auto">
        <CardHeader className="bg-gray-300 rounded-t-xl">
          <CardTitle className="text-xl font-semibold">{t('teacherDetail.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.name')}</Label>
              <p className="font-medium mt-1 text-gray-600">{teacher.name}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.email')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-red-400" />
                <p className="font-medium text-gray-600">{teacher.email}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.phone')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-green-700" />
                <p className="font-medium text-gray-600">{teacher.phone || t('teacherDetail.na')}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.subject')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <p className="font-medium text-gray-600">{teacher.subject || t('teacherDetail.na')}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.status')}</Label>
              <Badge
                variant="outline"
                className={`mt-1 ${teacher.status === 'Active'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
              >
                {teacher.status === 'Active'
                  ? t('teacherDetail.active')
                  : teacher.status === 'Inactive'
                    ? t('teacherDetail.inactive')
                    : (teacher.status || t('teacherDetail.active'))}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-900">{t('teacherDetail.createdAt')}</Label>
              <p className="font-medium mt-1 text-gray-600">
                {teacher.created_at
                  ? new Date(teacher.created_at).toLocaleDateString(i18n.language)
                  : t('teacherDetail.na')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Classes */}
      {/* {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('teacherDetail.assignedClasses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map((classItem: any) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t(`classes.${classItem.class_name}`, classItem.class_name)}</p>
                      {classItem.division_name && (
                        <p className="text-sm text-gray-600">
                          {t('teacherDetail.division', { divisionName: classItem.division_name })}
                        </p>
                      )}
                    </div>
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}
