import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { trustSchoolApi } from '@/api/trust/schools';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';
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
import { useTranslation } from 'react-i18next';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: 'Active' | 'Inactive';
}

export function TrustSchoolTeacherManagement() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, teachers]);

  const fetchData = async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const [teachersRes, subjectsRes, schoolsRes] = await Promise.all([
        trustSchoolApi.getTeachers(parseInt(schoolId)),
        subjectsApi.getAllSubjects(),
        trustSchoolApi.getAllSchools(0),
      ]);

      if (teachersRes.success) {
        setTeachers(teachersRes.data || []);
        setFilteredTeachers(teachersRes.data || []);
      }
      if (subjectsRes.success) {
        setSubjects(subjectsRes.data || []);
      }
      if (schoolsRes.success && schoolsRes.data) {
        const school = schoolsRes.data.find((s: any) => s.id === parseInt(schoolId));
        if (school) setSchoolName(school.school_name);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(t('trustTeacherManagement.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...teachers];
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTeachers(filtered);
  };

  const handleAddTeacher = async () => {
    if (!schoolId) return;

    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast.error(t('trustTeacherManagement.fillRequired'));
      return;
    }

    try {
      const response = await trustSchoolApi.createTeacher(parseInt(schoolId), {
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        password: newTeacher.password,
        subject: newTeacher.subject,
        status: newTeacher.status,
      });

      if (response.success) {
        toast.success(t('trustTeacherManagement.teacherAdded'));
        setIsAddDialogOpen(false);
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
        fetchData();
      }
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      toast.error(error.response?.data?.message || t('trustTeacherManagement.teacherAddFailed'));
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subject: teacher.subject || '',
      status: teacher.status,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!schoolId || !selectedTeacher) return;

    try {
      const updates: any = {};
      if (editTeacher.name) updates.name = editTeacher.name;
      if (editTeacher.email) updates.email = editTeacher.email;
      if (editTeacher.phone) updates.phone = editTeacher.phone;
      if (editTeacher.subject) updates.subject = editTeacher.subject;
      if (editTeacher.status) updates.status = editTeacher.status;
      if (editTeacher.password) updates.password = editTeacher.password;

      const response = await trustSchoolApi.updateTeacher(
        parseInt(schoolId),
        selectedTeacher.id,
        updates
      );

      if (response.success) {
        toast.success(t('trustTeacherManagement.teacherUpdated'));
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || t('trustTeacherManagement.teacherUpdateFailed'));
    }
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!schoolId || !teacherToDelete) return;

    try {
      const response = await trustSchoolApi.deleteTeacher(parseInt(schoolId), teacherToDelete.id);

      if (response.success) {
        toast.success(t('trustTeacherManagement.teacherDeleted'));
        setIsDeleteDialogOpen(false);
        setTeacherToDelete(null);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || t('trustTeacherManagement.teacherDeleteFailed'));
    }
  };

  const handleSubjectChange = (value: string, isEdit: boolean = false) => {
    if (value === '__add_new__') {
      setShowCustomSubjectInput(true);
      if (isEdit) {
        setEditTeacher({ ...editTeacher, subject: '' });
      } else {
        setNewTeacher({ ...newTeacher, subject: '' });
      }
    } else {
      if (isEdit) {
        setEditTeacher({ ...editTeacher, subject: value });
      } else {
        setNewTeacher({ ...newTeacher, subject: value });
      }
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
    }
  };

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      toast.error(t('trustTeacherManagement.enterSubject'));
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success) {
        setSubjects([...subjects, response.data]);
        const newSubjectName = customSubjectName.trim();

        if (isAddDialogOpen) {
          setNewTeacher({ ...newTeacher, subject: newSubjectName });
        } else if (isEditDialogOpen) {
          setEditTeacher({ ...editTeacher, subject: newSubjectName });
        }

        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('trustTeacherManagement.subjectAdded'));
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(t('trustTeacherManagement.subjectAddFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh">
      <div className="flex items-center gap-4 pb-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/super-dashboard/super-schools')}
          className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-130" />
          {t('trustTeacherManagement.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('trustTeacherManagement.title')}</h1>
          {schoolName && (
            <p className="text-gray-600 mt-1">
              {t('trustTeacherManagement.managingFor', { school: schoolName })}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-4 border bg-white rounded-lg shadow-md p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('trustTeacherManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4" />
          {t('trustTeacherManagement.addTeacher')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('trustTeacherManagement.teachersCount', { count: filteredTeachers.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('trustTeacherManagement.noTeachers')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('trustTeacherManagement.name')}</TableHead>
                  <TableHead>{t('trustTeacherManagement.email')}</TableHead>
                  <TableHead>{t('trustTeacherManagement.phone')}</TableHead>
                  <TableHead>{t('trustTeacherManagement.subject')}</TableHead>
                  <TableHead>{t('trustTeacherManagement.status')}</TableHead>
                  <TableHead>{t('trustTeacherManagement.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      navigate(`/super-dashboard/schools/${schoolId}/teachers/${teacher.id}`)
                    }
                  >
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.phone || t('trustTeacherManagement.na')}</TableCell>
                    <TableCell>{teacher.subject || t('trustTeacherManagement.na')}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          teacher.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {teacher.status === 'Active'
                          ? t('trustTeacherManagement.active')
                          : t('trustTeacherManagement.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(teacher)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(teacher)}
                          className="text-red-600"
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

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('trustTeacherManagement.addTeacherTitle')}</DialogTitle>
            <DialogDescription>{t('trustTeacherManagement.addTeacherDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('trustTeacherManagement.nameLabel')}</Label>
                <Input
                  id="name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('trustTeacherManagement.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('trustTeacherManagement.phoneLabel')}</Label>
                <Input
                  maxLength={10}
                  pattern="[0-9]{10}"
                  id="phone"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t('trustTeacherManagement.subjectLabel')}</Label>
                {!showCustomSubjectInput ? (
                  <Select
                    value={newTeacher.subject}
                    onValueChange={(value) => handleSubjectChange(value, false)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('trustTeacherManagement.selectSubject')} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                        {t('trustTeacherManagement.addNewSubject')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('trustTeacherManagement.enterSubjectName')}
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                    />
                    <Button onClick={handleCustomSubjectSubmit} size="sm" type="button">
                      {t('trustTeacherManagement.save')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowCustomSubjectInput(false);
                        setCustomSubjectName('');
                      }}
                    >
                      {t('trustTeacherManagement.cancel')}
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('trustTeacherManagement.statusLabel')}</Label>
                <Select
                  value={newTeacher.status}
                  onValueChange={(value: 'Active' | 'Inactive') =>
                    setNewTeacher({ ...newTeacher, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t('trustTeacherManagement.active')}</SelectItem>
                    <SelectItem value="Inactive">{t('trustTeacherManagement.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('trustTeacherManagement.passwordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setShowCustomSubjectInput(false);
                setCustomSubjectName('');
              }}
            >
              {t('trustTeacherManagement.cancel')}
            </Button>
            <Button onClick={handleAddTeacher}>{t('trustTeacherManagement.addTeacher')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('trustTeacherManagement.editTeacherTitle')}</DialogTitle>
            <DialogDescription>{t('trustTeacherManagement.editTeacherDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('trustTeacherManagement.name')}</Label>
                <Input
                  id="edit-name"
                  value={editTeacher.name}
                  onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('trustTeacherManagement.email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editTeacher.email}
                  onChange={(e) => setEditTeacher({ ...editTeacher, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t('trustTeacherManagement.phone')}</Label>
                <Input
                  id="edit-phone"
                  value={editTeacher.phone}
                  onChange={(e) => setEditTeacher({ ...editTeacher, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">{t('trustTeacherManagement.subject')}</Label>
                {!showCustomSubjectInput ? (
                  <Select
                    value={editTeacher.subject}
                    onValueChange={(value) => handleSubjectChange(value, true)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('trustTeacherManagement.selectSubject')} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                        {t('trustTeacherManagement.addNewSubject')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('trustTeacherManagement.enterSubjectName')}
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                    />
                    <Button onClick={handleCustomSubjectSubmit} size="sm" type="button">
                      {t('trustTeacherManagement.save')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowCustomSubjectInput(false);
                        setCustomSubjectName('');
                      }}
                    >
                      {t('trustTeacherManagement.cancel')}
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('trustTeacherManagement.status')}</Label>
                <Select
                  value={editTeacher.status}
                  onValueChange={(value: 'Active' | 'Inactive') =>
                    setEditTeacher({ ...editTeacher, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t('trustTeacherManagement.active')}</SelectItem>
                    <SelectItem value="Inactive">{t('trustTeacherManagement.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t('trustTeacherManagement.newPasswordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? 'text' : 'password'}
                    value={editTeacher.password}
                    onChange={(e) => setEditTeacher({ ...editTeacher, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setShowCustomSubjectInput(false);
                setCustomSubjectName('');
              }}
            >
              {t('trustTeacherManagement.cancel')}
            </Button>
            <Button onClick={handleUpdateTeacher}>{t('trustTeacherManagement.updateTeacher')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trustTeacherManagement.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('trustTeacherManagement.deleteConfirmDesc', { name: teacherToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeacherToDelete(null)}>
              {t('trustTeacherManagement.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('trustTeacherManagement.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
