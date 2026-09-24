import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { trustSchoolApi } from '@/api/trust/schools';
import { teachersApi } from '@/api/teachers';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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

export function TrustSchoolClassManagement() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
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
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const assignedTeacherNames = useMemo(() => {
    return classes.flatMap((cls) => cls.divisions.map((div) => div.class_teacher)).filter(Boolean);
  }, [classes]);

  const fetchData = async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        trustSchoolApi.getClasses(parseInt(schoolId)),
        trustSchoolApi.getTeachers(parseInt(schoolId)),
      ]);

      if (classesRes.success) {
        setClasses(classesRes.data || []);
      }
      if (teachersRes.success) {
        setTeachers(teachersRes.data || []);
      }

      // Fetch school name
      const schoolsRes = await trustSchoolApi.getAllSchools(0);
      if (schoolsRes.success && schoolsRes.data) {
        const school = schoolsRes.data.find((s: any) => s.id === parseInt(schoolId));
        if (school) setSchoolName(school.school_name);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(t('trustClassManagement.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim() || !schoolId) return;

    try {
      const response = await trustSchoolApi.createClass(parseInt(schoolId), {
        class_name: newClassName.trim(),
      });

      if (response.success) {
        toast.success(t('trustClassManagement.classCreated'));
        setIsClassDialogOpen(false);
        setNewClassName('');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.response?.data?.message || t('trustClassManagement.classCreateFailed'));
    }
  };

  const handleAddDivision = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDivisionDialogOpen(true);
  };

  const handleDivisionSubmit = async () => {
    if (!selectedClass || !divisionName.trim() || !schoolId) return;

    const actualTeacher = classTeacher === '__none__' ? '' : classTeacher;
    if (actualTeacher && assignedTeacherNames.includes(actualTeacher)) {
      toast.error(t('classManagement.validation.teacherAlreadyAssigned'));
      return;
    }

    try {
      const selectedTeacher = actualTeacher ? teachers.find((t) => t.name === actualTeacher) : undefined;
      const response = await trustSchoolApi.createDivision(parseInt(schoolId), selectedClass.id, {
        division_name: divisionName.trim(),
        class_teacher: classTeacher === '__none__' ? undefined : classTeacher,
        teacher_id: selectedTeacher?.id,
        expected_students: parseInt(expectedStudents) || 0,
      });

      if (response.success) {
        toast.success(t('trustClassManagement.divisionCreated'));
        setIsDivisionDialogOpen(false);
        setDivisionName('');
        setClassTeacher('');
        setExpectedStudents('');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating division:', error);
      toast.error(error.response?.data?.message || t('trustClassManagement.divisionCreateFailed'));
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
      <div className="flex items-center gap-4 mb-6 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/super-dashboard/super-schools')}
            className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-130" />
            {t('trustClassManagement.back')}
          </Button>
          <div className="justify-start">
            <h1 className="text-3xl font-bold">{t('trustClassManagement.title')}</h1>
            {schoolName && (
              <p className="text-base md:text-lg text-gray-600 font-medium">
                {t('trustClassManagement.managingFor', { school: schoolName })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsClassDialogOpen(true)}
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
        >
          <Plus className="w-4 h-4 ml-auto" />
          {t('trustClassManagement.addClass')}
        </button>
      </div>

      <div className="space-y-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {t('trustClassManagement.noClasses')}
            </CardContent>
          </Card>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {classItem.class_name}
                    {classItem.section && <Badge variant="outline">{classItem.section}</Badge>}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddDivision(classItem)}
                    className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
                  >
                    <Plus className="w-4 h-4" />
                    {t('trustClassManagement.addDivision')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {classItem.divisions && classItem.divisions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('trustClassManagement.divisionHeader')}</TableHead>
                        <TableHead>{t('trustClassManagement.classTeacherHeader')}</TableHead>
                        <TableHead>{t('trustClassManagement.expectedStudentsHeader')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classItem.divisions.map((division) => (
                        <TableRow key={division.id}>
                          <TableCell className="font-medium">{division.division_name}</TableCell>
                          <TableCell>{division.class_teacher || t('trustClassManagement.notAssigned')}</TableCell>
                          <TableCell>{division.expected_students || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">{t('trustClassManagement.noDivisions')}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('trustClassManagement.addClassTitle')}</DialogTitle>
            <DialogDescription>{t('trustClassManagement.addClassDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">{t('trustClassManagement.classNameLabel')}</Label>
              <Input
                id="class-name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder={t('trustClassManagement.classNamePlaceholder')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
              {t('trustClassManagement.cancel')}
            </Button>
            <Button onClick={handleAddClass} disabled={!newClassName.trim()}>
              {t('trustClassManagement.createClass')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Division Dialog */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('trustClassManagement.addDivisionTitle', { className: selectedClass?.class_name })}
            </DialogTitle>
            <DialogDescription>{t('trustClassManagement.addDivisionDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="division-name">{t('trustClassManagement.divisionNameLabel')}</Label>
              <Input
                id="division-name"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder={t('trustClassManagement.divisionNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-teacher">{t('trustClassManagement.classTeacherLabel')}</Label>
              <Select value={classTeacher} onValueChange={setClassTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder={t('trustClassManagement.selectTeacher')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('trustClassManagement.none')}</SelectItem>
                  {teachers
                    .filter((teacher) => !assignedTeacherNames.includes(teacher.name))
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected-students">{t('trustClassManagement.expectedStudentsLabel')}</Label>
              <Input
                id="expected-students"
                type="number"
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDivisionDialogOpen(false)}>
              {t('trustClassManagement.cancel')}
            </Button>
            <Button onClick={handleDivisionSubmit} disabled={!divisionName.trim()}>
              {t('trustClassManagement.createDivision')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
