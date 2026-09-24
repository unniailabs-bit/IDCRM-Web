
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ArrowLeft, Mail, Phone, BookOpen, Clock } from 'lucide-react';
import { trustSchoolApi } from '@/api/trust/schools';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '../../ui/label';
import { useTranslation } from 'react-i18next';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export function TrustSchoolTeacherDetail() {
  const { t } = useTranslation();
  const { schoolId, teacherId } = useParams<{ schoolId: string; teacherId: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && teacherId) {
      fetchTeacherDetail();
    }
  }, [schoolId, teacherId]);

  const fetchTeacherDetail = async () => {
    try {
      setLoading(true);
      if (!schoolId) return;

      const response = await trustSchoolApi.getTeachers(parseInt(schoolId));
      if (response.success && response.data) {
        // Find the teacher from the list since we don't have a direct getTeacherById API yet
        const foundTeacher = (response.data as any[]).find((t: any) => t.id === parseInt(teacherId!));

        if (foundTeacher) {
          setTeacher(foundTeacher);
        } else {
          toast.error(t('trustTeacherDetail.notFound'));
          navigate(`/super-dashboard/schools/${schoolId}/teachers`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching teacher detail:', error);
      toast.error(error.response?.data?.message || t('trustTeacherDetail.fetchFailed'));
      navigate(`/super-dashboard/schools/${schoolId}/teachers`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">{t('trustTeacherDetail.teacherNotFound')}</p>
            <Button
              onClick={() => navigate(`/super-dashboard/schools/${schoolId}/teachers`)}
              className="mt-4"
            >
              {t('trustTeacherDetail.backToTeachers')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/super-dashboard/schools/${schoolId}/teachers`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('trustTeacherDetail.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
              <p className="text-gray-600 mt-1">{t('trustTeacherDetail.teacherDetails')}</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('trustTeacherDetail.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.name')}</Label>
                <p className="font-medium mt-1">{teacher.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.email')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{teacher.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.phone')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{teacher.phone || t('trustTeacherDetail.na')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.subject')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{teacher.subject || t('trustTeacherDetail.na')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.status')}</Label>
                <div className="mt-1">
                  <Badge
                    className={
                      teacher.status === 'Active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {teacher.status === 'Active'
                      ? t('trustTeacherDetail.active')
                      : t('trustTeacherDetail.inactive')}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('trustTeacherDetail.lastUpdated')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">
                    {teacher.updated_at
                      ? new Date(teacher.updated_at).toLocaleDateString()
                      : t('trustTeacherDetail.na')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
