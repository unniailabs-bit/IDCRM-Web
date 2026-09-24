import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import {
  Pencil,
  Trash2,
  GraduationCap,
  Users,
  CreditCard,
  Plus,
  Eye,
  Mail,
  Copy,
  Search,
} from 'lucide-react';
import { Input } from '../../ui/input';
import { useNavigate } from 'react-router-dom';
import { trustSchoolApi } from '@/api/trust/schools';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface School {
  id: number;
  custom_id: string;
  school_name: string;
  school_code: string;
  section: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  classes: Array<{
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

export function SchoolManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedSchoolForCredentials, setSelectedSchoolForCredentials] = useState<School | null>(
    null
  );
  const [credentials, setCredentials] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await trustSchoolApi.getAllSchools(0);
      if (response.success && response.data) {
        setSchools(response.data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error(t('schoolManagement.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (school: School) => {
    setSelectedSchool(school);
    setIsDetailDialogOpen(true);
  };

  const handleEditSchool = (school: School) => {
    navigate(`/super-dashboard/edit-school/${school.id}`);
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSchool = async () => {
    if (!schoolToDelete) return;

    try {
      await trustSchoolApi.deleteSchool(schoolToDelete.id);
      toast.success(t('schoolManagement.deleteSuccess'));
      setIsDeleteDialogOpen(false);
      setSchoolToDelete(null);
      fetchSchools();
    } catch (error: any) {
      console.error('Error deleting school:', error);
      toast.error(error.response?.data?.message || t('schoolManagement.deleteFailed'));
    }
  };

  const handleViewCredentials = async (school: School) => {
    setSelectedSchoolForCredentials(school);
    try {
      const response = await trustSchoolApi.getSchoolCredentials(school.id);
      if (response.success) {
        setCredentials(response.data);
        setIsCredentialsDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      toast.error(error.response?.data?.message || t('schoolManagement.fetchCredentialsFailed'));
    }
  };

  const handleSendCredentials = async (email?: string) => {
    if (!selectedSchoolForCredentials) return;

    try {
      const response = await trustSchoolApi.sendSchoolCredentials(
        selectedSchoolForCredentials.id,
        email || selectedSchoolForCredentials.email
      );
      if (response.success) {
        toast.success(t('schoolManagement.credentialsSent'));
      }
    } catch (error: any) {
      console.error('Error sending credentials:', error);
      toast.error(error.response?.data?.message || t('schoolManagement.sendCredentialsFailed'));
    }
  };

  const handleManageClasses = (school: School) => {
    navigate(`/super-dashboard/schools/${school.id}/classes`);
  };

  const handleManageTeachers = (school: School) => {
    navigate(`/super-dashboard/schools/${school.id}/teachers`);
  };

  const totalSchools = schools.length;
  const totalStudents = schools.reduce((sum, s) => {
    return (
      sum +
      s.classes.reduce((classSum, cls) => {
        return (
          classSum + cls.divisions.reduce((divSum, div) => divSum + (div.expected_students || 0), 0)
        );
      }, 0)
    );
  }, 0);
  const totalClasses = schools.reduce((sum, s) => sum + s.classes.length, 0);

  const filteredSchools = schools.filter((school) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      school.school_name.toLowerCase().includes(searchLower) ||
      school.school_code.toLowerCase().includes(searchLower) ||
      school.email.toLowerCase().includes(searchLower) ||
      school.section.toLowerCase().includes(searchLower) ||
      school.address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('schoolManagement.title')}</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {t('schoolManagement.subtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate('/super-dashboard/add-school')}
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-orange-400 via-orange-600 to-orange-600
          hover:from-green-400 hover:via-green-600 hover:to-green-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
        >
          <Plus className="w-7 h-7 mr-2" />
          {t('schoolManagement.createSchool')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('schoolManagement.totalSchools')}</p>
                <p className="text-gray-900 text-2xl font-bold">{totalSchools}</p>
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
                <p className="text-sm text-gray-600 mb-1">{t('schoolManagement.totalClasses')}</p>
                <p className="text-gray-900 text-2xl font-bold">{totalClasses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('schoolManagement.expectedStudents')}</p>
                <p className="text-gray-900 text-2xl font-bold">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('schoolManagement.sections')}</p>
                <p className="text-gray-900 text-2xl font-bold">
                  {new Set(schools.map((s) => s.section)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-semibold">
            {t('schoolManagement.allSchools', { count: filteredSchools.length })}
          </CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('schoolManagement.searchPlaceholder')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>{t('schoolManagement.loading')}</p>
          ) : schools.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t('schoolManagement.noSchools')}
            </p>
          ) : filteredSchools.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('schoolManagement.noSearchResults')}</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('schoolManagement.schoolCode')}</TableHead>
                      <TableHead>{t('schoolManagement.schoolName')}</TableHead>
                      <TableHead>{t('schoolManagement.section')}</TableHead>
                      <TableHead>{t('schoolManagement.email')}</TableHead>
                      <TableHead>{t('schoolManagement.phone')}</TableHead>
                      <TableHead>{t('schoolManagement.classes')}</TableHead>
                      <TableHead>{t('schoolManagement.divisions')}</TableHead>
                      <TableHead>{t('schoolManagement.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow
                        key={school.id}
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/super-dashboard/schools/${school.id}`)}
                      >
                        <TableCell className="font-medium">{school.school_code}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium truncate" title={school.school_name}>
                              {school.school_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={school.address}>
                              {school.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {school.section}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm truncate" title={school.email}>
                          {school.email}
                        </TableCell>
                        <TableCell className="text-sm">{school.phone}</TableCell>
                        <TableCell className="text-sm text-center">
                          {school.classes.length}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {school.classes.reduce((sum, cls) => sum + cls.divisions.length, 0)}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2 flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCredentials(school)}
                              className="gap-2"
                              title={t('schoolManagement.viewCredentials')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageClasses(school)}
                              className="gap-2"
                              title={t('schoolManagement.manageClasses')}
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageTeachers(school)}
                              className="gap-2"
                              title={t('schoolManagement.manageTeachers')}
                            >
                              <GraduationCap className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSchool(school)}
                              className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                              title={t('schoolManagement.editSchool')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchool(school)}
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                              title={t('schoolManagement.deleteSchool')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('schoolManagement.schoolDetails')}</DialogTitle>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="mb-3 pb-2 border-b font-semibold">{t('schoolManagement.basicInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.schoolCode')}:</span>
                    <p className="font-medium">{selectedSchool.school_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.schoolName')}:</span>
                    <p className="font-medium">{selectedSchool.school_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.section')}:</span>
                    <p>
                      <Badge variant="outline" className="bg-blue-50">
                        {selectedSchool.section}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.email')}:</span>
                    <p className="font-medium">{selectedSchool.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.phone')}:</span>
                    <p className="font-medium">{selectedSchool.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('schoolManagement.actions')}:</span>
                    <p className="font-medium">{selectedSchool.address}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">{t('schoolManagement.loginCredentials')}:</span>
                    <p className="font-medium text-blue-600">
                      {t('schoolManagement.loginCredentialsValue', { email: selectedSchool.email })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Classes and Divisions */}
              <div>
                <h3 className="mb-3 pb-2 border-b font-semibold">{t('schoolManagement.classesDivisions')}</h3>
                {selectedSchool.classes.length === 0 ? (
                  <p className="text-gray-500">{t('schoolManagement.noClasses')}</p>
                ) : (
                  <div className="space-y-4">
                    {selectedSchool.classes.map((classItem) => (
                      <Card key={classItem.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{classItem.class_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {classItem.divisions.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('schoolManagement.noDivisions')}</p>
                          ) : (
                            <div className="space-y-2">
                              {classItem.divisions.map((division) => (
                                <div
                                  key={division.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div>
                                    <span className="font-medium">{division.division_name}</span>
                                    <span className="text-sm text-gray-600 ml-2">
                                      - {division.class_teacher} ({division.expected_students}{' '}
                                      {t('schoolManagement.students')})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('schoolManagement.schoolLoginCredentials')}</DialogTitle>
            <DialogDescription>
              {t('schoolManagement.credentialsFor', { name: selectedSchoolForCredentials?.school_name })}
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3">{t('schoolManagement.loginInfo')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('schoolManagement.email')}:</span>
                    <span className="font-mono font-medium">{credentials.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('schoolManagement.schoolCode')}:</span>
                    <span className="font-medium">{credentials.school_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('schoolManagement.section')}:</span>
                    <span className="font-medium">{credentials.section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('schoolManagement.loginUrl')}</span>
                    <span className="font-mono text-xs">{credentials.login_url}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{t('schoolManagement.note')}</strong> {credentials.note}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const credsText = `Email: ${credentials.email}\nSchool Code: ${credentials.school_code}\nLogin URL: ${credentials.login_url}`;
                    navigator.clipboard.writeText(credsText);
                    toast.success(t('schoolManagement.credentialsCopied'));
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t('schoolManagement.copy')}
                </Button>
                <Button onClick={() => handleSendCredentials()} className="gap-2">
                  <Mail className="w-4 h-4" />
                  {t('schoolManagement.sendViaEmail')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('schoolManagement.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('schoolManagement.deleteConfirmDesc', { name: schoolToDelete?.school_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSchoolToDelete(null)}>
              {t('schoolManagement.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchool}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('schoolManagement.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
