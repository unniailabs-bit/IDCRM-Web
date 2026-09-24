import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, ArrowLeft, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { schoolService } from '@/api/schoolService';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  status?: string;
}

export function AdminSchoolTeacherManagement() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    subject: '',
    status: 'Active',
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
      loadSubjects();
    }
  }, [schoolId]);

  const fetchData = async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const [teachersRes, schoolRes] = await Promise.all([
        schoolService.getTeachers(parseInt(schoolId)),
        schoolService.getSchoolById(parseInt(schoolId)),
      ]);

      if (teachersRes.success) {
        setTeachers(teachersRes.data || []);
      }
      if (schoolRes.success) {
        setSchoolName(schoolRes.data.school_name);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(t('teachers.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectsApi.getAllSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const validateForm = (isEdit: boolean = false) => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('teachers.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('teachers.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('teachers.invalidEmail');
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = t('teachers.phoneDigits');
    }

    if (!isEdit && !formData.password) {
      newErrors.password = t('teachers.passwordRequired');
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = t('teachers.passwordLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTeacher = async () => {
    if (!validateForm(false)) {
      return;
    }

    if (!schoolId) return;

    try {
      const response = await schoolService.createTeacher(parseInt(schoolId), formData);

      if (response.success) {
        toast.success(t('teachers.createSuccess'));
        setIsAddDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || t('teachers.createError'));
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher || !schoolId) return;

    if (!validateForm(true)) {
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        status: formData.status,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await schoolService.updateTeacher(
        parseInt(schoolId),
        selectedTeacher.id,
        updateData
      );

      if (response.success) {
        toast.success(t('teachers.updateSuccess'));
        setIsEditDialogOpen(false);
        resetForm();
        setSelectedTeacher(null);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || t('teachers.updateError'));
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!schoolId) return;

    if (!confirm(t('teachers.deleteConfirm', { name: teacher.name }))) {
      return;
    }

    try {
      const response = await schoolService.deleteTeacher(parseInt(schoolId), teacher.id);

      if (response.success) {
        toast.success(t('teachers.deleteSuccess'));
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || t('teachers.deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      subject: '',
      status: 'Active',
    });
    setShowCustomSubjectInput(false);
    setCustomSubjectName('');
    setShowPassword(false);
    setErrors({});
  };

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      password: '',
      subject: teacher.subject || '',
      status: teacher.status || 'Active',
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleSubjectChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomSubjectInput(true);
      setFormData({ ...formData, subject: '' });
    } else {
      setFormData({ ...formData, subject: value });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
    }
  };

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      toast.error(t('teachers.subjectRequired'));
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success) {
        setSubjects([...subjects, response.data]);
        setFormData({ ...formData, subject: customSubjectName.trim() });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('teachers.subjectSuccess'));
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(t('teachers.subjectError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/schools')}
              className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-130" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('teachers.title')}</h1>
              <p className="text-gray-600 mt-1">{schoolName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          >
            <Plus className="w-7 h-7 mr-2" />
            {t('teachers.addTeacher')}
          </button>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{t('teachers.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">{t('teachers.noTeachers')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.email')}</TableHead>
                    <TableHead>{t('common.phone')}</TableHead>
                    <TableHead>{t('teachers.subject')}</TableHead>
                    <TableHead>{t('teachers.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                      // onClick={() =>
                      //   navigate(`/dashboard/schools/${schoolId}/teachers/${teacher.id}`)
                      // }
                    >
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.phone || t('teachers.na')}</TableCell>
                      <TableCell>{teacher.subject || t('teachers.na')}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            teacher.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {teacher.status === 'Active'
                            ? t('teachers.active')
                            : t('teachers.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(teacher)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teachers.addNewTeacher')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {t('common.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder={t('teachers.teacherName')}
                className={`mt-1 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <Label>
                {t('common.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder={t('common.emailPlaceholder')}
                className={`mt-1 ${
                  errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <Label>{t('common.phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: val });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                placeholder={t('common.phonePlaceholder')}
                maxLength={10}
                className={`mt-1 ${
                  errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <Label>{t('teachers.subject')}</Label>
              {!showCustomSubjectInput ? (
                <Select value={formData.subject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('teachers.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                      + {t('teachers.addNewSubject')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder={t('teachers.enterSubject')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                  />
                  <Button onClick={handleCustomSubjectSubmit} size="sm">
                    {t('common.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomSubjectInput(false);
                      setCustomSubjectName('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>
                {t('common.password')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder={t('common.passwordPlaceholder')}
                  className={`pr-10 ${
                    errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
            <div>
              <Label>{t('teachers.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('teachers.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('teachers.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTeacher}>{t('teachers.addTeacher')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teachers.editTeacher')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {t('common.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder={t('teachers.teacherName')}
                className={`mt-1 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <Label>
                {t('common.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder={t('common.emailPlaceholder')}
                className={`mt-1 ${
                  errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <Label>{t('common.phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: val });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                placeholder={t('common.phonePlaceholder')}
                maxLength={10}
                className={`mt-1 ${
                  errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <Label>{t('teachers.subject')}</Label>
              {!showCustomSubjectInput ? (
                <Select value={formData.subject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('teachers.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                      + {t('teachers.addNewSubject')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder={t('teachers.enterSubject')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                  />
                  <Button onClick={handleCustomSubjectSubmit} size="sm">
                    {t('common.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomSubjectInput(false);
                      setCustomSubjectName('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>{t('teachers.newPasswordLabel')}</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder={t('common.passwordPlaceholder')}
                  className={`pr-10 ${
                    errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
            <div>
              <Label>{t('teachers.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('teachers.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('teachers.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
                setSelectedTeacher(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditTeacher}>{t('teachers.updateTeacher')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
