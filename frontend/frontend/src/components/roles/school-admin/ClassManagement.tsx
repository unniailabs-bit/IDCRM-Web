import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, Pencil, Users, Trash2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { classService } from '@/api/classService';
import { studentService } from '@/api/studentService';
import { addDivision } from '@/api/DivisionAdd';
import { addClass } from '@/api/classAddService';
import { CreateTeacherModal } from './CreateTeacherModal';
import { teachersApi } from '@/api/teachers';
import { divisionService } from '@/api/school_admin/divisionService';
import { classAdminService } from '@/api/school_admin/classService';
import { toast } from 'sonner';
import { useTranslation, Trans } from 'react-i18next';


interface Teacher {
  id: number;
  school_id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  school_id: number;
  name: string;
  roll_number: string;
  created_at: string;
  updated_at: string;
  class_name: string;
  division_name: string;
}

interface Division {
  id: number;
  class_id: number;
  division_name: string;
  created_at: string;
  updated_at: string;
  students: Student[]; // Add students to the Division interface
  class_teacher: string;
  teacher_id?: number | null;
  expected_students: number;
}

interface Class {
  id: number;
  school_id: number;
  class_name: string;
  // Removed section - it's now at school level
  class_teacher: string;
  expected_students: number;
  fee_amount?: number;
  late_fee_penalty?: number;
  created_at: string;
  updated_at: string;
  divisions: Division[]; // Add divisions to the Class interface
}

export function ClassManagement() {
  const { t } = useTranslation();
  const { userData } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [divisionName, setDivisionName] = useState('');
  const [divisionFormErrors, setDivisionFormErrors] = useState({
    divisionName: '',
    classTeacher: '',
    expectedStudents: '',
  });
  const [classTeacher, setClassTeacher] = useState('');
  const [expectedStudents, setExpectedStudents] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [lateFeePenalty, setLateFeePenalty] = useState<string>('');
  const [schoolSection, setSchoolSection] = useState<string>(''); // Section comes from school
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState<Division | null>(null);
  const [isEditDivisionDialogOpen, setIsEditDivisionDialogOpen] = useState(false);
  const [selectedDivisionForEdit, setSelectedDivisionForEdit] = useState<Division | null>(null);
  const [editDivisionName, setEditDivisionName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editExpectedStudents, setEditExpectedStudents] = useState('');
  const [editDivisionFormErrors, setEditDivisionFormErrors] = useState({
    divisionName: '',
    classTeacher: '',
    expectedStudents: '',
  });
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [isDeleteClassDialogOpen, setIsDeleteClassDialogOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editFeeAmount, setEditFeeAmount] = useState<string>('');
  const [editLateFeePenalty, setEditLateFeePenalty] = useState<string>('');
  const [editClassFormErrors, setEditClassFormErrors] = useState({ className: '' });

  const fetchClassesDivisionsAndStudents = async () => {
    if (userData && userData.id) {
      setLoadingClasses(true);
      setClassesError(null);
      setLoadingStudents(true);
      setStudentsError(null);
      setLoadingTeachers(true); // Start loading teachers
      try {
        const classesResponse = await classService.getClassesBySchool(userData.id);
        const studentsResponse = await studentService.getStudentsBySchool(userData.id);
        const teachersResponse = await teachersApi.getAll(userData.id); // Fetch teachers

        // Extract school section from classes response (if available)
        if (classesResponse.success && classesResponse.data && classesResponse.data.length > 0) {
          const firstClass = classesResponse.data[0];
          if (firstClass.school_section) {
            setSchoolSection(firstClass.school_section);
          }
        }

        if (
          classesResponse.success &&
          Array.isArray(classesResponse.data) &&
          studentsResponse.success &&
          Array.isArray(studentsResponse.data) &&
          teachersResponse.success &&
          Array.isArray(teachersResponse.data)
        ) {
          // Check teachers response as well

          const allStudents: Student[] = studentsResponse.data;
          setStudents(allStudents);
          setTeachersList(teachersResponse.data); // Set teachers list

          const classesWithDivisionsAndStudents: Class[] = [];
          for (const cls of classesResponse.data) {
            const divisionsResponse = await studentService.getDivisionsByClass(cls.class_name);

            if (divisionsResponse.success && Array.isArray(divisionsResponse.data)) {
              const uniqueDivisions = Array.from(
                new Map(
                  divisionsResponse.data.map((div: Division) => [div.division_name, div])
                ).values()
              );

              const divisionsWithStudents: Division[] = uniqueDivisions.map((div: Division) => {
                const studentsInDivision = allStudents.filter((student) => {
                  return (
                    student.class_name === cls.class_name &&
                    student.division_name === div.division_name
                  );
                });
                return { ...div, students: studentsInDivision };
              });
              classesWithDivisionsAndStudents.push({
                ...cls,
                divisions: divisionsWithStudents,
                fee_amount: (divisionsResponse as any).fee_details?.fee_amount,
                late_fee_penalty: (divisionsResponse as any).fee_details?.late_fee_penalty,
              });
            } else {
              classesWithDivisionsAndStudents.push({
                ...cls,
                divisions: [],
                fee_amount: (divisionsResponse as any).fee_details?.fee_amount,
                late_fee_penalty: (divisionsResponse as any).fee_details?.late_fee_penalty,
              });
            }
          }
          setClasses(classesWithDivisionsAndStudents);
        } else {
          setClassesError(t('classManagement.messages.fetchDataError'));
        }
      } catch (error) {
        console.error('Error fetching classes, divisions, students, or teachers:', error);
        setClassesError(t('classManagement.messages.fetchDataErrorSimple'));
      } finally {

        setLoadingClasses(false);
        setLoadingStudents(false);
        setLoadingTeachers(false); // Stop loading teachers
      }
    }
  };

  useEffect(() => {
    fetchClassesDivisionsAndStudents();
  }, [userData]);

  const assignedTeacherNames = useMemo(() => {
    return classes.flatMap((cls) => cls.divisions.map((div) => div.class_teacher)).filter(Boolean);
  }, [classes]);

  const handleAddDivision = (classItem: Class) => {
    setSelectedClass(classItem);
    setDivisionFormErrors({ divisionName: '', classTeacher: '', expectedStudents: '' });
    setIsDivisionDialogOpen(true);
  };

  const handleDivisionSubmit = async () => {
    const errors = { divisionName: '', classTeacher: '', expectedStudents: '' };
    let hasError = false;

    if (!divisionName.trim()) {
      errors.divisionName = t('classManagement.validation.divisionNameRequired');
      hasError = true;
    }

    if (!classTeacher) {
      errors.classTeacher = t('classManagement.validation.classTeacherRequired');
      hasError = true;
    }

    if (!expectedStudents) {
      errors.expectedStudents = t('classManagement.validation.expectedStudentsRequired');
      hasError = true;
    }

    if (hasError) {
      setDivisionFormErrors(errors);
      toast.error(t('classManagement.validation.formErrors'));
      return;
    }

    if (!selectedClass) {
      setDivisionFormErrors({
        ...errors,
        divisionName: t('classManagement.validation.noClassSelected'),
      });
      toast.error(t('classManagement.validation.noClassSelected'));
      return;
    }

    if (classTeacher && assignedTeacherNames.includes(classTeacher)) {
      toast.error(t('classManagement.validation.teacherAlreadyAssigned'));
      return;
    }

    const isDuplicate = selectedClass.divisions.some(
      (division) =>
        division.division_name.trim().toLowerCase() === divisionName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setDivisionFormErrors({
        ...errors,
        divisionName: t('classManagement.validation.divisionExists', { name: divisionName.trim() }),
      });
      toast.error(t('classManagement.validation.divisionExists', { name: divisionName.trim() }));
      return;
    }


    setDivisionFormErrors({ divisionName: '', classTeacher: '', expectedStudents: '' });

    try {
      const selectedTeacher = teachersList.find((t) => t.name === classTeacher);
      await addDivision({
        class_id: selectedClass.id,
        class_name: selectedClass.class_name,
        division_name: divisionName.trim(),
        class_teacher: classTeacher,
        teacher_id: selectedTeacher ? selectedTeacher.id : null,
        expected_students: parseInt(expectedStudents, 10),
      });
      setIsDivisionDialogOpen(false);
      setDivisionName('');
      setClassTeacher('');
      setExpectedStudents('');
      fetchClassesDivisionsAndStudents(); // Refresh the class list
      toast.success(t('classManagement.messages.divisionAddSuccess'));
    } catch (error: any) {
      console.error('Error adding division:', error);
      const errorMessage =
        error.response?.data?.message || t('classManagement.messages.divisionAddError');
      setDivisionFormErrors({ ...errors, divisionName: errorMessage });
      toast.error(errorMessage);
    }

  };

  const handleClassSubmit = async () => {
    if (newClassName) {
      try {
        await addClass({
          class_name: newClassName,
          fee_amount: feeAmount ? parseFloat(feeAmount) : undefined,
          late_fee_penalty: lateFeePenalty ? parseFloat(lateFeePenalty) : undefined,
          // Removed section - it comes from school
        });
        setIsClassDialogOpen(false);
        setNewClassName('');
        setFeeAmount('');
        setLateFeePenalty('');
        fetchClassesDivisionsAndStudents(); // Refresh the class list
        toast.success(t('classManagement.messages.classAddSuccess'));
      } catch (error: any) {
        console.error('Error adding class:', error);
        const errorMessage =
          error.response?.data?.message || t('classManagement.messages.classAddError');
        toast.error(errorMessage);
      }

    }
  };

  const handleTeacherCreated = () => {
    fetchClassesDivisionsAndStudents();
  };

  const handleDeleteDivisionClick = (division: Division) => {
    setDivisionToDelete(division);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDivision = async () => {
    if (divisionToDelete) {
      try {
        await divisionService.deleteDivision(divisionToDelete.id);
        setIsDeleteDialogOpen(false);
        setDivisionToDelete(null);
        fetchClassesDivisionsAndStudents(); // Refresh data
        toast.success(t('classManagement.messages.divisionDeleteSuccess'));
      } catch (error: any) {
        console.error('Failed to delete division:', error);
        const errorMessage =
          error.response?.data?.message || t('classManagement.messages.divisionDeleteError');
        toast.error(errorMessage);
      }

    }
  };

  const handleEditDivisionClick = (division: Division, classItem: Class) => {
    setSelectedClass(classItem);
    setSelectedDivisionForEdit(division);
    setEditDivisionName(division.division_name);
    setEditClassTeacher(division.class_teacher);
    setEditExpectedStudents(String(division.expected_students));
    setEditDivisionFormErrors({ divisionName: '', classTeacher: '', expectedStudents: '' });
    setIsEditDivisionDialogOpen(true);
  };

  const handleEditDivisionSubmit = async () => {
    const errors = { divisionName: '', classTeacher: '', expectedStudents: '' };
    let hasError = false;

    if (!editDivisionName.trim()) {
      errors.divisionName = t('classManagement.validation.divisionNameRequired');
      hasError = true;
    }

    if (!editClassTeacher) {
      errors.classTeacher = t('classManagement.validation.classTeacherRequired');
      hasError = true;
    }

    if (!editExpectedStudents) {
      errors.expectedStudents = t('classManagement.validation.expectedStudentsRequired');
      hasError = true;
    }

    if (hasError) {
      setEditDivisionFormErrors(errors);
      toast.error(t('classManagement.validation.formErrors'));
      return;
    }

    if (!selectedDivisionForEdit || !selectedClass) {
      toast.error(t('classManagement.validation.noDivisionOrClassSelected'));
      return;
    }


    if (
      editClassTeacher &&
      editClassTeacher !== selectedDivisionForEdit?.class_teacher &&
      assignedTeacherNames.includes(editClassTeacher)
    ) {
      toast.error(t('classManagement.validation.teacherAlreadyAssigned'));
      return;
    }

    // Check for duplicate division name within the same class, excluding the current division being edited
    const isDuplicate = selectedClass.divisions.some(
      (division) =>
        division.id !== selectedDivisionForEdit.id &&
        division.division_name.trim().toLowerCase() === editDivisionName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setEditDivisionFormErrors({
        ...errors,
        divisionName: t('classManagement.validation.divisionExistsInClass', {
          name: editDivisionName.trim(),
        }),
      });
      toast.error(
        t('classManagement.validation.divisionExistsInClass', { name: editDivisionName.trim() })
      );
      return;
    }


    try {
      const selectedTeacher = teachersList.find((t) => t.name === editClassTeacher);
      await divisionService.updateDivision(selectedDivisionForEdit.id, {
        division_name: editDivisionName.trim(),
        teacher_id: selectedTeacher ? selectedTeacher.id : null,
        expected_students: parseInt(editExpectedStudents, 10),
      });
      setIsEditDivisionDialogOpen(false);
      fetchClassesDivisionsAndStudents();
      toast.success(t('classManagement.messages.divisionUpdateSuccess'));
    } catch (error: any) {
      console.error('Error updating division:', error);
      const errorMessage =
        error.response?.data?.message || t('classManagement.messages.divisionUpdateError');
      setEditDivisionFormErrors({ ...errors, divisionName: errorMessage });
      toast.error(errorMessage);
    }

  };

  const handleEditClassSubmit = async () => {
    const errors = { className: '' };
    let hasError = false;

    if (!editClassName.trim()) {
      errors.className = t('classManagement.validation.classNameRequired');
      hasError = true;
    }

    if (hasError) {
      setEditClassFormErrors(errors);
      toast.error(t('classManagement.validation.formErrors'));
      return;
    }

    if (!classToEdit) {
      toast.error(t('classManagement.validation.noClassForEdit'));
      return;
    }


    try {
      await classAdminService.updateClass(classToEdit.id, {
        new_class_name: editClassName.trim(),
        fee_amount: editFeeAmount ? parseFloat(editFeeAmount) : undefined,
        late_fee_penalty: editLateFeePenalty ? parseFloat(editLateFeePenalty) : undefined,
        // Removed section - it comes from school
      });
      setIsEditClassDialogOpen(false);
      fetchClassesDivisionsAndStudents();
      toast.success(t('classManagement.messages.classUpdateSuccess'));
    } catch (error: any) {
      console.error('Error updating class:', error);
      const errorMessage =
        error.response?.data?.message || t('classManagement.messages.classUpdateError');
      setEditClassFormErrors({ ...errors, className: errorMessage });
      toast.error(errorMessage);
    }

  };

  const handleEditClassClick = (classItem: Class) => {
    setClassToEdit(classItem);
    setEditClassName(classItem.class_name);
    setEditFeeAmount(classItem.fee_amount ? String(classItem.fee_amount) : '');
    setEditLateFeePenalty(classItem.late_fee_penalty ? String(classItem.late_fee_penalty) : '');
    setEditClassFormErrors({ className: '' });
    setIsEditClassDialogOpen(true);
  };

  const handleDeleteClassClick = (classItem: Class) => {
    setClassToDelete(classItem);
    setIsDeleteClassDialogOpen(true);
  };

  const confirmDeleteClass = async () => {
    if (classToDelete) {
      try {
        await classAdminService.deleteClass(classToDelete.id);
        setIsDeleteClassDialogOpen(false);
        setClassToDelete(null);
        fetchClassesDivisionsAndStudents(); // Refresh data
        toast.success(t('classManagement.messages.classDeleteSuccess'));
      } catch (error: any) {
        console.error('Failed to delete class:', error);
        const errorMessage =
          error.response?.data?.message || t('classManagement.messages.classDeleteError');
        toast.error(errorMessage);
      }

    }
  };

  return (
    <div className="px-8 py-5 bg-white">
      <div className="flex flex-row md:items-center justify-between mb-8 md:mb-10 gap-2">
        <div className="animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {t('classManagement.title')}
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {t('classManagement.subtitle')}
          </p>
        </div>

        <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-violet-400 via-violet-600 to-violet-600
          hover:from-violet-400 hover:via-violet-600 hover:to-violet-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
            >
              <Plus className="w-7 h-7" />
              {t('classManagement.addNewClass')}
            </button>

          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('classManagement.addNewClassTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">{t('classManagement.classNameLabel')}</Label>
                <Input
                  id="class-name"
                  placeholder={
                    schoolSection === 'Pre-Primary'
                      ? t('classManagement.classNamePlaceholderPrePrimary')
                      : t('classManagement.classNamePlaceholderOther')
                  }
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />

                {schoolSection && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('classManagement.sectionInherited', { section: schoolSection })}
                  </p>
                )}

              </div>
              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-amount">Fee Amount</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="late-fee-penalty">Late Fee Penalty</Label>
                  <Input
                    id="late-fee-penalty"
                    type="number"
                    placeholder="e.g., 100"
                    value={lateFeePenalty}
                    onChange={(e) => setLateFeePenalty(e.target.value)}
                  />
                </div>
              </div> */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                  {t('classManagement.cancel')}
                </Button>
                <Button onClick={handleClassSubmit}>{t('classManagement.addClass')}</Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 gap-6">
        {loadingClasses ? (
          <p>{t('classManagement.loadingClasses')}</p>
        ) : classesError ? (
          <p className="text-red-500">{classesError}</p>
        ) : classes.length === 0 ? (
          <p>{t('classManagement.noClassesFound')}</p>
        ) : (

          classes.map((classItem) => (
            <Card key={classItem.id} className="bg-gray-50 border shadow-sm rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {classItem.class_name}
                      <Badge className="bg-green-100 text-green-800">
                        {classItem.divisions.reduce((sum, div) => sum + div.students.length, 0)}{' '}
                        {t('classManagement.students')}
                      </Badge>

                      {classItem.fee_amount && (
                        <p className="text-sm text-blue-600 font-medium">
                          {t('classManagement.fee')}: ₹{Number(classItem.fee_amount).toLocaleString()}
                        </p>
                      )}
                      {classItem.late_fee_penalty && (
                        <p className="text-sm text-red-600 font-medium">
                          {t('classManagement.penalty')}: ₹
                          {Number(classItem.late_fee_penalty).toLocaleString()}
                        </p>
                      )}

                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-gray-600">
                        {classItem.divisions.length} {t('classManagement.divisions')}
                      </p>
                    </div>

                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClassClick(classItem)}
                      className="gap-2 border border-green-400 text-green-600 hover:bg-green-500 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                      {t('classManagement.editClass')}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClassClick(classItem)}
                      className="gap-2 border border-red-400 text-red-600 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('classManagement.deleteClass')}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddDivision(classItem)}
                      className="gap-2 border border-orange-400 text-orange-600 hover:bg-orange-500 hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                      {t('classManagement.addDivision')}
                    </Button>

                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-10">
                    {classItem.divisions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('classManagement.tableHeadDivision')}</TableHead>
                            <TableHead>{t('classManagement.tableHeadStudents')}</TableHead>
                            <TableHead>{t('classManagement.tableHeadClassTeacher')}</TableHead>
                            <TableHead>{t('classManagement.tableHeadActions')}</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {classItem.divisions.map((division) => (
                            <TableRow key={division.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {classItem.class_name} - {division.division_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{division.students.length}</TableCell>
                              <TableCell>{division.class_teacher}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditDivisionClick(division, classItem)}
                                    className="text-green-600 hover:bg-green-100 hover:text-green-600"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDivisionClick(division)}
                                    className="text-red-600 hover:bg-red-100 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-600 text-center">
                        {t('classManagement.noDivisionsFound')}
                      </p>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Division Dialog */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('classManagement.addDivisionTitle', { className: selectedClass?.class_name })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="division-name">{t('classManagement.divisionNameLabel')}</Label>
              <Input
                id="division-name"
                placeholder={t('classManagement.divisionNamePlaceholder')}
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
              />
              {divisionFormErrors.divisionName && (
                <p className="text-sm text-red-500">{divisionFormErrors.divisionName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher-name">{t('classManagement.classTeacherLabel')}</Label>
              {loadingTeachers ? (
                <p>{t('classManagement.loadingTeachers')}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={classTeacher} onValueChange={setClassTeacher}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('classManagement.selectTeacher')} />
                    </SelectTrigger>

                    <SelectContent>
                      {teachersList
                        .filter((teacher) => !assignedTeacherNames.includes(teacher.name))
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.name}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTeacherModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </Button> */}
                </div>
              )}
              {divisionFormErrors.classTeacher && (
                <p className="text-sm text-red-500">{divisionFormErrors.classTeacher}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-count">{t('classManagement.expectedStudentsLabel')}</Label>
              <Input
                id="student-count"
                type="number"
                placeholder="45"
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(e.target.value)}
              />
              {divisionFormErrors.expectedStudents && (
                <p className="text-sm text-red-500">{divisionFormErrors.expectedStudents}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDivisionDialogOpen(false)}>
                {t('classManagement.cancel')}
              </Button>
              <Button onClick={handleDivisionSubmit}>{t('classManagement.addDivision')}</Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      <CreateTeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onTeacherCreated={handleTeacherCreated}
      />
      {/* Delete Division Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.deleteDivisionTitle')}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              <Trans
                i18nKey="classManagement.deleteDivisionDesc"
                values={{ name: divisionToDelete?.division_name }}
              >
                You are about to delete the division <strong>{'{{name}}'}</strong>. This action
                cannot be undone.
              </Trans>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('classManagement.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDivision}>
              {t('classManagement.delete')}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
      {/* Edit Division Dialog */}
      <Dialog open={isEditDivisionDialogOpen} onOpenChange={setIsEditDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.editDivisionTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-division-name">{t('classManagement.divisionNameLabel')}</Label>
              <Input
                id="edit-division-name"
                value={editDivisionName}
                onChange={(e) => setEditDivisionName(e.target.value)}
              />

              {editDivisionFormErrors.divisionName && (
                <p className="text-sm text-red-500">{editDivisionFormErrors.divisionName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-teacher-name">{t('classManagement.classTeacherLabel')}</Label>
              <Select value={editClassTeacher} onValueChange={setEditClassTeacher}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('classManagement.selectTeacher')} />
                </SelectTrigger>

                <SelectContent>
                  {teachersList
                    .filter(
                      (teacher) =>
                        !assignedTeacherNames.includes(teacher.name) ||
                        teacher.name === selectedDivisionForEdit?.class_teacher
                    )
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editDivisionFormErrors.classTeacher && (
                <p className="text-sm text-red-500">{editDivisionFormErrors.classTeacher}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-student-count">{t('classManagement.expectedStudentsLabel')}</Label>
              <Input
                id="edit-student-count"
                type="number"

                value={editExpectedStudents}
                onChange={(e) => setEditExpectedStudents(e.target.value)}
              />
              {editDivisionFormErrors.expectedStudents && (
                <p className="text-sm text-red-500">{editDivisionFormErrors.expectedStudents}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDivisionDialogOpen(false)}>
                {t('classManagement.cancel')}
              </Button>
              <Button onClick={handleEditDivisionSubmit}>{t('classManagement.saveChanges')}</Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Class Confirmation Dialog */}
      <Dialog open={isDeleteClassDialogOpen} onOpenChange={setIsDeleteClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.deleteClassTitle')}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              <Trans
                i18nKey="classManagement.deleteClassDesc"
                values={{ name: classToDelete?.class_name }}
              >
                You are about to delete the class <strong>{'{{name}}'}</strong>. This action cannot
                be undone.
              </Trans>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteClassDialogOpen(false)}>
              {t('classManagement.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteClass}>
              {t('classManagement.delete')}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classManagement.editClassTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">{t('classManagement.classNameLabel')}</Label>
              <Input
                id="edit-class-name"

                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
              />
              {editClassFormErrors.className && (
                <p className="text-sm text-red-500">{editClassFormErrors.className}</p>
              )}
              {schoolSection && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('classManagement.sectionInherited', { section: schoolSection })}
                </p>
              )}
            </div>
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fee-amount">Fee Amount</Label>
                <Input
                  id="edit-fee-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={editFeeAmount}
                  onChange={(e) => setEditFeeAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-late-fee-penalty">Late Fee Penalty</Label>
                <Input
                  id="edit-late-fee-penalty"
                  type="number"
                  placeholder="e.g., 100"
                  value={editLateFeePenalty}
                  onChange={(e) => setEditLateFeePenalty(e.target.value)}
                />
              </div>
            </div> */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditClassDialogOpen(false)}>
                {t('classManagement.cancel')}
              </Button>
              <Button onClick={handleEditClassSubmit}>{t('classManagement.saveChanges')}</Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
