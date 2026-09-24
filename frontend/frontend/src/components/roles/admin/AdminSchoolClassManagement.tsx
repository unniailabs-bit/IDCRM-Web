import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  Plus,
  ArrowLeft,
  Users,
  Loader2,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { schoolService } from '@/api/schoolService';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';

interface Teacher {
  id: number;
  name: string;
  email: string;
}

interface Division {
  id: number;
  division_name: string;
  class_teacher: string;
  teacher_id?: number | null;
  expected_students: number;
}

interface Class {
  id: number;
  class_name: string;
  section: string;
  divisions: Division[];
}

const predefinedSections = [
  'pre-primary',
  'primary',
  'secondary',
  'higher-secondary',
  'graduation',
  'post-graduation',
];

export function AdminSchoolClassManagement() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [expectedStudents, setExpectedStudents] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [schoolName, setSchoolName] = useState('');

  // Inline editing state
  const [editingDivisionId, setEditingDivisionId] = useState<number | null>(null);
  const [editDivisionData, setEditDivisionData] = useState<Partial<Division>>({});

  // Class inline editing state
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editClassData, setEditClassData] = useState<Partial<Class>>({});

  // Quick Add Teacher state
  const [isQuickAddTeacherDialogOpen, setIsQuickAddTeacherDialogOpen] = useState(false);
  const [showQuickAddPassword, setShowQuickAddPassword] = useState(false);
  const [quickAddTeacherData, setQuickAddTeacherData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    subject: '',
    status: 'Active',
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (schoolId) {
      fetchData();
      loadSubjects();
    }
  }, [schoolId]);

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

  const assignedTeacherNames = useMemo(() => {
    return classes.flatMap((cls) => cls.divisions.map((div) => div.class_teacher)).filter(Boolean);
  }, [classes]);

  const fetchData = async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const [classesRes, teachersRes, schoolRes] = await Promise.all([
        schoolService.getClasses(parseInt(schoolId)),
        schoolService.getTeachers(parseInt(schoolId)),
        schoolService.getSchoolById(parseInt(schoolId)),
      ]);

      if (classesRes.success) {
        setClasses(classesRes.data || []);
      }
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

  const handleAddClass = async () => {
    if (!newClassName.trim() || !schoolId) return;

    try {
      const response = await schoolService.createClass(parseInt(schoolId), {
        class_name: newClassName.trim(),
      });

      if (response.success) {
        toast.success(t('classManagement.createClassSuccess'));
        setIsClassDialogOpen(false);
        setNewClassName('');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.response?.data?.message || t('teachers.createError'));
    }
  };

  const handleSaveClass = async () => {
    if (!editClassData.class_name?.trim() || !schoolId || !editingClassId) return;

    try {
      const response = await schoolService.updateClass(parseInt(schoolId), editingClassId, {
        class_name: editClassData.class_name.trim(),
        section: editClassData.section,
      });

      if (response.success) {
        toast.success(t('classManagement.updateClassSuccess'));
        setEditingClassId(null);
        setEditClassData({});
        fetchData();
      }
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast.error(error.response?.data?.message || t('teachers.updateError'));
    }
  };

  const handleDeleteClass = async (classItem: Class) => {
    if (!schoolId) return;

    if (
      !confirm(
        t('classManagement.deleteConfirm', { name: classItem.class_name })
      )
    ) {
      return;
    }

    try {
      const response = await schoolService.deleteClass(parseInt(schoolId), classItem.id);
      if (response.success) {
        toast.success(t('classManagement.deleteClassSuccess'));
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.response?.data?.message || t('teachers.deleteError'));
    }
  };

  const handleAddDivision = async () => {
    if (!divisionName.trim() || !expectedStudents || !selectedClass || !schoolId) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    if (classTeacher && assignedTeacherNames.includes(classTeacher)) {
      toast.error(t('classManagement.validation.teacherAlreadyAssigned'));
      return;
    }

    try {
      const response = await schoolService.createDivision(parseInt(schoolId), selectedClass.id, {
        division_name: divisionName.trim(),
        class_teacher: classTeacher,
        teacher_id: teachers.find((t) => t.name === classTeacher)?.id,
        expected_students: parseInt(expectedStudents),
      });

      if (response.success) {
        toast.success(t('classManagement.createDivisionSuccess'));
        setIsDivisionDialogOpen(false);
        resetDivisionForm();
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating division:', error);
      toast.error(error.response?.data?.message || t('teachers.createError'));
    }
  };

  const handleSaveInlineDivision = async (classId: number) => {
    if (
      !editDivisionData.division_name?.trim() ||
      !editDivisionData.expected_students ||
      !schoolId ||
      !editingDivisionId
    ) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    const originalTeacher = classes
      .find((c) => c.id === classId)
      ?.divisions.find((d) => d.id === editingDivisionId)?.class_teacher;

    if (
      editDivisionData.class_teacher &&
      editDivisionData.class_teacher !== originalTeacher &&
      assignedTeacherNames.includes(editDivisionData.class_teacher)
    ) {
      toast.error(t('classManagement.validation.teacherAlreadyAssigned'));
      return;
    }

    try {
      const response = await schoolService.updateDivision(
        parseInt(schoolId),
        classId,
        editingDivisionId,
        {
          division_name: editDivisionData.division_name.trim(),
          class_teacher: editDivisionData.class_teacher || '',
          teacher_id: teachers.find((t) => t.name === editDivisionData.class_teacher)?.id,
          expected_students: editDivisionData.expected_students,
        }
      );

      if (response.success) {
        toast.success(t('classManagement.updateDivisionSuccess'));
        setEditingDivisionId(null);
        setEditDivisionData({});
        fetchData();
      }
    } catch (error: any) {
      console.error('Error updating division:', error);
      toast.error(error.response?.data?.message || t('teachers.updateError'));
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingDivisionId(null);
    setEditDivisionData({});
  };

  const handleDeleteDivision = async (classId: number, division: Division) => {
    if (!schoolId) return;

    if (!confirm(t('classManagement.deleteDivisionConfirm', { name: division.division_name }))) {
      return;
    }

    try {
      const response = await schoolService.deleteDivision(parseInt(schoolId), classId, division.id);
      if (response.success) {
        toast.success(t('classManagement.deleteDivisionSuccess'));
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting division:', error);
      toast.error(error.response?.data?.message || t('teachers.deleteError'));
    }
  };

  const resetDivisionForm = () => {
    setDivisionName('');
    setClassTeacher('');
    setExpectedStudents('');
    setSelectedClass(null);
    setSelectedDivision(null);
  };

  const handleTeacherChange = (value: string) => {
    if (value === '__add_new__') {
      setIsQuickAddTeacherDialogOpen(true);
    } else {
      if (editingDivisionId) {
        setEditDivisionData({ ...editDivisionData, class_teacher: value });
      } else {
        setClassTeacher(value);
      }
    }
  };

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      toast.error(t('teachers.subjectRequired'));
      return;
    }

    if (subjects.find((s) => s.name.toLowerCase() === customSubjectName.trim().toLowerCase())) {
      setQuickAddTeacherData({ ...quickAddTeacherData, subject: customSubjectName.trim() });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success) {
        setSubjects([...subjects, response.data]);
        setQuickAddTeacherData({ ...quickAddTeacherData, subject: customSubjectName.trim() });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('teachers.subjectSuccess'));
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(t('teachers.subjectError'));
    }
  };

  const validateQuickAddForm = () => {
    const newErrors: any = {};
    if (!quickAddTeacherData.name.trim()) newErrors.name = t('teachers.nameRequired');
    if (!quickAddTeacherData.email.trim()) newErrors.email = t('teachers.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(quickAddTeacherData.email)) newErrors.email = t('teachers.invalidEmail');
    if (!quickAddTeacherData.phone?.trim()) newErrors.phone = t('teachers.phoneRequired');
    else if (!/^\d{10}$/.test(quickAddTeacherData.phone))
      newErrors.phone = t('teachers.phoneDigits');
    if (!quickAddTeacherData.password) newErrors.password = t('teachers.passwordRequired');
    if (!quickAddTeacherData.subject) newErrors.subject = t('teachers.subjectRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuickAddTeacher = async () => {
    if (!validateQuickAddForm()) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    if (!schoolId) return;

    try {
      const response = await schoolService.createTeacher(parseInt(schoolId), {
        name: quickAddTeacherData.name,
        email: quickAddTeacherData.email,
        password: quickAddTeacherData.password,
        phone: quickAddTeacherData.phone,
        subject: quickAddTeacherData.subject,
        status: quickAddTeacherData.status,
      });

      if (response.success) {
        toast.success(t('teachers.createSuccess'));
        setIsQuickAddTeacherDialogOpen(false);
        setQuickAddTeacherData({
          name: '',
          email: '',
          password: '',
          phone: '',
          subject: '',
          status: 'Active',
        });
        setErrors({});

        // Refresh teacher list and select the new teacher
        const teachersRes = await schoolService.getTeachers(parseInt(schoolId));
        if (teachersRes.success) {
          setTeachers(teachersRes.data || []);
          if (editingDivisionId) {
            setEditDivisionData({ ...editDivisionData, class_teacher: response.data.name });
          } else {
            setClassTeacher(response.data.name);
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || t('teachers.createError'));
    }
  };

  const startInlineEdit = (division: Division) => {
    setEditingDivisionId(division.id);
    setEditDivisionData({
      division_name: division.division_name,
      class_teacher: division.class_teacher,
      teacher_id: division.teacher_id,
      expected_students: division.expected_students,
    });
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
              <h1 className="text-3xl font-bold">{t('classManagement.title')}</h1>
              <p className="text-gray-600 mt-1">{schoolName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsClassDialogOpen(true)}
            className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          >
            <Plus className="w-7 h-7 mr-2" />
            {t('classManagement.addClass')}
          </button>
        </div>

        <div className="space-y-4 max-w-6xl mx-auto">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {t('classManagement.noClasses')}
                </p>
              </CardContent>
            </Card>
          ) : (
            classes.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {editingClassId === classItem.id ? (
                      <div className="flex gap-4 items-center flex-1">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editClassData.class_name || ''}
                            onChange={(e) =>
                              setEditClassData({ ...editClassData, class_name: e.target.value })
                            }
                            placeholder={t('classManagement.className')}
                            className="h-9"
                          />
                          <Select
                            value={editClassData.section || ''}
                            onValueChange={(value) =>
                              setEditClassData({ ...editClassData, section: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('classManagement.selectSection')} />
                            </SelectTrigger>
                            <SelectContent>
                              {predefinedSections.map((sec) => (
                                <SelectItem key={sec} value={sec}>
                                  {t(`sections.${sec}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleSaveClass}>
                            <Save className="h-4 w-4 text-green-600 mr-2" />
                            {t('common.save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingClassId(null);
                              setEditClassData({});
                            }}
                          >
                            <X className="h-4 w-4 text-red-500 mr-2" />
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div>
                            <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                            {classItem.section && (
                              <Badge variant="outline" className="mt-2">
                                {t(`sections.${classItem.section}`)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingClassId(classItem.id);
                                setEditClassData({ class_name: classItem.class_name, section: classItem.section });
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClass(classItem)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button> */}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedClass(classItem);
                            setIsDivisionDialogOpen(true);
                          }}
                          className="flex items-center bg-white text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
                        >
                          <Plus className="w-4 h-4 mr-2 group-hover:scale-130" />
                          {t('classManagement.addDivision')}
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {classItem.divisions && classItem.divisions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('classManagement.division')}</TableHead>
                          <TableHead>{t('classManagement.classTeacher')}</TableHead>
                          <TableHead>{t('classManagement.expectedStudents')}</TableHead>
                          <TableHead className="text-right">{t('classManagement.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classItem.divisions.map((division) => (
                          <TableRow key={division.id}>
                            <TableCell>
                              {editingDivisionId === division.id ? (
                                <Input
                                  value={editDivisionData.division_name || ''}
                                  onChange={(e) =>
                                    setEditDivisionData({
                                      ...editDivisionData,
                                      division_name: e.target.value,
                                    })
                                  }
                                  className="h-8 w-20"
                                />
                              ) : (
                                <Badge className="bg-green-500 text-white">
                                  {division.division_name}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingDivisionId === division.id ? (
                                <Select
                                  value={editDivisionData.class_teacher || ''}
                                  onValueChange={handleTeacherChange}
                                >
                                  <SelectTrigger className="h-8 w-40">
                                    <SelectValue placeholder={t('classManagement.selectTeacher')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers
                                      .filter(
                                        (teacher) =>
                                          !assignedTeacherNames.includes(teacher.name) ||
                                          teacher.name === division.class_teacher
                                      )
                                      .map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.name}>
                                          {teacher.name}
                                        </SelectItem>
                                      ))}
                                    {/* <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                                      + Add New Teacher
                                    </SelectItem> */}
                                  </SelectContent>
                                </Select>
                              ) : (
                                division.class_teacher || t('classManagement.notAssigned')
                              )}
                            </TableCell>
                            <TableCell>
                              {editingDivisionId === division.id ? (
                                <Input
                                  type="number"
                                  value={editDivisionData.expected_students || ''}
                                  onChange={(e) =>
                                    setEditDivisionData({
                                      ...editDivisionData,
                                      expected_students: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="h-8 w-24"
                                  min="1"
                                />
                              ) : (
                                division.expected_students
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingDivisionId === division.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSaveInlineDivision(classItem.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelInlineEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startInlineEdit(division)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  {/* <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDivision(classItem.id, division)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button> */}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-sm">{t('classManagement.noDivisions')}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.addNewClass')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('classManagement.className')}</Label>
              <Input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder={t('classManagement.enterClassName')}
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddClass} disabled={!newClassName.trim()}>
              {t('classManagement.addClass')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Division Dialog */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.addDivisionTo', { className: selectedClass?.class_name })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('classManagement.divisionName')}</Label>
              <Input
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder={t('classManagement.enterDivisionName')}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('classManagement.classTeacherOptional')}</Label>
              <Select value={classTeacher} onValueChange={handleTeacherChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('classManagement.selectTeacher')} />
                </SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter((teacher) => !assignedTeacherNames.includes(teacher.name))
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                    + {t('classManagement.quickAddTeacher')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('classManagement.expectedStudents')}</Label>
              <Input
                type="number"
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(e.target.value)}
                placeholder={t('classManagement.enterStudents')}
                className="mt-1"
                min="1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDivisionDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddDivision}
              disabled={!divisionName.trim() || !expectedStudents}
            >
              {t('classManagement.addDivision')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Teacher Dialog */}
      <Dialog open={isQuickAddTeacherDialogOpen} onOpenChange={setIsQuickAddTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('classManagement.quickAddTeacher')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherName" className="text-right">
                {t('classManagement.name')}
              </Label>
              <Input
                id="teacherName"
                value={quickAddTeacherData.name}
                onChange={(e) =>
                  setQuickAddTeacherData({ ...quickAddTeacherData, name: e.target.value })
                }
                className="col-span-3"
                placeholder={t('classManagement.fullName')}
              />
              {errors.name && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherEmail" className="text-right">
                {t('classManagement.email')}
              </Label>
              <Input
                id="teacherEmail"
                type="email"
                value={quickAddTeacherData.email}
                onChange={(e) =>
                  setQuickAddTeacherData({ ...quickAddTeacherData, email: e.target.value })
                }
                className="col-span-3"
                placeholder={t('teachers.emailPlaceholder')}
              />
              {errors.email && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherPhone" className="text-right">
                {t('classManagement.phone')}
              </Label>
              <Input
                id="teacherPhone"
                value={quickAddTeacherData.phone}
                onChange={(e) =>
                  setQuickAddTeacherData({ ...quickAddTeacherData, phone: e.target.value })
                }
                className="col-span-3"
                maxLength={10}
                placeholder={t('trusts.invalidPhone')}
              />
              {errors.phone && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Subject */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherSubject" className="text-right">
                {t('classManagement.subject')}
              </Label>
              {!showCustomSubjectInput ? (
                <Select
                  value={quickAddTeacherData.subject}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setShowCustomSubjectInput(true);
                      setQuickAddTeacherData({ ...quickAddTeacherData, subject: '' });
                    } else {
                      setQuickAddTeacherData({ ...quickAddTeacherData, subject: value });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
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
                <div className="col-span-3 flex gap-2">
                  <Input
                    placeholder={t('teachers.enterSubject')}
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
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.subject && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherStatus" className="text-right">
                {t('classManagement.status')}
              </Label>
              <Select
                value={quickAddTeacherData.status}
                onValueChange={(value) =>
                  setQuickAddTeacherData({ ...quickAddTeacherData, status: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{quickAddTeacherData.status === 'Active' ? t('classManagement.active') : t('classManagement.inactive')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('classManagement.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('classManagement.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherPassword" className="text-right">
                {t('classManagement.password')}
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="teacherPassword"
                  type={showQuickAddPassword ? 'text' : 'password'}
                  value={quickAddTeacherData.password}
                  onChange={(e) =>
                    setQuickAddTeacherData({ ...quickAddTeacherData, password: e.target.value })
                  }
                  className="pr-10"
                  placeholder={t('common.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowQuickAddPassword((prev) => !prev)}
                >
                  {showQuickAddPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickAddTeacherDialogOpen(false);
                setErrors({});
                setShowCustomSubjectInput(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleQuickAddTeacher}>{t('teachers.addTeacher')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
