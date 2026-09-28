import { useState, useEffect, useMemo } from 'react';
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
import { Search, Eye, CheckCircle, XCircle, Clock, Plus, Loader2, Layers } from 'lucide-react';
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

  // 🔵 Filters & Tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassTab, setSelectedClassTab] = useState('all');
  const [selectedDivisionTab, setSelectedDivisionTab] = useState('all');

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

  // Available Divisions for the currently active Class tab
  const availableDivisions = useMemo(() => {
    const filteredForClass = (students || []).filter((s) => {
      if (selectedClassTab === 'all') return true;
      const studentClass = (s.class_name || (s as any).className || (s as any).Class || '')
        .toString()
        .trim()
        .toLowerCase();
      return studentClass === selectedClassTab.trim().toLowerCase();
    });
    const uniqueDivs = Array.from(
      new Set(
        filteredForClass
          .map((s) => (s.division_name || (s as any).division || (s as any).Division || '').toString().trim())
          .filter(Boolean)
      )
    );
    uniqueDivs.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    return uniqueDivs;
  }, [students, selectedClassTab]);

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
          const mappedStudents = studentData.map((s: any, idx: number) => ({
            ...s,
            name: s.student_name || s.name || '',
            id: s.id || s.student_id || `${s.roll_number || 'std'}-${idx}`,
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
          const sorted = [...classRes.data].sort((a, b) =>
            (a.class_name || '').localeCompare(b.class_name || '', undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          );
          setClasses(sorted);
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
            const uniqueDivisions: DivisionItem[] = Array.from(
              new Map<string, DivisionItem>(
                res.data.map((div: DivisionItem) => [div.division_name, div])
              ).values()
            );
            // Sort divisions by name in ascending order
            uniqueDivisions.sort((a, b) =>
              a.division_name.localeCompare(b.division_name, undefined, {
                numeric: true,
                sensitivity: 'base',
              })
            );
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

  // Structured & Filtered Students
  const filteredStudents = useMemo(() => {
    return (students || [])
      .filter((student) => {
        // 1. Search filter
        const q = (searchTerm || '').trim().toLowerCase();
        const name = (student.name || (student as any).student_name || '').toString().toLowerCase();
        const roll = String(student.roll_number || '').toLowerCase();

        const matchesSearch = q === '' || name.includes(q) || roll.includes(q);

        // 2. Class tab filter
        const studentClass = (student.class_name || (student as any).className || (student as any).Class || '')
          .toString()
          .trim()
          .toLowerCase();
        const targetClass = (selectedClassTab || 'all').toString().trim().toLowerCase();
        const matchesClass = targetClass === 'all' || studentClass === targetClass;

        // 3. Division tab filter
        const studentDiv = (student.division_name || (student as any).division || (student as any).Division || '')
          .toString()
          .trim()
          .toLowerCase();
        const targetDiv = (selectedDivisionTab || 'all').toString().trim().toLowerCase();
        const matchesDivision = targetDiv === 'all' || studentDiv === targetDiv;

        return matchesSearch && matchesClass && matchesDivision;
      })
      .sort((a, b) => {
        // Sort by Class Name ascending
        const classComp = (a.class_name || '').localeCompare(b.class_name || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        if (classComp !== 0) return classComp;

        // Sort by Division Name ascending
        const divComp = (a.division_name || '').localeCompare(b.division_name || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        if (divComp !== 0) return divComp;

        // Sort by Roll Number numeric / string ascending
        const compareRoll = (r1?: string, r2?: string) => {
          const n1 = parseInt(r1 || '', 10);
          const n2 = parseInt(r2 || '', 10);
          if (!isNaN(n1) && !isNaN(n2)) {
            return n1 - n2;
          }
          return (r1 || '').localeCompare(r2 || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        };
        const rollComp = compareRoll(a.roll_number, b.roll_number);
        if (rollComp !== 0) return rollComp;

        // Sort by Student Name ascending
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [students, searchTerm, selectedClassTab, selectedDivisionTab]);

  return (
    <div className="px-8 py-5 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          {t('studentManagement.title')}
        </h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('studentManagement.subtitle')}
        </p>
      </div>

      {/* Class & Division Wise Tabs & Search Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('studentManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        {/* Class Filter Tabs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('studentManagement.class')}:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedClassTab('all');
                setSelectedDivisionTab('all');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${selectedClassTab === 'all'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-102'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
            >
              <Layers className="w-4 h-4" />
              {t('studentManagement.allClasses')}
              <Badge
                variant="secondary"
                className={`ml-1 text-xs rounded-full border-none ${selectedClassTab === 'all'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {students.length}
              </Badge>
            </button>

            {classes.map((cls) => {
              const count = students.filter(
                (s) => (s.class_name || '').toLowerCase() === cls.class_name.toLowerCase()
              ).length;
              const isSelected = selectedClassTab.toLowerCase() === cls.class_name.toLowerCase();

              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassTab(cls.class_name);
                    setSelectedDivisionTab('all');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-102'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                  {cls.class_name}
                  <Badge
                    variant="secondary"
                    className={`ml-1 text-xs rounded-full border-none ${isSelected
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Division Filter Tabs */}
        {availableDivisions.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>{t('studentManagement.division')}:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedDivisionTab('all')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${selectedDivisionTab === 'all'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
              >
                All Divisions
              </button>

              {availableDivisions.map((divName) => {
                const count = students.filter((s) => {
                  const matchClass =
                    selectedClassTab === 'all' ||
                    (s.class_name || '').toLowerCase() === selectedClassTab.toLowerCase();
                  const matchDiv = (s.division_name || '').toLowerCase() === divName.toLowerCase();
                  return matchClass && matchDiv;
                }).length;
                const isSelected = selectedDivisionTab.toLowerCase() === divName.toLowerCase();

                return (
                  <button
                    key={divName}
                    onClick={() => setSelectedDivisionTab(divName)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${isSelected
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                  >
                    Division {divName}
                    <Badge
                      variant="secondary"
                      className={`ml-0.5 text-[10px] py-0 px-1.5 rounded-full border-none ${isSelected
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <Card className="border shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {selectedClassTab === 'all'
                ? t('studentManagement.allStudents')
                : `${selectedClassTab} ${t('studentManagement.class')}`}
              {selectedDivisionTab !== 'all' && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Division {selectedDivisionTab}
                </Badge>
              )}
              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                {filteredStudents.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t('studentManagement.rollNo')}</TableHead>
                    <TableHead>{t('studentManagement.studentName')}</TableHead>
                    <TableHead className="text-center">{t('studentManagement.class')}</TableHead>
                    <TableHead className="text-center">{t('studentManagement.division')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600" />
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {t('studentManagement.noStudents')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <TableRow
                        key={`${student.id}-${student.class_name || ''}-${student.division_name || ''}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-center">
                          {student.roll_number}
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-gray-50">
                            {student.class_name || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-gray-50">
                            {student.division_name || '-'}
                          </Badge>
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

      {/* ===================== ADD STUDENT POPUP ===================== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('studentManagement.addNewStudent')}</DialogTitle>
            <DialogDescription>{t('studentManagement.addStudentDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div>
              <Label>{t('studentManagement.nameLabel')}</Label>
              <Input
                placeholder={t('studentManagement.namePlaceholder')}
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('studentManagement.rollNumberLabel')}</Label>
              <Input
                placeholder={t('studentManagement.rollNumberPlaceholder')}
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
              />
            </div>

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
            <DialogDescription>
              {t('studentManagement.studentDetailsDesc', { name: selectedStudent?.name })}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="grid gap-6 mt-4">
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
