import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Users,
  GraduationCap,
  Eye,
  Edit,
  KeyRound,
  EyeOff,
} from 'lucide-react';
import { trustSchoolApi } from '@/api/trust/schools';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { useTranslation } from 'react-i18next';

interface SchoolDetail {
  id: number;
  custom_id: string;
  school_name: string;
  school_code: string;
  section: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  classes?: Array<{
    id: number;
    class_name: string;
    divisions: Array<{
      id: number;
      division_name: string;
      class_teacher: string;
      expected_students: number;
    }>;
  }>;
}

export function TrustSchoolDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSchoolDetail();
    }
  }, [id]);

  const fetchSchoolDetail = async () => {
    try {
      setLoading(true);
      const response = await trustSchoolApi.getSchoolById(parseInt(id!));
      if (response.success) {
        setSchool(response.data);
      } else {
        toast.error(t('schoolDetail.fetchFailed'));
        navigate('/super-dashboard/super-schools');
      }
    } catch (error: any) {
      console.error('Error fetching school detail:', error);
      toast.error(error.response?.data?.message || t('schoolDetail.fetchFailed'));
      navigate('/super-dashboard/super-schools');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCredentials = async () => {
    try {
      const response = await trustSchoolApi.getSchoolCredentials(parseInt(id!));
      if (response.success) {
        setCredentials(response.data);
        setIsCredentialsDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      toast.error(error.response?.data?.message || t('schoolDetail.credentialsFetchFailed'));
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    const text = `School Name: ${credentials.school_name}\nEmail: ${credentials.email}\nSchool Code: ${credentials.school_code}\nSection: ${credentials.section}\nLogin URL: ${credentials.login_url}`;
    navigator.clipboard.writeText(text);
    toast.success(t('schoolDetail.credentialsCopied'));
  };

  const handleSendCredentials = async () => {
    try {
      await trustSchoolApi.sendSchoolCredentials(parseInt(id!), credentials.email);
      toast.success(t('schoolDetail.credentialsSent'));
    } catch (error: any) {
      console.error('Error sending credentials:', error);
      toast.error(error.response?.data?.message || t('schoolDetail.credentialsSendFailed'));
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error(t('schoolDetail.enterPassword'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('schoolDetail.passwordMinLength'));
      return;
    }

    try {
      await trustSchoolApi.resetSchoolPassword(parseInt(id!), newPassword, false);
      toast.success(t('schoolDetail.passwordReset'));
      setResetPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || t('schoolDetail.passwordResetFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">{t('schoolDetail.schoolNotFound')}</p>
            <Button onClick={() => navigate('/super-dashboard/super-schools')} className="mt-4">
              {t('schoolDetail.backToSchools')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalClasses = school.classes?.length || 0;
  const totalDivisions =
    school.classes?.reduce((sum, cls) => sum + (cls.divisions?.length || 0), 0) || 0;

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/super-dashboard/super-schools')}
            className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('schoolDetail.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{school.school_name}</h1>
            <p className="text-base md:text-lg text-gray-600 font-medium">
              {t('schoolDetail.schoolDetails')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleViewCredentials}
            className="flex items-center text-orange-600 border border-orange-600 hover:bg-orange-500 hover:text-white group"
          >
            <Eye className="w-4 h-4 mr-2 group-hover:scale-130" />
            {t('schoolDetail.credentials')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/super-dashboard/edit-school/${school.id}`)}
            className="flex items-center text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
          >
            <Edit className="w-4 h-4 mr-2 group-hover:scale-130" />
            {t('schoolDetail.edit')}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        <Card className="lg:col-span-3 rounded-2xl border border-gray-300 shadow-lg h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">{t('schoolDetail.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-sm">
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.schoolName')}</Label>
                <p className="font-medium mt-1 ml-4">{school.school_name}</p>
              </div>
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.schoolCode')}</Label>
                <p className="font-medium mt-1 ml-4">{school.custom_id}</p>
              </div>
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.section')}</Label>
                <Badge variant="outline" className="mt-1 ml-4">
                  {school.section || t('schoolDetail.na')}
                </Badge>
              </div>
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.email')}</Label>
                <div className="flex items-center gap-2 mt-1 ml-4">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{school.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.phone')}</Label>
                <div className="flex items-center gap-2 mt-1 ml-4">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{school.phone || t('schoolDetail.na')}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-black font-semibold">{t('schoolDetail.address')}</Label>
                <div className="flex items-start gap-2 mt-1 ml-4">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">{school.address || t('schoolDetail.na')}</p>
                    {school.city && (
                      <p className="text-sm text-gray-600 mt-1 ml-4">
                        {school.city}, {school.state} {school.pincode && `- ${school.pincode}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-black font-semibold">{t('schoolDetail.createdAt')}</Label>
                <p className="font-medium mt-1 ml-4">
                  {new Date(school.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes & Divisions */}
        <Card className="lg:col-span-2 rounded-2xl border border-gray-300 shadow-lg h-[80vh]">
          <CardHeader className="pb-2">
            <div className="flex flex-col items-center justify-between">
              <CardTitle className="text-xl font-semibold mb-4">
                {t('schoolDetail.classesDivisions')}
              </CardTitle>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super-dashboard/schools/${school.id}/classes`)}
                  className="flex items-center text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('schoolDetail.manageClasses')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super-dashboard/schools/${school.id}/teachers`)}
                  className="flex items-center text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {t('schoolDetail.manageTeachers')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto px-6">
            {school.classes && school.classes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('schoolDetail.totalClasses')}</span>
                    <span className="font-medium ml-2">{totalClasses}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('schoolDetail.totalDivisions')}</span>
                    <span className="font-medium ml-2">{totalDivisions}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {school.classes.map((classItem) => (
                    <div key={classItem.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{classItem.class_name}</h4>
                        <Badge variant="outline">
                          {classItem.divisions?.length || 0}{' '}
                          {classItem.divisions?.length !== 1
                            ? t('schoolDetail.divisions')
                            : t('schoolDetail.division')}
                        </Badge>
                      </div>
                      {classItem.divisions && classItem.divisions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {classItem.divisions.map((division) => (
                            <div
                              key={division.id}
                              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                            >
                              <span className="font-medium">{division.division_name}</span>
                              <div className="flex gap-4 text-gray-600">
                                <span>
                                  {t('schoolDetail.teacher')}{' '}
                                  {division.class_teacher || t('schoolDetail.notAssigned')}
                                </span>
                                <span>
                                  {t('schoolDetail.students')} {division.expected_students || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('schoolDetail.noClasses')}</p>
            )}
          </CardContent>
        </Card>

        {/* Credentials Dialog */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('schoolDetail.schoolCredentials')}</DialogTitle>
            </DialogHeader>
            {credentials && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">{t('schoolDetail.schoolName')}</Label>
                    <p className="font-medium">{credentials.school_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{t('schoolDetail.email')}</Label>
                    <p className="font-medium">{credentials.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{t('schoolDetail.schoolCode')}</Label>
                    <p className="font-medium">{credentials.school_code}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{t('schoolDetail.section')}</Label>
                    <p className="font-medium">{credentials.section || t('schoolDetail.na')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{t('schoolDetail.loginUrl')}</Label>
                    <p className="font-medium text-sm break-all">{credentials.login_url}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{credentials.note}</div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {t('schoolDetail.resetPassword')}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyCredentials}
                className="w-full sm:w-auto"
              >
                {t('schoolDetail.copy')}
              </Button>
              <Button onClick={handleSendCredentials} className="w-full sm:w-auto">
                {t('schoolDetail.sendEmail')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('schoolDetail.resetSchoolPassword')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('schoolDetail.newPassword')}</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('schoolDetail.newPasswordPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setNewPassword('');
                }}
              >
                {t('schoolDetail.cancel')}
              </Button>
              <Button onClick={handleResetPassword}>{t('schoolDetail.resetPassword')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
