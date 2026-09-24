import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { trustSchoolApi } from '@/api/trust/schools';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';
import { Eye, EyeOff, Plus, X, Pencil, Trash2, Save, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';

interface DivisionData {
  id: string;
  division_name: string;
  class_teacher: string;
  teacher_id?: number;
  teacher_email?: string;
  teacher_phone?: string;
  teacher_password?: string;
  teacher_subject?: string;
  expected_students: number;
}

interface ClassData {
  id: string;
  class_name: string;
  divisions: DivisionData[];
}

interface Teacher {
  id?: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  subject?: string;
}

interface SummaryRow {
  id: string;
  section: string;
  class_name: string;
  division_name: string;
  teacher_name: string;
  teacher_id?: number;
  expected_students: number;
  editing?: boolean;
}

export function CreateSchoolTrustAdmin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  // School Basic Info
  const [section, setSection] = useState<string>('');
  const [customSectionName, setCustomSectionName] = useState('');
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('Auto-generated');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Classes and Divisions
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [customClassName, setCustomClassName] = useState('');
  const [showCustomClassInput, setShowCustomClassInput] = useState(false);

  // Division Form
  const [divisionName, setDivisionName] = useState('');
  const [showCustomDivisionInput, setShowCustomDivisionInput] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [expectedStudents, setExpectedStudents] = useState<number>(0);

  // Teachers
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    subject: '',
    status: 'Active',
  });
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  // Summary Table
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SummaryRow>>({});

  // Predefined sections and classes
  const predefinedSections = [
    'Pre-Primary',
    'Primary',
    'Secondary',
    'Higher Secondary',
    'Graduation',
    'Post Graduation',
  ];

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

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

  // Handle subject selection
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

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      toast.error(t('createSchool.enterSubjectName'));
      return;
    }

    if (subjects.find((s) => s.name.toLowerCase() === customSubjectName.trim().toLowerCase())) {
      setNewTeacher({ ...newTeacher, subject: customSubjectName.trim() });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success && response.data) {
        setSubjects([...subjects, response.data]);
        setNewTeacher({ ...newTeacher, subject: response.data.name });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success(t('createSchool.subjectAdded'));
      }
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast.error(error.response?.data?.message || t('createSchool.failedCreateSubject'));
    }
  };

  const sectionClassMap: Record<string, string[]> = {
    'Pre-Primary': ['Playschool', 'Nursery', 'LKG', 'UKG', 'Junior', 'Senior'],
    Primary: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
    Secondary: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    'Higher Secondary': ['Class 11', 'Class 12'],
  };

  const getAvailableClasses = (): string[] => {
    if (!section) return [];
    if (sectionClassMap[section]) {
      return sectionClassMap[section];
    }
    return [];
  };

  const getExistingDivisions = (className: string): string[] => {
    const classData = classes.find((c) => c.class_name === className);
    if (!classData) return [];
    return classData.divisions.map((d) => d.division_name);
  };

  const handleSectionChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomSectionInput(true);
      setSection('');
    } else {
      setSection(value);
      setShowCustomSectionInput(false);
      setCustomSectionName('');
      setClasses([]);
      setSummaryData([]);
      setErrors({ ...errors, section: '' });
    }
  };

  const handleCustomSectionSubmit = () => {
    if (!customSectionName.trim()) {
      toast.error(t('createSchool.enterSectionName'));
      return;
    }
    setSection(customSectionName.trim());
    setShowCustomSectionInput(false);
    setCustomSectionName('');
    setClasses([]);
    setSummaryData([]);
  };

  const handleClassChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomClassInput(true);
      setSelectedClass('');
    } else {
      setSelectedClass(value);
      setShowCustomClassInput(false);
      setCustomClassName('');
    }
  };

  const handleCustomClassSubmit = () => {
    if (!customClassName.trim()) {
      toast.error(t('createSchool.enterClassName'));
      return;
    }
    if (classes.find((c) => c.class_name === customClassName.trim())) {
      toast.error(t('createSchool.classExists'));
      return;
    }
    setSelectedClass(customClassName.trim());
    setShowCustomClassInput(false);
    setCustomClassName('');
  };

  const handleDivisionChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomDivisionInput(true);
      setDivisionName('');
    } else {
      setDivisionName(value);
      setShowCustomDivisionInput(false);
    }
  };

  const handleAddDivision = () => {
    if (!selectedClass) {
      toast.error(t('createSchool.selectClassFirst'));
      return;
    }
    if (!divisionName.trim()) {
      toast.error(t('createSchool.divisionRequired'));
      return;
    }
    if (!expectedStudents || expectedStudents <= 0) {
      toast.error(t('createSchool.studentsRequired'));
      return;
    }

    const classData = classes.find((c) => c.class_name === selectedClass);
    const existingDivisions = classData ? classData.divisions.map((d) => d.division_name) : [];

    if (existingDivisions.includes(divisionName.trim())) {
      toast.error(t('createSchool.divisionExists'));
      return;
    }

    const teacher = teachers.find((t) => t.name === selectedTeacher);
    const divisionId = `${selectedClass}-${divisionName.trim()}-${Date.now()}`;

    const newDivision: DivisionData = {
      id: divisionId,
      division_name: divisionName.trim(),
      class_teacher: selectedTeacher,
      teacher_id: teacher?.id,
      teacher_email: teacher?.email,
      teacher_phone: teacher?.phone,
      teacher_password: teacher?.password,
      teacher_subject: teacher?.subject,
      expected_students: expectedStudents,
    };

    if (classData) {
      setClasses(
        classes.map((cls) =>
          cls.class_name === selectedClass
            ? { ...cls, divisions: [...cls.divisions, newDivision] }
            : cls
        )
      );
    } else {
      const newClass: ClassData = {
        id: `class-${Date.now()}`,
        class_name: selectedClass,
        divisions: [newDivision],
      };
      setClasses([...classes, newClass]);
    }

    const summaryRow: SummaryRow = {
      id: divisionId,
      section: section,
      class_name: selectedClass,
      division_name: divisionName.trim(),
      teacher_name: selectedTeacher,
      teacher_id: teacher?.id,
      expected_students: expectedStudents,
    };
    setSummaryData([...summaryData, summaryRow]);

    setDivisionName('');
    setShowCustomDivisionInput(false);
    setSelectedTeacher('');
    setExpectedStudents(0);

    toast.success(t('createSchool.divisionAdded'));
  };

  const handleQuickCreateTeacher = () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast.error(t('createSchool.teacherRequired'));
      return;
    }

    if (teachers.find((t) => t.email.toLowerCase() === newTeacher.email.toLowerCase())) {
      toast.error(t('createSchool.teacherEmailExists'));
      return;
    }

    const tempTeacher: Teacher = {
      name: newTeacher.name.trim(),
      email: newTeacher.email.trim(),
      phone: newTeacher.phone.trim() || '',
      password: newTeacher.password,
      subject: newTeacher.subject || undefined,
    };

    setTeachers([...teachers, tempTeacher]);
    setSelectedTeacher(tempTeacher.name);
    setIsTeacherModalOpen(false);
    setNewTeacher({ name: '', email: '', phone: '', password: '', subject: '', status: 'Active' });
    setShowTeacherPassword(false);
    toast.success(t('createSchool.teacherAdded'));
  };

  const handleEditRow = (row: SummaryRow) => {
    setEditingRowId(row.id);
    setEditFormData({
      division_name: row.division_name,
      teacher_name: row.teacher_name,
      expected_students: row.expected_students,
    });
  };

  const handleSaveEdit = () => {
    if (!editingRowId) return;

    const row = summaryData.find((r) => r.id === editingRowId);
    if (!row) return;

    if (!editFormData.division_name?.trim() || !editFormData.expected_students) {
      toast.error(t('createSchool.fillFields'));
      return;
    }

    const updatedSummary = summaryData.map((r) =>
      r.id === editingRowId
        ? {
          ...r,
          division_name: editFormData.division_name!.trim(),
          teacher_name: editFormData.teacher_name!,
          teacher_id: teachers.find((t) => t.name === editFormData.teacher_name)?.id,
          expected_students: editFormData.expected_students!,
        }
        : r
    );
    setSummaryData(updatedSummary);

    const editedTeacher = teachers.find((t) => t.name === editFormData.teacher_name);

    setClasses(
      classes.map((cls) => {
        if (cls.class_name === row.class_name) {
          return {
            ...cls,
            divisions: cls.divisions.map((div) =>
              div.id === editingRowId
                ? {
                  ...div,
                  division_name: editFormData.division_name!.trim(),
                  class_teacher: editFormData.teacher_name!,
                  teacher_id: editedTeacher?.id,
                  teacher_email: editedTeacher?.email,
                  teacher_phone: editedTeacher?.phone,
                  teacher_password: editedTeacher?.password,
                  teacher_subject: editedTeacher?.subject,
                  expected_students: editFormData.expected_students!,
                }
                : div
            ),
          };
        }
        return cls;
      })
    );

    setEditingRowId(null);
    setEditFormData({});
    toast.success(t('createSchool.divisionUpdated'));
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  const handleDeleteRow = (rowId: string) => {
    const row = summaryData.find((r) => r.id === rowId);
    if (!row) return;

    setSummaryData(summaryData.filter((r) => r.id !== rowId));

    setClasses(
      classes.map((cls) => {
        if (cls.class_name === row.class_name) {
          return {
            ...cls,
            divisions: cls.divisions.filter((div) => div.id !== rowId),
          };
        }
        return cls;
      })
    );

    toast.success(t('createSchool.divisionDeleted'));
  };

  const handleRemoveClass = (className: string) => {
    setClasses(classes.filter((c) => c.class_name !== className));
    setSummaryData(summaryData.filter((r) => r.class_name !== className));

    if (selectedClass === className) {
      setSelectedClass('');
    }
    toast.success(t('createSchool.classRemoved'));
  };

  const handleSubmit = async () => {
    const tempErrors: any = {};

    if (!section) tempErrors.section = t('createSchool.section') + ' is required';
    if (!schoolName.trim()) tempErrors.schoolName = t('createSchool.schoolName') + ' is required';
    if (!email.trim()) tempErrors.email = t('createSchool.email') + ' is required';
    if (!phone.trim()) tempErrors.phone = t('createSchool.phone') + ' is required';
    if (!address.trim()) tempErrors.address = t('createSchool.address') + ' is required';
    if (!city.trim()) tempErrors.city = t('createSchool.city') + ' is required';
    if (!stateRegion.trim()) tempErrors.stateRegion = t('createSchool.state') + ' is required';
    if (!country.trim()) tempErrors.country = t('createSchool.country') + ' is required';
    if (!pincode.trim()) tempErrors.pincode = t('createSchool.pincode') + ' is required';
    if (!password) tempErrors.password = t('createSchool.password') + ' is required';
    if (password !== confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';
    if (classes.length === 0 || summaryData.length === 0) {
      tempErrors.classes = 'At least one class with division is required';
    }

     if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      toast.error(t('createSchool.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const schoolData = {
        schoolName: schoolName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateRegion.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
        password: password,
        section: section,
        classes: classes.map((cls) => ({
          class_name: cls.class_name,
          divisions: cls.divisions.map((div) => {
            const teacher = teachers.find((t) => t.name === div.class_teacher);
            const divisionPayload: Record<string, string | number> = {
              division_name: div.division_name,
              class_teacher: div.class_teacher,
              expected_students: div.expected_students,
            };

            const teacherEmail = div.teacher_email || teacher?.email;
            const teacherPassword = div.teacher_password || teacher?.password;
            const teacherPhone = div.teacher_phone || teacher?.phone;
            const teacherSubject = div.teacher_subject || teacher?.subject;
            const teacherId = div.teacher_id || teacher?.id;

            if (teacherId && teacherId > 0) {
              divisionPayload.teacher_id = teacherId;
            }
            if (teacherEmail) {
              divisionPayload.teacher_email = teacherEmail;
            }
            if (teacherPassword) {
              divisionPayload.teacher_password = teacherPassword;
            }
            if (teacherPhone) {
              divisionPayload.teacher_phone = teacherPhone;
            }
            if (teacherSubject) {
              divisionPayload.teacher_subject = teacherSubject;
            }

            return divisionPayload;
          }),
        })),
      };
      const response = await trustSchoolApi.createSchool(schoolData);
      if (response.success) {
        toast.success(t('createSchool.schoolCreated'));
        navigate('/super-dashboard/super-schools');
      } else {
        toast.error(response.message || t('createSchool.failedCreateSchool'));
      }
    } catch (error: any) {
      console.error('Error creating school:', error);
      toast.error(error.response?.data?.message || t('createSchool.failedCreateSchool'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-5 bg-white">
      <div className="">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('createSchool.title')}</h1>
          <p className="text-gray-600 mt-1">{t('createSchool.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
          <Card className="lg:col-span-3 rounded-2xl border border-gray-300 shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('createSchool.schoolInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section Selection */}
                <div>
                  <Label htmlFor="section" className="text-sm font-medium">
                    {t('createSchool.section')} <span className="text-red-500">*</span>
                  </Label>
                  {!showCustomSectionInput ? (
                    <div className="space-y-2">
                      <Select value={section} onValueChange={handleSectionChange}>
                        <SelectTrigger className="h-10 mt-1">
                          <SelectValue placeholder={t('createSchool.selectOrAddSection')} />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedSections.map((sec) => (
                            <SelectItem key={sec} value={sec}>
                              {sec}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__" className="font-semibold text-blue-600">
                            {t('createSchool.addCustomSection')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {section && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {t('createSchool.selected', { value: section })}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('createSchool.enterCustomSection')}
                          value={customSectionName}
                          onChange={(e) => setCustomSectionName(e.target.value)}
                          className="h-10"
                          onKeyPress={(e) => e.key === 'Enter' && handleCustomSectionSubmit()}
                        />
                        <Button onClick={handleCustomSectionSubmit} size="sm">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCustomSectionInput(false);
                            setCustomSectionName('');
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {errors.section && <p className="text-sm text-red-500 mt-1">{errors.section}</p>}
                </div>

                <div>
                  <Label htmlFor="schoolName" className="text-sm font-medium">
                    {t('createSchool.schoolName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => {
                      setSchoolName(e.target.value);
                      setErrors({ ...errors, schoolName: '' });
                    }}
                    placeholder={t('createSchool.schoolNamePlaceholder')}
                    className="h-10 mt-1"
                  />
                  {errors.schoolName && (
                    <p className="text-sm text-red-500 mt-1">{errors.schoolName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="schoolCode" className="text-sm font-medium">
                    {t('createSchool.schoolCode')}
                  </Label>
                  <Input
                    id="schoolCode"
                    value={t('createSchool.schoolCodeValue')}
                    disabled
                    className="h-10 mt-1 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('createSchool.schoolCodeHint')}</p>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('createSchool.email')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    placeholder="admin@school.edu"
                    className="h-10 mt-1"
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t('createSchool.phone')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="+91 XXXXX XXXXX"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className="h-10 mt-1"
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    {t('createSchool.address')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors({ ...errors, address: '' });
                    }}
                    placeholder={t('createSchool.addressPlaceholder')}
                    className="h-10 mt-1"
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    {t('createSchool.city')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setErrors({ ...errors, city: '' });
                    }}
                    placeholder={t('createSchool.city')}
                    className="h-10 mt-1"
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    {t('createSchool.state')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={stateRegion}
                    onChange={(e) => {
                      setStateRegion(e.target.value);
                      setErrors({ ...errors, stateRegion: '' });
                    }}
                    placeholder={t('createSchool.state')}
                    className="h-10 mt-1"
                  />
                  {errors.stateRegion && (
                    <p className="text-sm text-red-500 mt-1">{errors.stateRegion}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm font-medium">
                    {t('createSchool.country')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setErrors({ ...errors, country: '' });
                    }}
                    placeholder={t('createSchool.country')}
                    className="h-10 mt-1"
                  />
                  {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
                </div>

                <div>
                  <Label htmlFor="pincode" className="text-sm font-medium">
                    {t('createSchool.pincode')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setErrors({ ...errors, pincode: '' });
                    }}
                    maxLength={6}
                    placeholder={t('createSchool.pincodePlaceholder')}
                    className="h-10 mt-1"
                  />
                  {errors.pincode && <p className="text-sm text-red-500 mt-1">{errors.pincode}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('createSchool.password')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({ ...errors, password: '' });
                      }}
                      placeholder={t('createSchool.passwordPlaceholder')}
                      className="h-10 mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 hover:text-orange-600" />
                      ) : (
                        <Eye className="h-4 w-4 hover:text-orange-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t('createSchool.confirmPassword')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({ ...errors, confirmPassword: '' });
                      }}
                      placeholder={t('createSchool.confirmPasswordPlaceholder')}
                      className="h-10 mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 hover:text-orange-600" />
                      ) : (
                        <Eye className="h-4 w-4 hover:text-orange-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classes and Divisions Configuration */}
          {section && (
            <Card className="lg:col-span-2 rounded-2xl border border-gray-300 shadow-lg h-fit px-4 py-2">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {t('createSchool.classDivConfig')}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {t('createSchool.classDivSubtitle', { section })
                    .replace('<1>', '')
                    .replace('</1>', '')}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {t('createSchool.selectClass')} <span className="text-red-500">*</span>
                  </Label>
                  {!showCustomClassInput ? (
                    <div className="flex gap-2">
                      <Select
                        value={selectedClass}
                        onValueChange={handleClassChange}
                        disabled={!section}
                      >
                        <SelectTrigger className="h-10 flex-1">
                          <SelectValue placeholder={t('createSchool.selectOrAddClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableClasses().map((className) => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                          <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                            {t('createSchool.addNewClass')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('createSchool.enterCustomClass')}
                        value={customClassName}
                        onChange={(e) => setCustomClassName(e.target.value)}
                        className="h-10 flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomClassSubmit()}
                      />
                      <Button onClick={handleCustomClassSubmit} size="sm">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomClassInput(false);
                          setCustomClassName('');
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Division Form */}
                {selectedClass && (
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {t('createSchool.addDivisionTo', { className: selectedClass })}
                      </h3>
                      <Badge variant="outline" className="bg-blue-50">
                        {t('createSchool.divisionsAdded', {
                          count: getExistingDivisions(selectedClass).length,
                        })}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Division Name */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          {t('createSchool.division')} <span className="text-red-500">*</span>
                        </Label>
                        {!showCustomDivisionInput ? (
                          <Select value={divisionName} onValueChange={handleDivisionChange}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={t('createSchool.selectOrAddDivision')} />
                            </SelectTrigger>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F'].map((div) => (
                                <SelectItem key={div} value={div}>
                                  {div}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="__add_new__"
                                className="font-semibold text-blue-600"
                              >
                                {t('createSchool.addNewDivision')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={t('createSchool.enterDivisionName')}
                            value={divisionName}
                            onChange={(e) => setDivisionName(e.target.value)}
                            className="h-10"
                            autoFocus
                          />
                        )}
                      </div>

                      {/* Teacher Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t('createSchool.teacher')}</Label>
                        <Select
                          value={selectedTeacher}
                          onValueChange={(value) => {
                            if (value === '__add_new__') {
                              setIsTeacherModalOpen(true);
                            } else {
                              setSelectedTeacher(value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder={t('createSchool.selectTeacher')} />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.email} value={teacher.name}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                              {t('createSchool.addNewTeacher')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Number of Students */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          {t('createSchool.noOfStudents')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder={t('createSchool.enterNumber')}
                          value={expectedStudents || ''}
                          onChange={(e) => setExpectedStudents(parseInt(e.target.value) || 0)}
                          className="h-10"
                          min="1"
                        />
                      </div>

                      {/* Add Button */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium opacity-0">Action</Label>
                        <Button
                          onClick={handleAddDivision}
                          className="w-full h-10"
                          disabled={!divisionName || !expectedStudents}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('createSchool.addDivision')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Classes Display */}
                {classes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('createSchool.selectedClasses')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {classes.map((classItem) => (
                        <Badge
                          key={classItem.id}
                          variant="outline"
                          className="bg-green-50 text-green-700 px-3 py-1.5 flex items-center gap-2"
                        >
                          <span>{classItem.class_name}</span>
                          <span className="text-xs text-gray-500">
                            ({classItem.divisions.length} {t('createSchool.div')})
                          </span>
                          <button
                            onClick={() => handleRemoveClass(classItem.class_name)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {errors.classes && <p className="text-sm text-red-500">{errors.classes}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Table */}
        {summaryData.length > 0 && (
          <Card className="my-8 rounded-2xl border border-gray-300 shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {t('createSchool.configSummary')}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t('createSchool.configSummarySubtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">{t('createSchool.tableSection')}</TableHead>
                      <TableHead className="w-[150px]">{t('createSchool.tableClass')}</TableHead>
                      <TableHead className="w-[120px]">{t('createSchool.tableDivision')}</TableHead>
                      <TableHead className="w-[200px]">{t('createSchool.tableTeacher')}</TableHead>
                      <TableHead className="w-[120px]">{t('createSchool.tableStudents')}</TableHead>
                      <TableHead className="w-[120px] text-right">
                        {t('createSchool.tableActions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="bg-blue-50">
                            {row.section}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{row.class_name}</TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input
                              value={editFormData.division_name || ''}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, division_name: e.target.value })
                              }
                              className="h-8 w-20"
                            />
                          ) : (
                            <Badge variant="outline">{row.division_name}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Select
                              value={editFormData.teacher_name || ''}
                              onValueChange={(value) =>
                                setEditFormData({ ...editFormData, teacher_name: value })
                              }
                            >
                              <SelectTrigger className="h-8 w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.email} value={teacher.name}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            row.teacher_name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input
                              type="number"
                              value={editFormData.expected_students || ''}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  expected_students: parseInt(e.target.value) || 0,
                                })
                              }
                              className="h-8 w-24"
                              min="1"
                            />
                          ) : (
                            <span className="font-medium">{row.expected_students}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingRowId === row.id ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveEdit}
                                className="h-8"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRow(row)}
                                className="h-8"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRow(row.id)}
                                className="h-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/super-dashboard/super-schools')}>
            {t('createSchool.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? t('createSchool.creating') : t('createSchool.createSchool')}
          </Button>
        </div>
      </div>

      {/* Quick Create Teacher Modal */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createSchool.addNewTeacherTitle')}</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {t('createSchool.addNewTeacherSubtitle')}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Separator />
            <h3 className="text-sm font-semibold text-[#D47A00] mb-3">
              {t('createSchool.basicInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacherName" className="text-sm font-medium">
                  {t('createSchool.fullName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teacherName"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder={t('createSchool.fullNamePlaceholder')}
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="teacherEmail" className="text-sm font-medium">
                  {t('createSchool.email')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teacherEmail"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="teacher@school.edu"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="teacherPhone" className="text-sm font-medium">
                  {t('createSchool.phoneNumber')}
                </Label>
                <Input
                  id="teacherPhone"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="teacherPassword" className="text-sm font-medium">
                  {t('createSchool.teacherPassword')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="teacherPassword"
                    type={showTeacherPassword ? 'text' : 'password'}
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    placeholder={t('createSchool.passwordPlaceholder')}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showTeacherPassword ? (
                      <EyeOff className="h-4 w-4 hover:text-orange-600" />
                    ) : (
                      <Eye className="h-4 w-4 hover:text-orange-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Separator />

            <h3 className="text-sm font-semibold text-[#D47A00] mb-3">
              {t('createSchool.professionalDetails')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacherSubject" className="text-sm font-medium">
                  {t('createSchool.subjectDept')}
                </Label>
                {!showCustomSubjectInput ? (
                  <Select value={newTeacher.subject} onValueChange={handleSubjectChange}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder={t('createSchool.selectSubjectOrAdd')} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="font-semibold text-blue-600">
                        {t('createSchool.addNewSubject')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder={t('createSchool.enterNewSubject')}
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      className="h-10 flex-1"
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
              </div>
              <div>
                <Label htmlFor="teacherStatus" className="text-sm font-medium">
                  {t('createSchool.status')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newTeacher.status}
                  onValueChange={(value) =>
                    setNewTeacher({ ...newTeacher, status: value as 'Active' | 'Inactive' })
                  }
                >
                  <SelectTrigger className="h-10 mt-1">
                    <SelectValue placeholder={t('createSchool.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t('createSchool.active')}</SelectItem>
                    <SelectItem value="Inactive">{t('createSchool.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTeacherModalOpen(false);
                setNewTeacher({
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  subject: '',
                  status: 'Active',
                });
                setShowTeacherPassword(false);
                setShowCustomSubjectInput(false);
                setCustomSubjectName('');
              }}
            >
              {t('createSchool.cancel')}
            </Button>
            <Button
              onClick={handleQuickCreateTeacher}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {t('createSchool.createAddTeacher')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}