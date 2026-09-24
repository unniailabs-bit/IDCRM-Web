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
import { schoolService } from '@/api/schoolService';
import { trustService } from '@/api/trustService';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  Plus,
  X,
  Pencil,
  Trash2,
  Save,
  XCircle,
  Users,
  GraduationCap,
  Eye as EyeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DivisionData {
  id: string;
  division_name: string;
  class_teacher: string;
  teacher_id?: number;
  expected_students: number;
}

interface ClassData {
  id: string;
  class_name: string;
  divisions: DivisionData[];
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
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

export function CreateSchool() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allTrusts, setAllTrusts] = useState<any[]>([]);

  // School Basic Info
  const [section, setSection] = useState<string>('');
  const [customSectionName, setCustomSectionName] = useState('');
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [trustId, setTrustId] = useState<number>(0);
  const [trustName, setTrustName] = useState('');
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
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdSchool, setCreatedSchool] = useState<any>(null);

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
  const sectionClassMap: Record<string, string[]> = {
    'Pre-Primary': ['Playschool', 'Nursery', 'LKG', 'UKG', 'Junior', 'Senior'],
    Primary: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
    Secondary: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    'Higher Secondary': ['Class 11', 'Class 12'],
  };

  // Get available classes for current section
  const getAvailableClasses = (): string[] => {
    if (!section) return [];
    if (sectionClassMap[section]) {
      return sectionClassMap[section];
    }
    // For custom sections, return empty array or allow any class
    return [];
  };

  useEffect(() => {
    fetchTrusts();
    loadSubjects();
  }, []);

  const fetchTrusts = async () => {
    try {
      const response = await trustService.getAllTrusts();
      if (response && response.data) {
        setAllTrusts(response.data);
      }
    } catch (error) {
      console.error('Error fetching trusts:', error);
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

  const handleSectionChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomSectionInput(true);
      setSection('');
    } else {
      setSection(value);
      setShowCustomSectionInput(false);
      setCustomSectionName('');
      setClasses([]); // Reset classes when section changes
      setSummaryData([]);
      setErrors({ ...errors, section: '' });
    }
  };

  const handleCustomSectionSubmit = () => {
    if (!customSectionName.trim()) {
      toast.error(t('schools.enterCustomSection'));
      return;
    }
    setSection(customSectionName.trim());
    setShowCustomSectionInput(false);
    setCustomSectionName('');
    setClasses([]); // Reset classes when section changes
    setSummaryData([]);
  };

  const handleTrustChange = (value: string) => {
    const selectedTrust = allTrusts.find((trust) => trust.trust_name === value);
    if (selectedTrust) {
      setTrustId(selectedTrust.id);
      setTrustName(value);
    }
  };

  const handleClassSelect = (className: string) => {
    if (classes.find((c) => c.class_name === className)) {
      toast.error(t('classManagement.classAlreadyExists'));
      return;
    }

    const newClass: ClassData = {
      id: `class-${Date.now()}-${Math.random()}`,
      class_name: className,
      divisions: [],
    };

    setClasses([...classes, newClass]);
    setSelectedClass(className);
    setCustomClassName('');
    setShowCustomClassInput(false);
  };

  const handleAddCustomClass = () => {
    if (!customClassName.trim()) return;
    handleClassSelect(customClassName.trim());
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
    if (!selectedClass || !divisionName.trim() || !selectedTeacher || !expectedStudents) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    const selectedClassData = classes.find((c) => c.class_name === selectedClass);
    if (!selectedClassData) return;

    const teacher = teachers.find((t) => t.name === selectedTeacher);
    if (!teacher) {
      toast.error('Teacher not found');
      return;
    }

    const divisionId = `div-${Date.now()}-${Math.random()}`;
    const newDivision: DivisionData = {
      id: divisionId,
      division_name: divisionName.trim(),
      class_teacher: selectedTeacher,
      teacher_id: teacher.id,
      expected_students: expectedStudents,
    };

    const updatedClasses = classes.map((cls) => {
      if (cls.class_name === selectedClass) {
        return {
          ...cls,
          divisions: [...cls.divisions, newDivision],
        };
      }
      return cls;
    });

    setClasses(updatedClasses);

    const summaryRow: SummaryRow = {
      id: divisionId,
      section: section,
      class_name: selectedClass,
      division_name: newDivision.division_name,
      teacher_name: newDivision.class_teacher,
      teacher_id: newDivision.teacher_id,
      expected_students: newDivision.expected_students,
    };

    setSummaryData([...summaryData, summaryRow]);

    setDivisionName('');
    setSelectedTeacher('');
    setExpectedStudents(0);
    setShowCustomDivisionInput(false);
    toast.success(t('classManagement.createDivisionSuccess'));
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast.error('Please fill all required teacher fields');
      return;
    }

    const teacher: Teacher = {
      id: teachers.length + 1,
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone || '',
    };

    setTeachers([...teachers, teacher]);
    setNewTeacher({ name: '', email: '', phone: '', password: '', subject: '', status: 'Active' });
    setIsTeacherModalOpen(false);
    toast.success(t('teachers.createSuccess'));
  };

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
      toast.error('Please enter a subject name');
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
      if (response.success) {
        setSubjects([...subjects, response.data]);
        setNewTeacher({ ...newTeacher, subject: customSubjectName.trim() });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        toast.success('Subject added successfully');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(t('teachers.fetchError'));
    }
  };

  const handleSaveRow = (rowId: string) => {
    const row = summaryData.find((r) => r.id === rowId);
    if (
      !row ||
      !editFormData.division_name ||
      !editFormData.teacher_name ||
      !editFormData.expected_students
    ) {
      toast.error('Please fill all fields');
      return;
    }

    setSummaryData(summaryData.map((r) => (r.id === rowId ? { ...r, ...editFormData } : r)));

    setClasses(
      classes.map((cls) => {
        if (cls.class_name === row.class_name) {
          return {
            ...cls,
            divisions: cls.divisions.map((div) =>
              div.id === rowId
                ? {
                  ...div,
                  division_name: editFormData.division_name!,
                  class_teacher: editFormData.teacher_name!,
                  teacher_id: teachers.find((t) => t.name === editFormData.teacher_name)?.id,
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
    toast.success(t('classManagement.updateDivisionSuccess'));
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
    toast.success(t('classManagement.deleteDivisionSuccess'));
  };

  const handleRemoveClass = (className: string) => {
    setClasses(classes.filter((c) => c.class_name !== className));
    setSummaryData(summaryData.filter((r) => r.class_name !== className));
    if (selectedClass === className) {
      setSelectedClass('');
    }
    toast.success(t('classManagement.deleteClassSuccess'));
  };

  const handleSubmit = async () => {
    const tempErrors: any = {};

    if (!trustId) tempErrors.trustId = 'Trust is required';
    if (!section) tempErrors.section = 'Section is required';
    if (!schoolName.trim()) tempErrors.schoolName = 'School name is required';
    if (!email.trim()) tempErrors.email = 'Email is required';
    if (!phone.trim()) {
      tempErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(phone)) {
      tempErrors.phone = t('schools.invalidPhone');
    }
    if (!address.trim()) tempErrors.address = 'Address is required';
    if (!city.trim()) tempErrors.city = 'City is required';
    if (!stateRegion.trim()) tempErrors.stateRegion = 'State is required';
    if (!country.trim()) tempErrors.country = 'Country is required';
    if (!pincode.trim()) tempErrors.pincode = 'Pincode is required';
    if (!password) tempErrors.password = 'Password is required';
    if (password !== confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';
    if (classes.length === 0 || summaryData.length === 0) {
      tempErrors.classes = 'At least one class with division is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const schoolData = {
        schoolName: schoolName.trim(),
        trustId: trustId,
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
          section: section,
          divisions: cls.divisions.map((div) => ({
            division_name: div.division_name,
            class_teacher: div.class_teacher,
            teacher_id: div.teacher_id,
            expected_students: div.expected_students,
          })),
        })),
      };

      const response = await schoolService.createSchool(schoolData);

      if (response.success) {
        setCreatedSchool(response.data);
        setIsSuccessDialogOpen(true);
        toast.success(t('schools.createSuccessTitle'));
      } else {
        toast.error(response.message || t('schools.fetchError'));
      }
    } catch (error: any) {
      console.error('Error creating school:', error);
      toast.error(error.response?.data?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    const credentials = `School Name: ${createdSchool?.school_name || schoolName
      }\nEmail: ${email}\nSchool Code: ${createdSchool?.school_code || 'N/A'}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  const handleSendCredentials = async () => {
    try {
      if (createdSchool) {
        await schoolService.sendSchoolCredentials(createdSchool.id, { email, password });
        toast.success('Credentials sent successfully');
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast.error('Failed to send credentials');
    }
  };

  return (
    <div className="px-8 py-5 bg-white">
      <div className="">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('schools.createTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('schools.createSubtitle')}</p>
        </div>

        {/* School Basic Information */}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
          <Card className="lg:col-span-3 rounded-2xl border border-gray-300 shadow-lg h-fit">
            <CardHeader className="">
              <CardTitle className="text-xl font-semibold">{t('schools.schoolInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trust Selection */}
                <div>
                  <Label htmlFor="trust" className="text-sm font-medium">
                    {t('schools.trust')} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={trustName} onValueChange={handleTrustChange}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder={t('schools.selectTrust')} />
                    </SelectTrigger>
                    <SelectContent>
                      {allTrusts.map((trust) => (
                        <SelectItem key={trust.id} value={trust.trust_name}>
                          {trust.trust_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.trustId && <p className="text-sm text-red-500 mt-1">{errors.trustId}</p>}
                </div>

                {/* Section Selection */}
                <div>
                  <Label htmlFor="section" className="text-sm font-medium">
                    {t('schools.section')} <span className="text-red-500">*</span>
                  </Label>
                  {!showCustomSectionInput ? (
                    <div className="space-y-2">
                      <Select value={section} onValueChange={handleSectionChange}>
                        <SelectTrigger className="h-10 mt-1">
                          <SelectValue placeholder={t('schools.selectOrAddSection')} />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedSections.map((sec) => (
                            <SelectItem key={sec} value={sec}>
                              {t(`sections.${sec}`)}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__" className="font-semibold text-blue-600">
                            + {t('schools.addCustomSection')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {section && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {t('schools.selectedSection')}: {predefinedSections.includes(section) ? t(`sections.${section}`) : section}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('schools.enterCustomSection')}
                          value={customSectionName}
                          onChange={(e) => setCustomSectionName(e.target.value)}
                          className="h-10"
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
                    {t('schools.schoolName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => {
                      setSchoolName(e.target.value);
                      setErrors({ ...errors, schoolName: '' });
                    }}
                    placeholder={t('schools.enterSchoolName')}
                    className="h-10 mt-1"
                  />
                  {errors.schoolName && (
                    <p className="text-sm text-red-500 mt-1">{errors.schoolName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="schoolCode" className="text-sm font-medium">
                    {t('schools.schoolCodeAuto')}
                  </Label>
                  <Input
                    id="schoolCode"
                    value={t('common.autoGenerated')}
                    disabled
                    className="h-10 mt-1 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('schools.schoolCodeDesc')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('common.email')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    placeholder={t('schools.enterEmail')}
                    className="h-10 mt-1"
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t('common.phone')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length > 10) return;
                      setPhone(val);
                      setErrors({ ...errors, phone: '' });
                    }}
                    placeholder={t('schools.enterPhone')}
                    className="h-10 mt-1"
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    {t('schools.address')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors({ ...errors, address: '' });
                    }}
                    placeholder={t('schools.address')}
                    className="h-10 mt-1"
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    {t('schools.city')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setErrors({ ...errors, city: '' });
                    }}
                    placeholder={t('schools.city')}
                    className="h-10 mt-1"
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    {t('schools.state')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={stateRegion}
                    onChange={(e) => {
                      setStateRegion(e.target.value);
                      setErrors({ ...errors, stateRegion: '' });
                    }}
                    placeholder={t('schools.state')}
                    className="h-10 mt-1"
                  />
                  {errors.stateRegion && (
                    <p className="text-sm text-red-500 mt-1">{errors.stateRegion}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm font-medium">
                    {t('schools.country')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setErrors({ ...errors, country: '' });
                    }}
                    placeholder={t('schools.country')}
                    className="h-10 mt-1"
                  />
                  {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
                </div>

                <div>
                  <Label htmlFor="pincode" className="text-sm font-medium">
                    {t('schools.pincode')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setErrors({ ...errors, pincode: '' });
                    }}
                    placeholder={t('schools.pincode')}
                    className="h-10 mt-1"
                  />
                  {errors.pincode && <p className="text-sm text-red-500 mt-1">{errors.pincode}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('schools.password')} <span className="text-red-500">*</span>
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
                      placeholder={t('schools.passwordPlaceholder')}
                      className="h-10 mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t('schools.confirmPassword')} <span className="text-red-500">*</span>
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
                      placeholder={t('schools.confirmPassword')}
                      className="h-10 mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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
            <div className="lg:col-span-2 rounded-2xl border border-gray-300 shadow-lg h-fit px-4 py-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {t('schools.configTitle')}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('schools.addClassesDesc', { section })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Class Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">{t('schools.selectClasses')}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getAvailableClasses().map((className) => (
                          <Button
                            key={className}
                            variant={
                              classes.find((c) => c.class_name === className)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => handleClassSelect(className)}
                            disabled={!!classes.find((c) => c.class_name === className)}
                          >
                            {className}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Class Input */}
                    <div className="space-y-2">
                      {!showCustomClassInput ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowCustomClassInput(true)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('schools.addCustomClass')}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('schools.enterCustomClassName')}
                            value={customClassName}
                            onChange={(e) => setCustomClassName(e.target.value)}
                            className="h-10"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomClass()}
                          />
                          <Button onClick={handleAddCustomClass} size="sm">
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
                      <div className="border-t pt-4 space-y-4">
                        <Label className="text-sm font-medium">
                          {t('schools.addDivisionTo', { className: selectedClass })}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">
                              {t('schools.divisionName')} <span className="text-red-500">*</span>
                            </Label>
                            {!showCustomDivisionInput ? (
                              <Select value={divisionName} onValueChange={handleDivisionChange}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder={t('schools.selectOrAdd')} />
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
                                    + {t('schools.addNewDivision')}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                placeholder={t('schools.divisionNamePlaceholder')}
                                value={divisionName}
                                onChange={(e) => setDivisionName(e.target.value)}
                                className="h-10"
                                autoFocus
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">
                              {t('schools.teacher')} <span className="text-red-500">*</span>
                            </Label>
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
                                <SelectValue placeholder={t('schools.selectTeacher')} />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.name}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                                <SelectItem
                                  value="__add_new__"
                                  className="font-semibold text-blue-600"
                                >
                                  + {t('schools.addNewTeacher')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">
                              {t('schools.noOfStudents')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              placeholder={t('schools.enterNumber')}
                              value={expectedStudents || ''}
                              onChange={(e) => setExpectedStudents(parseInt(e.target.value) || 0)}
                              className="h-10"
                              min="1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium opacity-0">Action</Label>
                            <Button
                              onClick={handleAddDivision}
                              className="w-full h-10"
                              disabled={!divisionName || !selectedTeacher || !expectedStudents}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('schools.addDivision')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selected Classes Display */}
                    {classes.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('schools.selectClasses')}</Label>
                        <div className="flex flex-wrap gap-2">
                          {classes.map((classItem) => (
                            <Badge
                              key={classItem.id}
                              variant="outline"
                              className="bg-green-50 text-green-700 px-3 py-1.5 flex items-center gap-2"
                            >
                              <span>{classItem.class_name}</span>
                              <span className="text-xs text-gray-500">
                                ({classItem.divisions.length} div)
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
                  </div>
                </CardContent>
              </Card>
              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => navigate('/dashboard/schools')}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? t('schools.creating') : t('schools.createSchool')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Table */}
        {summaryData.length > 0 && (
          <Card className="mb-6 rounded-xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t('schools.summaryTitle')}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t('schools.summarySubtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">{t('schools.section')}</TableHead>
                      <TableHead className="w-[150px]">{t('classManagement.class')}</TableHead>
                      <TableHead className="w-[120px]">{t('schools.division')}</TableHead>
                      <TableHead className="w-[200px]">{t('schools.teacher')}</TableHead>
                      <TableHead className="w-[120px]">{t('schools.students')}</TableHead>
                      <TableHead className="w-[120px] text-right">{t('schools.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="bg-blue-50">
                            {predefinedSections.includes(row.section) ? t(`sections.${row.section}`) : row.section}
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
                                  <SelectItem key={teacher.id} value={teacher.name}>
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
                                onClick={() => handleSaveRow(row.id)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingRowId(row.id);
                                  setEditFormData({ ...row });
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRow(row.id)}
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
      </div>

      {/* Teacher Modal */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schools.addNewTeacher')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {t('teachers.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                placeholder={t('teachers.namePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label>
                {t('common.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                placeholder={t('teachers.emailPlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('common.phone')}</Label>
              <Input
                value={newTeacher.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length > 10) return;
                  setNewTeacher({ ...newTeacher, phone: val });
                }}
                placeholder={t('teachers.phonePlaceholder')}
                className="mt-1"
                maxLength={10}
              />
            </div>
            <div>
              <Label>{t('teachers.subject')}</Label>
              {!showCustomSubjectInput ? (
                <Select value={newTeacher.subject} onValueChange={handleSubjectChange}>
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
                    placeholder={t('teachers.enterSubjectName')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
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
              <Label>
                {t('schools.password')} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                placeholder={t('schools.passwordPlaceholder')}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeacherModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTeacher}>{t('schools.addNewTeacher')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schools.createSuccessTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('schools.createSuccessDesc')}
            </p>
            {createdSchool && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p>
                  <strong>{t('schools.schoolName')}:</strong> {createdSchool.school_name || schoolName}
                </p>
                <p>
                  <strong>{t('common.email')}:</strong> {email}
                </p>
                <p>
                  <strong>{t('schools.schoolCode')}:</strong> {createdSchool.school_code || 'N/A'}
                </p>
                <p>
                  <strong>{t('schools.section')}:</strong> {section}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccessDialogOpen(false);
                navigate('/dashboard/schools');
              }}
            >
              {t('common.close')}
            </Button>
            <Button variant="outline" onClick={handleCopyCredentials}>
              {t('schools.copyCredentials')}
            </Button>
            <Button onClick={handleSendCredentials}>{t('schools.sendViaEmail')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
