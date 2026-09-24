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
import { Search, Eye, CheckCircle, XCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { studentService } from '@/api/studentService';
import { classService } from '@/api/classService';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface Student {
  id: number;
  school_id: number;
  class_id: number;
  division_id: number;
  name: string;
  roll_number: string;
  formStatus?: 'Completed' | 'Pending' | 'Rejected';
  submittedOn?: string;
  class_name?: string;
  division_name?: string;
}

interface ClassItem {
  id: number;
  class_name: string;
}

interface DivisionItem {
  id: number;
  division_name: string;
}

export function StudentManagement() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { t } = useTranslation();

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const openViewDialog = (student: Student) => {
    navigate(`/school-dashboard/students/${student.id}`);
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);

  // 🔵 filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingClass, setPendingClass] = useState('all');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    division: '',
    rollNo: '',
    parentPhone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch students + classes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!userData?.id) return;
      setIsLoading(true);
      setError(null);

      try {
        const studentRes = await studentService.getPublicStudents(userData.id);

        // Handle both formats: { success: true, data: [...] } or direct array [...]
        const studentData = Array.isArray(studentRes) ? studentRes : studentRes?.data || [];

        if (Array.isArray(studentData)) {
          // Map student_name to name if it exists in the API response
          const mappedStudents = studentData.map((s: any) => ({
            ...s,
            name: s.student_name || s.name || '',
            id: s.id || s.roll_number,
            class_name: s.class_name || s.className || s.Class || '',
            division_name: s.division_name || s.division || s.Division || '',
            roll_number: s.roll_number || s['Roll No'] || s.rollNo || '',
          }));
          setStudents(mappedStudents);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Error in fetchStudents:', err);
        setError(t('studentManagement.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClasses = async () => {
      if (!userData?.id) return;

      try {
        const classRes = await classService.getClassesBySchool(userData.id);

        if (classRes.success && Array.isArray(classRes.data)) {
          setClasses(classRes.data);
        } else {
          setClasses([]);
        }
      } catch (err) {
        setError(t('studentManagement.fetchClassError'));
      }
    };

    fetchStudents();
    fetchClasses();
  }, [userData]);

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!newStudent.class) return;

      try {
        const selectedClass = classes.find((c) => c.id === Number(newStudent.class));
        if (selectedClass) {
          const res = await studentService.getDivisionsByClass(selectedClass.class_name);

          if (res.success && Array.isArray(res.data)) {
            const uniqueDivisions = Array.from(
              new Map(res.data.map((div: DivisionItem) => [div.division_name, div])).values()
            );
            // Sort divisions by name in ascending order
            uniqueDivisions.sort((a, b) => a.division_name.localeCompare(b.division_name));
            setDivisions(uniqueDivisions);
          } else {
            setDivisions([]);
          }
        }
      } catch (err) {
        setDivisions([]);
      }
    };
    fetchDivisions();
  }, [newStudent.class, classes]);

  // Add student
  const handleAddStudent = async () => {
    if (!userData?.id) {
      alert(t('studentManagement.notAuthenticated'));
      return;
    }

    if (!newStudent.name || !newStudent.rollNo || !newStudent.class || !newStudent.division) {
      alert(t('studentManagement.fillAllFields'));
      return;
    }

    const selectedDivision = divisions.find((div) => String(div.id) === newStudent.division);

    if (!selectedDivision) {
      alert(t('studentManagement.selectValidDivision'));
      return;
    }

    const division_name = selectedDivision.division_name;
    const division_id = selectedDivision.id;

    setIsLoading(true);
    try {
      const selectedClass = classes.find((c) => c.id === Number(newStudent.class));

      if (selectedClass) {
        const payload = {
          name: newStudent.name,
          roll_number: newStudent.rollNo,
          parent_phone: newStudent.parentPhone,
          class_name: selectedClass.class_name,
          class_id: selectedClass.id,
          division_name: division_name,
          division_id: division_id,
        };

        // console.log('Sending payload:', payload);

        const response = await studentService.addStudent(payload);

        if (response.success) {
          alert(response.message || t('studentManagement.addedSuccess'));

          // Push new student in table
          setStudents((prev) => [
            ...prev,
            {
              ...response.data,
              class_name: selectedClass.class_name,
              division_name: division_name,
              formStatus: 'Pending',
              submittedOn: '-',
            },
          ]);

          // Reset form
          setIsAddDialogOpen(false);
          setNewStudent({ name: '', class: '', division: '', rollNo: '', parentPhone: '' });
        } else {
          alert(t('studentManagement.addFailed'));
        }
      }
    } catch (error) {
      console.error('ERROR:', error);
      alert(t('studentManagement.addError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Form Status UI helpers
  const getFormStatusIcon = (status: Student['formStatus']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getFormStatusBadge = (status: Student['formStatus']) => {
    const variants = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return variants[status || 'Pending'];
  };

  // FINAL FILTERING
  const filteredStudents = (students || []).filter((student) => {
    // 1. Search filter
    const q = (searchTerm || '').trim().toLowerCase();
    const name = (student.name || student.student_name || '').toString().toLowerCase();
    const roll = String(student.roll_number || '').toLowerCase();

    const matchesSearch = q === '' || name.includes(q) || roll.includes(q);

    // 2. Class filter
    const studentClass = (student.class_name || student.className || student.Class || '')
      .toString()
      .trim()
      .toLowerCase();
    const targetClass = (classFilter || 'all').toString().trim().toLowerCase();
    const matchesClass = targetClass === 'all' || studentClass === targetClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="px-8 py-5 bg-white">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('studentManagement.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('studentManagement.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 border px-4 rounded-xl shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* SEARCH */}
            <div className="gap-2 ">
              <label className="text-lg text-gray-900">{t('studentManagement.searchLabel')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('studentManagement.searchPlaceholder')}
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* CLASS FILTER */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">{t('studentManagement.classLabel')}</label>
              <Select value={pendingClass} onValueChange={setPendingClass}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studentManagement.allClasses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('studentManagement.allClasses')}</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.class_name}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* APPLY BUTTON */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600 opacity-0">{t('studentManagement.classLabel')}</label>
              <Button
                className="w-full bg-violet-500 hover:bg--600 text-white"
                onClick={() => {
                  setSearchTerm(pendingSearch);
                  setClassFilter(pendingClass);
                }}
              >
                {t('studentManagement.applyFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold">{t('studentManagement.allStudents')}</CardTitle>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white group"
            >
              <Plus className="w-4 h-4 mr-2 group-hover:scale-130" />
              Add Student
            </Button>*/}
          </div>
        </CardHeader>

        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t('studentManagement.rollNo')}</TableHead>
                    <TableHead>{t('studentManagement.studentName')}</TableHead>
                    <TableHead className="text-center">{t('studentManagement.class')}</TableHead>
                    <TableHead className="text-center">{t('studentManagement.division')}</TableHead>
                    {/* <TableHead>Form Status</TableHead>
                    <TableHead>Submitted On</TableHead> */}
                    {/* <TableHead className="text-center">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        {t('studentManagement.noStudents')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow
                        key={student.id}
                        className=" hover:bg-gray-100 transition-colors"
                      // onClick={() => openViewDialog(student)}
                      >
                        <TableCell className="font-medium text-center">
                          {student.roll_number}
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">{student.class_name || '-'}</TableCell>
                        <TableCell className="text-center">
                          {student.division_name || '-'}
                        </TableCell>

                        {/* <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormStatusIcon(student.formStatus || 'Pending')}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getFormStatusBadge(
                                student.formStatus || 'Pending'
                              )}`}
                            >
                              {student.formStatus || 'Pending'}
                            </span>
                          </div>
                        </TableCell> */}

                        {/* <TableCell>{student.submittedOn || '-'}</TableCell> */}

                        {/* <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2  hover:bg-orange-100 text-orange-500 hover:text-orange-500 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewDialog(student);
                            }}
                          >
                            <Eye className="w-4 h-4 group-hover:scale-130" />
                            View
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================== ADD STUDENT POPUP ===================== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('studentManagement.addNewStudent')}</DialogTitle>
            <DialogDescription>{t('studentManagement.addStudentDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            {/* Name */}
            <div>
              <Label>{t('studentManagement.nameLabel')}</Label>
              <Input
                placeholder={t('studentManagement.namePlaceholder')}
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
            </div>

            {/* Roll Number */}
            <div>
              <Label>{t('studentManagement.rollNumberLabel')}</Label>
              <Input
                placeholder={t('studentManagement.rollNumberPlaceholder')}
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
              />
            </div>

            {/* Class */}
            <div>
              <Label>{t('studentManagement.class')}</Label>
              <Select
                value={newStudent.class}
                onValueChange={(value) =>
                  setNewStudent({ ...newStudent, class: value, division: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('studentManagement.selectClass')} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division */}
            <div>
              <Label>{t('studentManagement.division')}</Label>
              <Select
                value={newStudent.division}
                onValueChange={(value) => setNewStudent({ ...newStudent, division: value })}
                disabled={!newStudent.class}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('studentManagement.selectDivision')} />
                </SelectTrigger>

                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={String(div.id)}>
                      {div.division_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Phone */}
            <div>
              <Label>{t('studentManagement.parentPhone')}</Label>
              <Input
                placeholder={t('studentManagement.phonePlaceholder')}
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
              />
            </div>

            <Button className="w-full mt-2" onClick={handleAddStudent}>
              {t('studentManagement.addStudentBtn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== STUDENT VIEW POPUP ===================== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('studentManagement.studentDetails')}</DialogTitle>
            <DialogDescription>{t('studentManagement.studentDetailsDesc', { name: selectedStudent?.name })}</DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="grid gap-6 mt-4">
              {/* Row 1 */}
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.rollNumber')}</p>
                  <p className="font-medium">{selectedStudent.roll_number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.formStatus')}</p>
                  <p className="font-medium capitalize">
                    {selectedStudent.formStatus || 'Pending'}
                  </p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.studentName')}</p>
                  <p className="font-medium">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.submittedOn')}</p>
                  <p className="font-medium">{selectedStudent.submittedOn || '-'}</p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.class')}</p>
                  <p className="font-medium">{selectedStudent.class_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('studentManagement.division')}</p>
                  <p className="font-medium">{selectedStudent.division_name}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
