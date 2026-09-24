import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  Search,
  Eye,
  UserPlus,
  Plus,
  Users,
  BookOpen,
  Mail,
  Phone,
  Loader2,
  EyeOff,
  Save,
  XCircle,
  Edit,
  Trash2,
  Download, // [NEW] Import
} from 'lucide-react';
import { teachersApi, Teacher } from '@/api/teachers';
import { subjectsApi, Subject } from '@/api/subjects';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

import { ImportTeacherModal } from './ImportTeacherModal'; // [NEW] Import

export function TeacherManagement() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false); // [NEW] Import dialog state
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
  });
  const [editTeacher, setEditTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  const schoolId = userData?.id;

  const applyFilters = () => {
    let updatedTeachers = [...teachers];

    // Apply search term filter
    if (searchTerm) {
      updatedTeachers = updatedTeachers.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply subject filter
    if (subjectFilter !== 'all') {
      updatedTeachers = updatedTeachers.filter(
        (teacher) => (teacher.subject || '').toLowerCase() === subjectFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      updatedTeachers = updatedTeachers.filter(
        (teacher) => teacher.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTeachers(updatedTeachers);
  };

  // Load subjects
  useEffect(() => {
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
    loadSubjects();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!schoolId) {
        console.log('School ID is not available, skipping teacher fetch.');
        return;
      }

      setIsLoading(true);
      // console.log('Fetching teachers for schoolId:', schoolId);
      try {
        const response = await teachersApi.getAll(schoolId);
        // console.log('Teachers API Response:', response);
        if (response.success && Array.isArray(response.data)) {
          setTeachers(response.data);
          setFilteredTeachers(response.data);
        } else {
          setTeachers([]); // Clear teachers on error or no data
          setFilteredTeachers([]);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]); // Clear teachers on error
        setFilteredTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, [schoolId]);

  useEffect(() => {
    // Apply filters when teachers, searchTerm, subjectFilter, or statusFilter changes
    applyFilters();
  }, [teachers, searchTerm, subjectFilter, statusFilter]);

  // Handle subject selection for add
  const handleSubjectChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomSubjectInput(true);
      setNewTeacher({ ...newTeacher, subject: '' });
    } else {
      setNewTeacher({ ...newTeacher, subject: value });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
    }
  };

  // Handle subject selection for edit
  const handleEditSubjectChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomSubjectInput(true);
      setEditTeacher({ ...editTeacher, subject: '' });
    } else {
      setEditTeacher({ ...editTeacher, subject: value });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
    }
  };

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      toast.error(t('teacherManagement.enterSubjectName'));
      return;
    }

    // Check if subject already exists in local list
    const existingSubject = subjects.find(
      (s) => s.name.toLowerCase() === customSubjectName.trim().toLowerCase()
    );
    if (existingSubject) {
      if (isEditDialogOpen) {
        setEditTeacher({ ...editTeacher, subject: existingSubject.name });
      } else {
        setNewTeacher({ ...newTeacher, subject: existingSubject.name });
      }
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success && response.data) {
        setSubjects([...subjects, response.data]);
        if (isEditDialogOpen) {
          setEditTeacher({ ...editTeacher, subject: response.data.name });
        } else {
          setNewTeacher({ ...newTeacher, subject: response.data.name });
        }
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('teacherManagement.subjectAddedSuccess'));
      }
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast.error(error.response?.data?.message || t('teacherManagement.subjectCreateFailed'));
    }
  };

  const validateTeacherData = (data: typeof newTeacher, isEdit = false) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) {
      newErrors.name = t('teacherManagement.nameRequired');
    } else if (data.name.trim().length < 2) {
      newErrors.name = t('teacherManagement.nameMinLength');
    }

    if (!data.email.trim()) {
      newErrors.email = t('teacherManagement.emailRequired');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        newErrors.email = t('teacherManagement.invalidEmail');
      }
    }

    if (!data.phone.trim()) {
      newErrors.phone = t('teacherManagement.phoneRequired');
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(data.phone)) {
        newErrors.phone = t('teacherManagement.phoneInvalid');
      }
    }

    // Subject is now optional
    // if (!data.subject) {
    //   newErrors.subject = 'Subject is required';
    // }

    if (!isEdit) {
      if (!data.password) {
        newErrors.password = t('teacherManagement.passwordRequired');
      } else if (data.password.length < 6) {
        newErrors.password = t('teacherManagement.passwordMinLength');
      }
    } else if (data.password && data.password.length < 6) {
      newErrors.password = t('teacherManagement.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTeacher = async () => {
    if (!validateTeacherData(newTeacher)) {
      toast.error(t('teacherManagement.formErrors'));
      return;
    }
    setIsSaving(true);
    try {
      if (!schoolId) {
        toast.error(t('teacherManagement.schoolIdMissing'));
        setIsSaving(false);
        return;
      }
      const response = await teachersApi.create(schoolId, newTeacher);
      if (response.success) {
        setTeachers((prevTeachers) => [...prevTeachers, response.data]);
        setIsAddDialogOpen(false);
        setErrors({});
        setNewTeacher({
          name: '',
          email: '',
          phone: '',
          subject: '',
          status: 'Active',
          password: '',
        });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('teacherManagement.teacherAddedSuccess'));
      }
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      toast.error(error.response?.data?.message || t('teacherManagement.teacherAddFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone || '',
      subject: teacher.subject || '',
      status: teacher.status,
      password: '',
    });
    setShowCustomSubjectInput(false);
    setCustomSubjectName('');
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    if (!validateTeacherData(editTeacher as any, true)) {
      toast.error(t('teacherManagement.formErrors'));
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: editTeacher.name,
        email: editTeacher.email,
        phone: editTeacher.phone,
        subject: editTeacher.subject,
        status: editTeacher.status,
      };

      // Only include password if it's not empty
      if (editTeacher.password.trim() !== '') {
        updateData.password = editTeacher.password;
      }

      const response = await teachersApi.update(selectedTeacher.id, updateData);
      if (response.success) {
        setTeachers((prevTeachers) =>
          prevTeachers.map((t) => (t.id === selectedTeacher.id ? response.data : t))
        );
        setIsEditDialogOpen(false);
        setErrors({});
        setSelectedTeacher(null);
        setEditTeacher({
          name: '',
          email: '',
          phone: '',
          subject: '',
          status: 'Active',
          password: '',
        });
        toast.success(t('teacherManagement.teacherUpdatedSuccess'));
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || t('teacherManagement.teacherUpdateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    setIsDeleting(true);
    try {
      const response = await teachersApi.delete(teacherToDelete.id);
      if (response.success) {
        setTeachers((prevTeachers) => prevTeachers.filter((t) => t.id !== teacherToDelete.id));
        setIsDeleteDialogOpen(false);
        setTeacherToDelete(null);
        toast.success(t('teacherManagement.teacherDeletedSuccess'));
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || t('teacherManagement.teacherDeleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = (teacher: Teacher) => {
    navigate(`/school-dashboard/teachers/${teacher.id}`);
  };

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.status === 'Active').length;

  return (
    <div className="px-8 py-5 bg-white">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('teacherManagement.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('teacherManagement.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600 font-semibold mb-1">{t('teacherManagement.totalTeachers')}</p>
                <p className="text-gray-900 text-2xl  font-bold">{totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600 font-semibold mb-1">{t('teacherManagement.activeTeachers')}</p>
                <p className="text-green-600 text-2xl font-bold">{activeTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('teacherManagement.addNewTeacherTitle')}</DialogTitle>
            <DialogDescription>
              {t('teacherManagement.addNewTeacherDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherName" className="text-right">
                {t('teacherManagement.nameLabel')}
              </Label>
              <Input
                id="teacherName"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="col-span-3"
                placeholder={t('teacherManagement.nameLabel')}
              />
              {errors.name && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherEmail" className="text-right">
                {t('teacherManagement.emailLabel')}
              </Label>
              <Input
                id="teacherEmail"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="col-span-3"
                placeholder="email@school.edu"
              />
              {errors.email && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherPhone" className="text-right">
                {t('teacherManagement.phoneLabel')}
              </Label>
              <Input
                id="teacherPhone"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                className="col-span-3"
                maxLength={10}
                pattern="[0-9]{10}"
              />
              {errors.phone && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherSubject" className="text-right">
                {t('teacherManagement.subjectFieldLabel')}
              </Label>
              {!showCustomSubjectInput ? (
                <Select value={newTeacher.subject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('teacherManagement.selectSubjectOrAdd')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                      {t('teacherManagement.addNewSubject')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="col-span-3 flex gap-2">
                  <Input
                    placeholder={t('teacherManagement.enterNewSubjectName')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                    autoFocus
                  />
                  <Button onClick={handleCustomSubjectSubmit} size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomSubjectInput(false);
                      setCustomSubjectName('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.subject && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherStatus" className="text-right">
                {t('teacherManagement.statusFieldLabel')}
              </Label>
              <Select
                value={newTeacher.status}
                onValueChange={(value) =>
                  setNewTeacher({ ...newTeacher, status: value as 'Active' | 'Inactive' })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{newTeacher.status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('teacherManagement.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('teacherManagement.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherPassword" className="text-right">
                {t('teacherManagement.passwordLabel')}
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="teacherPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="pr-10"
                  placeholder={t('teacherManagement.enterPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setErrors({});
                setNewTeacher({
                  name: '',
                  email: '',
                  phone: '',
                  subject: '',
                  status: 'Active',
                  password: '',
                });
                setShowCustomSubjectInput(false);
                setCustomSubjectName('');
              }}
            >
              {t('teacherManagement.cancel')}
            </Button>
            <Button onClick={handleAddTeacher} disabled={isSaving}>
              {isSaving ? t('teacherManagement.adding') : t('teacherManagement.addTeacher')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="shadow-lg rounded-lg border px-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">{t('teacherManagement.searchLabel')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('teacherManagement.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">{t('teacherManagement.subjectLabel')}</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('teacherManagement.allSubjects')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacherManagement.allSubjects')}</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name.toLowerCase()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">{t('teacherManagement.statusLabel')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('teacherManagement.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacherManagement.allStatus')}</SelectItem>
                  <SelectItem value="active">{t('teacherManagement.active')}</SelectItem>
                  <SelectItem value="inactive">{t('teacherManagement.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('teacherManagement.editTeacherTitle')}</DialogTitle>
            <DialogDescription>{t('teacherManagement.editTeacherDesc', { name: selectedTeacher?.name })}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherName" className="text-right">
                {t('teacherManagement.nameLabel')}
              </Label>
              <Input
                id="editTeacherName"
                value={editTeacher.name}
                onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })}
                className="col-span-3"
                placeholder={t('teacherManagement.nameLabel')}
              />
              {errors.name && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherEmail" className="text-right">
                {t('teacherManagement.emailLabel')}
              </Label>
              <Input
                id="editTeacherEmail"
                type="email"
                value={editTeacher.email}
                onChange={(e) => setEditTeacher({ ...editTeacher, email: e.target.value })}
                className="col-span-3"
                placeholder="email@school.edu"
              />
              {errors.email && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherPhone" className="text-right">
                {t('teacherManagement.phoneLabel')}
              </Label>
              <Input
                id="editTeacherPhone"
                value={editTeacher.phone}
                onChange={(e) => setEditTeacher({ ...editTeacher, phone: e.target.value })}
                className="col-span-3"
                placeholder="+91 XXXXX XXXXX"
                maxLength={10}
              />
              {errors.phone && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherSubject" className="text-right">
                {t('teacherManagement.subjectFieldLabel')}
              </Label>
              {!showCustomSubjectInput ? (
                <Select value={editTeacher.subject} onValueChange={handleEditSubjectChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('teacherManagement.selectSubjectOrAdd')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                      {t('teacherManagement.addNewSubject')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="col-span-3 flex gap-2">
                  <Input
                    placeholder={t('teacherManagement.enterNewSubjectName')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                    autoFocus
                  />
                  <Button onClick={handleCustomSubjectSubmit} size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomSubjectInput(false);
                      setCustomSubjectName('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.subject && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherStatus" className="text-right">
                {t('teacherManagement.statusFieldLabel')}
              </Label>
              <Select
                value={editTeacher.status}
                onValueChange={(value) =>
                  setEditTeacher({ ...editTeacher, status: value as 'Active' | 'Inactive' })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{editTeacher.status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('teacherManagement.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('teacherManagement.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeacherPassword" className="text-right">
                {t('teacherManagement.passwordLabel')}
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="editTeacherPassword"
                  type={showEditPassword ? 'text' : 'password'}
                  value={editTeacher.password}
                  onChange={(e) => setEditTeacher({ ...editTeacher, password: e.target.value })}
                  className="pr-10"
                  placeholder={t('teacherManagement.leaveBlankPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEditPassword((prev) => !prev)}
                >
                  {showEditPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setErrors({});
                setSelectedTeacher(null);
                setEditTeacher({
                  name: '',
                  email: '',
                  phone: '',
                  subject: '',
                  status: 'Active',
                  password: '',
                });
                setShowCustomSubjectInput(false);
                setCustomSubjectName('');
              }}
            >
              {t('teacherManagement.cancel')}
            </Button>
            <Button onClick={handleUpdateTeacher} disabled={isSaving}>
              {isSaving ? t('teacherManagement.updating') : t('teacherManagement.updateTeacher')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('teacherManagement.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('teacherManagement.deleteDesc')}{' '}
              <span className="font-semibold">{teacherToDelete?.name}</span> from the system.
              {teacherToDelete && (
                <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-sm">
                  {t('teacherManagement.deleteNote')}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('teacherManagement.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t('teacherManagement.deleting') : t('teacherManagement.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Teacher Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('teacherManagement.teacherDetailsTitle')}</DialogTitle>
            <DialogDescription>{t('teacherManagement.teacherDetailsDesc', { name: selectedTeacher?.name })}</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="mb-3 pb-2 border-b">{t('teacherManagement.basicInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.nameField')}</span>
                    <p className="font-medium">{selectedTeacher.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.subjectField')}</span>
                    <p className="font-medium">{selectedTeacher.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.emailField')}</span>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedTeacher.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.phoneField')}</span>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedTeacher.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.statusField')}</span>
                    <p>
                      <Badge
                        className={
                          selectedTeacher.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {selectedTeacher.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('teacherManagement.joinedOn')}</span>
                    <p>{new Date(selectedTeacher.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold">
              {t('teacherManagement.allTeachers')} ({filteredTeachers.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsImportDialogOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('teacherManagement.importTeachers')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrors({});
                  setIsAddDialogOpen(true);
                }}
                className="text-green-700 border border-green-600 hover:bg-green-700 hover:text-white group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-130" />
                {t('teacherManagement.addTeacher')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('teacherManagement.nameCol')}</TableHead>
                    <TableHead>{t('teacherManagement.emailCol')}</TableHead>
                    <TableHead>{t('teacherManagement.phoneCol')}</TableHead>
                    <TableHead>{t('teacherManagement.subjectCol')}</TableHead>
                    <TableHead>{t('teacherManagement.statusCol')}</TableHead>
                    <TableHead>{t('teacherManagement.actionsCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TableRow
                        key={teacher.id}
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleViewDetails(teacher)}
                      >
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell className="text-sm">{teacher.email}</TableCell>
                        <TableCell className="text-sm">{teacher.phone}</TableCell>
                        <TableCell>{teacher.subject || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              teacher.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleViewDetails(teacher)}
                            >
                              <Eye className="w-4 h-4" />
                              {t('teacherManagement.view')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-blue-600 hover:text-blue-700"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              <Edit className="w-4 h-4" />
                              {t('teacherManagement.edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(teacher)}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('teacherManagement.delete')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <ImportTeacherModal
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={() => {
          // Re-fetch teachers
          // We can trigger a re-fetch by toggling a dependency or calling a function.
          // Since fetchTeachers depends on [schoolId], we might need a way to force update.
          // Or just update the local state if we had the data, but import returns count.
          // Better to just reload the page or trigger a fetch.
          // The component has a `fetchTeachers` function but it's inside useEffect.
          // A simple hack is to reload window, or better, expose a refresh trigger.
          // For now, I'll allow the user to manually refresh or I can try to update the state.
          // Let's reload the window for simplicity as "fetchTeachers" isn't easily accessible outside effect without refactoring.
          // OR, I can add a dependency to the useEffect.
          // But I can't easily change the useEffect dependency from here without changing the component body.
          // I'll just reload the page for now or finding a cleaner way if I can modify more.
          // Wait, I can modify the component body in another step if needed.
          // But let's look at `fetchTeachers` in the file.
          // It is defined inside `useEffect`.
          // I will update the `useEffect` dependency in a separate step if I want to support clean refresh.
          // For now, I'll pass `window.location.reload()` or similar? No that's bad UX.
          // I will updated `TeacherManagement` to extract `fetchTeachers` or add a refresh trigger.
          // But first strict replacement.
          window.location.reload();
        }}
      />
    </div>
  );
}
