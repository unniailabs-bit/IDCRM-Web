import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pencil,
  Plus,
  Building2,
  Mail,
  Phone,
  Users,
  GraduationCap,
  Eye,
  Copy,
  Send,
  KeyRound,
  EyeOff,
} from 'lucide-react';
import { schoolService } from '@/api/schoolService';
import { trustService } from '@/api/trustService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface School {
  id: number;
  trust_id: number;
  school_name: string;
  trust_name: string;
  school_admin_name: string;
  email: string;
  phone: string;
  address: string;
  total_students: number;
  idsGenerated: number;
  creditsRemaining: number;
  status: 'Active' | 'Inactive';
  password: string;
  classes?: any[];
}

export function SchoolManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedSchoolForCredentials, setSelectedSchoolForCredentials] = useState<School | null>(
    null
  );
  const [credentials, setCredentials] = useState<any>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAllSchools();
      const formattedSchools = response.data.map((school: any) => ({
        ...school,
        status: 'Active',
        idsGenerated: Math.floor(Math.random() * school.total_students),
        creditsRemaining: Math.floor(Math.random() * 5000),
        password: school.password || '',
        classesSelected: school.classesSelected || [],
        divisions: school.divisions || {},
      }));
      setSchools(formattedSchools);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleAddSchool = () => {
    navigate('/dashboard/schools/create-school');
  };

  const handleEditSchool = (school: School) => {
    navigate(`/dashboard/schools/edit-school/${school.id}`);
  };

  const handleViewClasses = (school: School) => {
    navigate(`/dashboard/schools/${school.id}/classes`);
  };

  const handleViewTeachers = (school: School) => {
    navigate(`/dashboard/schools/${school.id}/teachers`);
  };

  const handleViewCredentials = async (school: School) => {
    try {
      setSelectedSchoolForCredentials(school);
      const response = await schoolService.getSchoolCredentials(school.id);
      if (response.success) {
        setCredentials(response.data);
        setIsCredentialsDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      toast.error(error.response?.data?.message || t('schools.fetchCredentialsError'));
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    const text = `School Name: ${credentials.school_name}\nEmail: ${credentials.email}\nSchool Code: ${credentials.school_code}\nSection: ${credentials.section}\nLogin URL: ${credentials.login_url}`;
    navigator.clipboard.writeText(text);
    toast.success(t('schools.credentialsCopied'));
  };

  const handleSendCredentials = async () => {
    if (!selectedSchoolForCredentials) return;
    try {
      await schoolService.sendSchoolCredentials(selectedSchoolForCredentials.id, {
        email: credentials.email,
      });
      toast.success(t('schools.credentialsSent'));
    } catch (error: any) {
      console.error('Error sending credentials:', error);
      toast.error(error.response?.data?.message || t('schools.fetchCredentialsError'));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedSchoolForCredentials || !newPassword) {
      toast.error(t('schools.enterNewPassword'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('schools.passwordMinLength'));
      return;
    }

    try {
      await schoolService.resetSchoolPassword(selectedSchoolForCredentials.id, {
        newPassword,
        sendEmail: false,
      });
      toast.success(t('schools.passwordResetSuccess'));
      setResetPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || t('schools.resetPasswordError'));
    }
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <div className="flex flex-row md:items-center justify-between mb-8 md:mb-10 gap-2">
        <div className="animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('schools.title')}</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {t('schools.subtitle')}
          </p>
        </div>
        {/* <button
          onClick={handleAddSchool}
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
        >
          <Plus className="w-7 h-7" />
          {schools.length > 0 ? t('schools.addSchool') : t('schools.addNewSchool')}
        </button> */}
      </div>

      <Card>
        {/* <CardHeader>
          <CardTitle className="text-center font-semibold text-xl">All Schools</CardTitle>
        </CardHeader> */}
        <CardContent
          className="relative w-full overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] lg:max-h-[80vh]
          border border-gray-200 rounded-lg sm:rounded-xl lg:rounded-l-2xl"
        >
          <Table className="w-full min-w-[1000px]">
            <TableHeader className="text-lg">
              <TableRow>
                <TableHead className="text-center">{t('schools.srNo')}</TableHead>
                <TableHead>{t('schools.schoolName')}</TableHead>
                {/* <TableHead>Trust</TableHead> */}
                <TableHead>{t('schools.admin')}</TableHead>
                <TableHead>{t('schools.contact')}</TableHead>
                <TableHead>{t('schools.students')}</TableHead>
                <TableHead>{t('schools.idsGenerated')}</TableHead>
                {/*} <TableHead>Credits</TableHead>*/}
                <TableHead>{t('schools.status')}</TableHead>
                <TableHead>{t('schools.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y-2 divide-gray-300">
              {schools.map((school) => (
                <TableRow
                  key={school.id}
                  className={`cursor-default ${(schools.indexOf(school) + 1) % 2 === 0 ? 'bg-gray-200/60' : 'bg-white'
                    } hover:bg-green-100/50 transition-colors text-sm hover:text-black group `}
                >
                  <TableCell className="font-medium text-center">
                    {schools.indexOf(school) + 1}.
                  </TableCell>
                  <TableCell
                    className="font-medium  cursor-pointer"
                    onClick={() => navigate(`/dashboard/schools/${school.id}`)}
                  >
                    <p
                      className="truncate group-hover:underline group-hover:text-indigo-700"
                      title={school.school_name}
                    >
                      {school.school_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium " title={school.trust_name}>
                        {school.trust_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate" title={school.school_admin_name}>
                    {school.school_admin_name}
                  </TableCell>
                  <TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-end gap-2 text-sm">
                          <Mail className="w-4 h-4 text-red-700" />
                          <span className="truncate" title={school.email}>
                            {school.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-700" />
                          <span title={school.phone}>{school.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableCell>
                  <TableCell className="text-center">{school.total_students}</TableCell>
                  <TableCell className="text-center">{school.idsGenerated}</TableCell>
                  {/*<TableCell className="text-center">
                    <span
                      className={
                        school.creditsRemaining < 500 ? 'text-orange-600' : 'text-green-600'
                      }
                    >
                      {school.creditsRemaining}
                    </span>
                  </TableCell>*/}
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                      {school.status === 'Active' ? t('teachers.active') : t('teachers.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex flex-col items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/schools/${school.id}/classes`)}
                        className="gap-1 hover:bg-orange-500 hover:text-white"
                        title={t('schools.configure')}
                      >
                        <Users className="w-4 h-4" />
                        {t('schools.configure')}
                      </Button>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTeachers(school)}
                          className="gap-1 hover:bg-orange-500 hover:text-white group"
                          title={t('schools.manageTeachers')}
                        >
                          <GraduationCap className="w-4 h-4 group-hover:scale-130" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCredentials(school)}
                          className="gap-1 hover:bg-orange-500 hover:text-white group"
                          title={t('schools.viewCredentials')}
                        >
                          <Eye className="w-4 h-4 group-hover:scale-130" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSchool(school)}
                          className="gap-1 hover:bg-orange-500 hover:text-white group"
                          title={t('schools.editSchool')}
                        >
                          <Pencil className="w-4 h-4 group-hover:scale-130" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('schools.credentials')}</DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">{t('schools.schoolName')}</Label>
                  <p className="font-medium">{credentials.school_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t('common.email')}</Label>
                  <p className="font-medium">{credentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t('schools.schoolCode')}</Label>
                  <p className="font-medium">{credentials.school_code}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t('schools.section')}</Label>
                  <p className="font-medium">{credentials.section ? t(`sections.${credentials.section}`) : t('teachers.na')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t('schools.loginUrl')}</Label>
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
              {t('schools.resetPassword')}
            </Button>
            <Button variant="outline" onClick={handleCopyCredentials} className="w-full sm:w-auto">
              <Copy className="w-4 h-4 mr-2" />
              {t('schools.copy')}
            </Button>
            <Button onClick={handleSendCredentials} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" />
              {t('schools.sendEmail')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schools.resetPassword')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('schools.newPassword')}</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('schools.passwordPlaceholder')}
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
              {t('schools.cancel')}
            </Button>
            <Button onClick={handleResetPassword}>{t('schools.resetPassword')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
