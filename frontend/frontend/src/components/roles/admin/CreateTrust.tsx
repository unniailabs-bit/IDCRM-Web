import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import {
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
  Settings,
  Pencil,
  Save,
  XCircle,
  GraduationCap,
} from 'lucide-react';
import { trustService } from '@/api/trustService';
import { schoolService } from '@/api/schoolService';
import { trustSchoolApi } from '@/api/trust/schools';
import { subjectsApi, Subject } from '@/api/subjects';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const initialFormData = {
  trustName: '',
  trustEmail: '',
  password: '',
  confirmPassword: '',
  trustPhone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  allotNoOfId: '',
};

interface SchoolData {
  id: string;
  schoolId?: number; // Add this for existing schools
  schoolName: string;
  schoolAdminName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  password: string;
  confirmPassword: string;
  section: string;
  teachers?: Teacher[];
  classes: Array<{
    id: string;
    class_id?: number; // Add this for existing classes
    class_name: string;
    divisions: Array<{
      id: string;
      division_id?: number; // Add this for existing divisions
      division_name: string;
      class_teacher: string;
      teacher_id?: number;
      expected_students: number;
    }>;
  }>;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface SummaryRow {
  id: string;
  section: string;
  class_name: string;
  division_name: string;
  teacher_name: string;
  teacher_id?: number;
  expected_students: number;
  class_id?: number;
  division_id?: number;
  editing?: boolean;
}

const predefinedSections = [
  'pre-primary',
  'primary',
  'secondary',
  'higher-secondary',
  'graduation',
  'post-graduation',
];

const predefinedClasses: Record<string, string[]> = {
  'pre-primary': ['Playschool', 'Nursery', 'Junior kg', 'senior kg'],
  primary: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
  secondary: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  'higher-secondary': ['Class 11', 'Class 12'],
  graduation: ['Class 13', 'Class 14', 'Class 15'],
  'post-graduation': ['Semester 1', 'Semester 2'],
};

export function CreateTrust() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // School management state
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false);
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);
  const [showSchoolPassword, setShowSchoolPassword] = useState(false);
  const [showSchoolConfirmPassword, setShowSchoolConfirmPassword] = useState(false);

  // Current school form state
  const [currentSchool, setCurrentSchool] = useState<Partial<SchoolData>>({
    schoolName: '',
    schoolAdminName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    password: '',
    confirmPassword: '',
    section: '',
    classes: [],
  });
  const [schoolErrors, setSchoolErrors] = useState<Record<string, string>>({});

  // Class/Division form state
  const [selectedClass, setSelectedClass] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [showCustomClassInput, setShowCustomClassInput] = useState(false);
  const [divisionName, setDivisionName] = useState('');
  const [showCustomDivisionInput, setShowCustomDivisionInput] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [classTeacher, setClassTeacher] = useState(''); // For old configure section
  const [expectedStudents, setExpectedStudents] = useState<number>(0);

  // Teachers state
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

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  // Section state
  const [customSectionName, setCustomSectionName] = useState('');
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false);

  // Summary data for current school
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SummaryRow>>({});

  // Load trust data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const trustId = parseInt(id);
      loadTrustData(trustId);
      loadExistingSchools(trustId);
    }
    loadSubjects();
  }, [id, isEditMode]);

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

  const loadTrustData = async (trustId: number) => {
    setLoading(true);
    try {
      const response = await trustService.getAllTrusts();
      const trusts = response.data || [];
      const trust = trusts.find((t: any) => t.id === trustId);

      if (trust) {
        setFormData({
          trustName: trust.trust_name || '',
          trustEmail: trust.email || '',
          password: '',
          confirmPassword: '',
          trustPhone: trust.phone || '',
          address: trust.address || '',
          city: trust.city || '',
          state: trust.state || '',
          pincode: trust.pincode || '',
          allotNoOfId: trust.allot_ids?.toString() || '',
        });
      } else {
        toast.error(t('trusts.trustNotFound'));
        navigate('/dashboard/trusts');
      }
    } catch (error) {
      console.error('Error loading trust data:', error);
      toast.error(t('trusts.fetchError'));
      navigate('/dashboard/trusts');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSchools = async (trustId: number) => {
    try {
      const response = await schoolService.getAllSchools();
      if (response && response.success && Array.isArray(response.data)) {
        // Filter schools by trust_id - handle both string and number types
        const trustSchools = response.data.filter((school: any) => {
          const schoolTrustId =
            typeof school.trust_id === 'string' ? parseInt(school.trust_id, 10) : school.trust_id;
          return schoolTrustId === trustId;
        });

        // Transform to SchoolData format
        const formattedSchools: SchoolData[] = trustSchools.map((school: any) => {
          return {
            id: `existing-school-${school.id}`,
            schoolId: school.id,
            schoolName: school.school_name || '',
            schoolAdminName: school.school_admin_name || '',
            email: school.email || '',
            phone: school.phone || '',
            address: school.address || '',
            city: school.city || '',
            state: school.state || '',
            country: school.country || 'India',
            pincode: school.pincode || '',
            password: '',
            confirmPassword: '',
            section: school.section || '',
            classes: [],
          };
        });

        // Load classes and divisions for each school
        for (const schoolData of formattedSchools) {
          if (schoolData.schoolId) {
            try {
              const classesResponse = await schoolService.getClasses(schoolData.schoolId);
              if (classesResponse && classesResponse.success && classesResponse.data) {
                const formattedClasses = classesResponse.data.map((cls: any) => ({
                  id: `class-${cls.id || Date.now()}-${Math.random()}`,
                  class_id: cls.id,
                  class_name: cls.class_name || '',
                  section: cls.section || '',
                  divisions: (cls.divisions || []).map((div: any) => ({
                    id: `div-${div.id || Date.now()}-${Math.random()}`,
                    division_id: div.id,
                    division_name: div.division_name || '',
                    class_teacher: div.class_teacher || '',
                    teacher_id: div.teacher_id,
                    expected_students: div.expected_students || 0,
                    class_id: cls.id, // Store class_id for later use
                  })),
                }));
                schoolData.classes = formattedClasses;

                // Fallback: If section is missing, use the first class's section
                if (!schoolData.section && formattedClasses.length > 0) {
                  schoolData.section = formattedClasses[0].section;
                }
              }
            } catch (error) {
              console.error(`Error loading classes for school ${schoolData.schoolId}:`, error);
            }
          }
        }

        setSchools(formattedSchools);
      }
    } catch (error: any) {
      console.error('Error loading existing schools:', error);
      const errorMessage =
        error.response?.data?.message || error.message || t('schools.fetchError');
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'trustPhone') {
      const val = value.replace(/\D/g, '');
      if (val.length > 10) return;
      setFormData({ ...formData, [name]: val });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: '' });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.trustName) newErrors.trustName = t('trusts.nameRequired');
    if (!formData.trustEmail) {
      newErrors.trustEmail = t('trusts.emailRequired');
    } else if (!validateEmail(formData.trustEmail)) {
      newErrors.trustEmail = t('trusts.invalidEmail');
    }

    if (!isEditMode) {
      if (!formData.password) newErrors.password = t('trusts.passwordRequired');
      if (!formData.confirmPassword) newErrors.confirmPassword = t('trusts.confirmPasswordRequired');
    }

    // If password is provided in edit mode, validate it
    if (isEditMode && formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = t('schools.passwordMinLength');
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('trusts.passwordMismatch');
      }
    } else if (!isEditMode) {
      if (formData.password && formData.password.length < 6) {
        newErrors.password = t('schools.passwordMinLength');
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('trusts.passwordMismatch');
      }
    }

    if (!formData.trustPhone) {
      newErrors.trustPhone = t('trusts.phoneRequired');
    } else if (!validatePhone(formData.trustPhone)) {
      newErrors.trustPhone = t('trusts.invalidPhone');
    }

    if (!formData.address) newErrors.address = t('trusts.addressRequired');
    if (!formData.city) newErrors.city = t('trusts.cityRequired');
    if (!formData.state) newErrors.state = t('trusts.stateRequired');
    if (!formData.pincode) {
      newErrors.pincode = t('trusts.pincodeRequired');
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = t('trusts.invalidPincode');
    }
    if (!isEditMode && !formData.allotNoOfId) {
      newErrors.allotNoOfId = t('trusts.allotIdRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const trustData: any = {
        trustName: formData.trustName,
        email: formData.trustEmail,
        phone: formData.trustPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        allot_ids: formData.allotNoOfId ? parseInt(formData.allotNoOfId) : 0,
      };

      // Only include password if provided (required for create, optional for edit)
      if (formData.password) {
        trustData.password = formData.password;
      }

      let response;
      if (isEditMode && id) {
        // Update existing trust
        response = await trustService.updateTrust(parseInt(id), trustData);
        if (response && response.success) {
          const trustId = parseInt(id);

          // Update/create schools
          if (schools.length > 0) {
            toast.loading(t('trusts.updatingSchools'), { id: 'updating-schools' });

            for (const school of schools) {
              try {
                if (school.schoolId) {
                  // Update existing school
                  const updateData: any = {
                    schoolName: school.schoolName,
                    schoolAdminName: school.schoolAdminName,
                    trustId: trustId,
                    email: school.email,
                    phone: school.phone,
                    address: school.address,
                    city: school.city,
                    state: school.state,
                    country: school.country,
                    pincode: school.pincode,
                    section: school.section,
                    totalStudents: 0,
                  };

                  // Only include password if provided
                  if (school.password) {
                    updateData.password = school.password;
                  }

                  await schoolService.updateSchool(school.schoolId, updateData);

                  // Note: Classes and divisions updates would need separate API calls
                  // For now, we'll handle basic school info updates
                } else {
                  // Create new school
                  const schoolData = {
                    schoolName: school.schoolName,
                    schoolAdminName: school.schoolAdminName,
                    trustId: trustId,
                    email: school.email,
                    phone: school.phone,
                    address: school.address,
                    city: school.city,
                    state: school.state,
                    country: school.country,
                    pincode: school.pincode,
                    password: school.password,
                    section: school.section,
                    classes: school.classes.map((cls) => ({
                      class_name: cls.class_name,
                      section: school.section,
                      divisions: cls.divisions.map((div) => ({
                        division_name: div.division_name,
                        class_teacher: div.class_teacher,
                        teacher_id: div.teacher_id,
                        expected_students: div.expected_students,
                      })),
                    })),
                  };

                  await schoolService.createSchool(schoolData);
                }
              } catch (error: any) {
                console.error(
                  `Error ${school.schoolId ? 'updating' : 'creating'} school ${school.schoolName}:`,
                  error
                );
                toast.error(
                  `Failed to ${school.schoolId ? 'update' : 'create'} school: ${school.schoolName}`
                );
              }
            }

            toast.dismiss('updating-schools');
            toast.success(t('trusts.updateSuccessAll'));
          } else {
            toast.success(response.message || t('trusts.updateSuccess'));
          }

          navigate('/dashboard/trusts');
        } else {
          toast.error(response?.message || t('trusts.updateError'));
        }
      } else {
        // Create new trust
        response = await trustService.createTrust(trustData);
        if (response && response.success) {
          const trustId = response.data?.id;

          // Create schools if any were added
          if (schools.length > 0 && trustId) {
            toast.loading(t('trusts.creatingSchools'), { id: 'creating-schools' });

            for (const school of schools) {
              try {
                const schoolData = {
                  schoolName: school.schoolName,
                  schoolAdminName: school.schoolAdminName,
                  trustId: trustId,
                  email: school.email,
                  phone: school.phone,
                  address: school.address,
                  city: school.city,
                  state: school.state,
                  country: school.country,
                  pincode: school.pincode,
                  password: school.password,
                  section: school.section,
                  classes: school.classes.map((cls) => ({
                    class_name: cls.class_name,
                    section: school.section,
                    divisions: cls.divisions.map((div) => ({
                      division_name: div.division_name,
                      class_teacher: div.class_teacher,
                      teacher_id: div.teacher_id,
                      expected_students: div.expected_students,
                    })),
                  })),
                };

                const createSchoolResponse = await schoolService.createSchool(schoolData);

                // After creating school, create teachers if any were added
                // Note: Teachers for new schools are stored in component state but not in SchoolData
                // This would need to be implemented if you want to persist teachers for new schools
              } catch (error: any) {
                console.error(`Error creating school ${school.schoolName}:`, error);
                toast.error(`Failed to create school: ${school.schoolName}`);
              }
            }

            toast.dismiss('creating-schools');
            toast.success(t('trusts.createSuccessAll', { count: schools.length }));
          } else {
            toast.success(response.message || t('trusts.createSuccess'));
          }

          navigate('/dashboard/trusts');
        } else {
          toast.error(response?.message || t('trusts.createError'));
        }
      }
    } catch (error: any) {
      console.error('Error saving trust:', error);
      toast.error(
        error.response?.data?.message ||
        (isEditMode ? t('trusts.updateError') : t('trusts.createError'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/trusts');
  };

  // Section handlers
  const handleSectionChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomSectionInput(true);
      handleSchoolFormChange('section', '');
    } else {
      handleSchoolFormChange('section', value);
      setShowCustomSectionInput(false);
      setCustomSectionName('');
    }
  };

  const handleCustomSectionSubmit = () => {
    if (!customSectionName.trim()) {
      toast.error(t('schools.enterSectionName'));
      return;
    }
    handleSchoolFormChange('section', customSectionName.trim());
    setShowCustomSectionInput(false);
    setCustomSectionName('');
    toast.success(t('schools.customSectionAdded'));
  };

  // Teacher handlers
  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    if (newTeacher.phone && !/^\d{10}$/.test(newTeacher.phone)) {
      toast.error(t('teachers.phoneDigits'));
      return;
    }

    // If editing an existing school, create teacher via API immediately
    if (currentSchool.schoolId) {
      try {
        const response = await trustSchoolApi.createTeacher(currentSchool.schoolId, {
          name: newTeacher.name.trim(),
          email: newTeacher.email.trim(),
          phone: newTeacher.phone?.trim() || undefined,
          password: newTeacher.password,
        });

        if (response.success && response.data) {
          const savedTeacher: Teacher = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
          };
          setTeachers([...teachers, savedTeacher]);
          setNewTeacher({
            name: '',
            email: '',
            phone: '',
            password: '',
            subject: '',
            status: 'Active',
          });
          setIsTeacherModalOpen(false);
          toast.success(t('teachers.createSuccess'));
        }
      } catch (error: any) {
        console.error('Error creating teacher:', error);
        toast.error(error.response?.data?.message || t('teachers.createError'));
      }
    } else {
      // For new schools (not yet saved), store in local state
      // Teachers will be created when the school is saved
      const teacher: Teacher = {
        id: Date.now(), // Temporary ID for local state
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone || '',
      };

      setTeachers([...teachers, teacher]);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        password: '',
        subject: '',
        status: 'Active',
      });
      setIsTeacherModalOpen(false);
      toast.success(t('schools.teacherAddedLocal'));
    }
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
      toast.error(t('teachers.subjectRequired'));
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
        toast.success(t('teachers.subjectSuccess'));
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(t('teachers.subjectError'));
    }
  };

  // Division handlers
  const handleDivisionChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomDivisionInput(true);
      setDivisionName('');
    } else {
      setDivisionName(value);
      setShowCustomDivisionInput(false);
    }
  };

  // Summary table handlers
  const handleSaveRow = async (rowId: string) => {
    const row = summaryData.find((r) => r.id === rowId);
    if (!row || !editFormData.division_name || !editFormData.expected_students) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    // Call API if editing an existing school/class/division
    if (currentSchool.schoolId && row.class_id && row.division_id) {
      try {
        await schoolService.updateDivision(currentSchool.schoolId, row.class_id, row.division_id, {
          division_name: editFormData.division_name.trim(),
          class_teacher: editFormData.teacher_name || '',
          teacher_id: teachers.find((t) => t.name === editFormData.teacher_name)?.id,
          expected_students: editFormData.expected_students,
        });
        toast.success(t('classManagement.updateDivisionServer'));
      } catch (error) {
        console.error('Error updating division:', error);
        toast.error(t('classManagement.updateDivisionError'));
        return;
      }
    }

    setSummaryData(summaryData.map((r) => (r.id === rowId ? { ...r, ...editFormData } : r)));

    const updatedClasses = (currentSchool.classes || []).map((cls) => {
      if (cls.class_name === row.class_name) {
        return {
          ...cls,
          divisions: cls.divisions.map((div) =>
            div.id === rowId
              ? {
                ...div,
                division_name: editFormData.division_name!,
                class_teacher: editFormData.teacher_name || '',
                teacher_id: teachers.find((t) => t.name === editFormData.teacher_name)?.id,
                expected_students: editFormData.expected_students!,
              }
              : div
          ),
        };
      }
      return cls;
    });

    setCurrentSchool({
      ...currentSchool,
      classes: updatedClasses,
    });

    setEditingRowId(null);
    setEditFormData({});
    toast.success(t('classManagement.updateDivisionSuccess'));
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  const handleDeleteRow = async (rowId: string) => {
    const row = summaryData.find((r) => r.id === rowId);
    if (!row) return;

    // Delete from server if it's an existing division
    if (currentSchool.schoolId && row.class_id && row.division_id) {
      try {
        await schoolService.deleteDivision(currentSchool.schoolId, row.class_id, row.division_id);
        toast.success(t('classManagement.deleteDivisionServer'));
      } catch (error) {
        console.error('Error deleting division:', error);
        toast.error(t('classManagement.deleteDivisionError'));
        return;
      }
    }

    setSummaryData(summaryData.filter((r) => r.id !== rowId));
    const updatedClasses = (currentSchool.classes || []).map((cls) => {
      if (cls.class_name === row.class_name) {
        return {
          ...cls,
          divisions: cls.divisions.filter((div) => div.id !== rowId),
        };
      }
      return cls;
    });

    setCurrentSchool({
      ...currentSchool,
      classes: updatedClasses,
    });

    toast.success(t('classManagement.deleteDivisionSuccess'));
  };

  // School management functions
  const handleAddSchool = () => {
    setShowAddSchoolForm(true);
    setCurrentSchool({
      schoolName: '',
      schoolAdminName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      password: '',
      confirmPassword: '',
      section: '',
      classes: [],
    });
    setTeachers([]); // Reset teachers for new school
    setSchoolErrors({});
  };

  const handleSchoolFormChange = (field: string, value: string | number) => {
    if (field === 'phone') {
      const val = String(value).replace(/\D/g, '');
      if (val.length > 10) return;
      setCurrentSchool({ ...currentSchool, [field]: val });
    } else {
      setCurrentSchool({ ...currentSchool, [field]: value });
    }
    setSchoolErrors({ ...schoolErrors, [field]: '' });
  };

  const validateSchoolForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentSchool.schoolName?.trim()) newErrors.schoolName = t('schools.nameRequired');

    if (!currentSchool.email?.trim()) {
      newErrors.email = t('schools.emailRequired');
    } else if (!validateEmail(currentSchool.email)) {
      newErrors.email = t('schools.invalidEmail');
    }

    if (!currentSchool.phone?.trim()) {
      newErrors.phone = t('schools.phoneRequired');
    } else if (!validatePhone(currentSchool.phone)) {
      newErrors.phone = t('schools.invalidPhone');
    }

    if (!currentSchool.address?.trim()) newErrors.address = t('schools.addressRequired');
    if (!currentSchool.city?.trim()) newErrors.city = t('schools.cityRequired');
    if (!currentSchool.state?.trim()) newErrors.state = t('schools.stateRequired');
    if (!currentSchool.pincode?.trim()) {
      newErrors.pincode = t('schools.pincodeRequired');
    } else if (!/^[0-9]{6}$/.test(currentSchool.pincode)) {
      newErrors.pincode = t('schools.invalidPincode');
    }

    // Password is required only for new schools
    if (!currentSchool.schoolId && !currentSchool.password) {
      newErrors.password = t('schools.passwordRequired');
    }
    // If password is provided (for new or edit), validate it matches confirmPassword
    if (currentSchool.password) {
      if (currentSchool.password.length < 6) {
        newErrors.password = t('schools.passwordMinLength');
      } else if (currentSchool.password !== currentSchool.confirmPassword) {
        newErrors.confirmPassword = t('schools.passwordMismatch');
      }
    }
    if (!currentSchool.section) newErrors.section = t('schools.sectionRequired');

    setSchoolErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSchool = () => {
    if (!validateSchoolForm()) {
      toast.error(t('classManagement.fillAllFields'));
      return;
    }

    const schoolData: SchoolData = {
      id: currentSchool.id || `school-${Date.now()}-${Math.random()}`,
      schoolId: currentSchool.schoolId,
      schoolName: currentSchool.schoolName!,
      schoolAdminName: currentSchool.schoolAdminName!,
      email: currentSchool.email!,
      phone: currentSchool.phone!,
      address: currentSchool.address!,
      city: currentSchool.city!,
      state: currentSchool.state!,
      country: currentSchool.country || 'India',
      pincode: currentSchool.pincode!,
      password: currentSchool.password!,
      confirmPassword: currentSchool.confirmPassword!,
      section: currentSchool.section!,
      classes: currentSchool.classes || [],
      teachers: teachers,
    };

    // If editing a school that already exists in our local list, update it; otherwise add new
    const schoolExists = schools.some((s) => s.id === schoolData.id);

    if (schoolExists) {
      const updatedSchools = schools.map((s) => (s.id === schoolData.id ? schoolData : s));
      setSchools(updatedSchools);
      toast.success(t('schools.updateSuccess'));
    } else {
      setSchools([...schools, schoolData]);
      toast.success(t('schools.createSuccess'));
    }

    setShowAddSchoolForm(false);
    setCurrentSchool({
      schoolName: '',
      schoolAdminName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      password: '',
      confirmPassword: '',
      section: '',
      classes: [],
    });
    setSelectedClass('');
    setCustomClassName('');
    setShowCustomClassInput(false);
    setDivisionName('');
    setSelectedTeacher('');
    setExpectedStudents(0);
    // Don't reset teachers here if editing existing school (they're already loaded from API)
    if (!currentSchool.schoolId) {
      setTeachers([]);
    }
    setSummaryData([]);
    setCustomSectionName('');
    setShowCustomSectionInput(false);
  };

  const handleEditSchool = async (school: SchoolData) => {
    setLoading(true);
    let sectionToUse = school.section;
    let schoolsClasses = school.classes || [];
    let schoolsTeachers: Teacher[] = [];

    try {
      // Fetch full school details to ensure we have the section and other info
      if (school.schoolId) {
        const response = await schoolService.getSchoolById(school.schoolId);
        if (response.success && response.data) {
          sectionToUse = response.data.section || sectionToUse;
        }

        // Load teachers
        const teachersResponse = await schoolService.getTeachers(school.schoolId);
        if (teachersResponse.success && teachersResponse.data) {
          schoolsTeachers = teachersResponse.data;
        }
      }
    } catch (error) {
      console.error('Error fetching school details:', error);
    } finally {
      setLoading(false);
    }

    // Check if the section is custom
    const isCustomSection = sectionToUse && !predefinedSections.includes(sectionToUse);

    if (isCustomSection) {
      setShowCustomSectionInput(true);
      setCustomSectionName(sectionToUse);
    } else {
      setShowCustomSectionInput(false);
      setCustomSectionName('');
    }

    setCurrentSchool({
      id: school.id,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      schoolAdminName: school.schoolAdminName,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      pincode: school.pincode,
      password: '',
      confirmPassword: '',
      section: sectionToUse,
      classes: schoolsClasses,
    });
    setTeachers(schoolsTeachers);
    setShowAddSchoolForm(true);
    setSchoolErrors({});

    // Populate summary data from existing classes
    const initialSummaryData: SummaryRow[] = [];
    (school.classes || []).forEach((cls) => {
      cls.divisions.forEach((div) => {
        initialSummaryData.push({
          id: div.id,
          section: school.section || '',
          class_name: cls.class_name,
          division_name: div.division_name,
          teacher_name: div.class_teacher,
          expected_students: div.expected_students,
          class_id: cls.class_id,
          division_id: div.division_id,
        });
      });
    });
    setSummaryData(initialSummaryData);

    // Load teachers for existing school
    if (school.schoolId) {
      try {
        const teachersResponse = await schoolService.getTeachers(school.schoolId);
        if (teachersResponse.success && teachersResponse.data) {
          setTeachers(teachersResponse.data);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
        // Don't show error toast as this is optional
        setTeachers([]);
      }
    } else {
      // For new schools, reset teachers list
      setTeachers(school.teachers || []);
    }

    // Close any expanded configuration
    if (expandedSchoolId === school.id) {
      setExpandedSchoolId(null);
    }
  };

  const handleRemoveSchool = async (schoolId: string) => {
    const schoolToRemove = schools.find((s) => s.id === schoolId);
    if (!schoolToRemove) return;

    // Remove from UI immediately
    setSchools(schools.filter((s) => s.id !== schoolId));
    if (expandedSchoolId === schoolId) {
      setExpandedSchoolId(null);
    }

    if (schoolToRemove.schoolId) {
      try {
        const response = await schoolService.deleteSchool(schoolToRemove.schoolId);
        if (response.success) {
          toast.success(t('schools.deleteSuccessServer'));
        } else {
          toast.error(response.message || t('schools.deleteErrorServer'));
          // Optional: Add it back if we want strictly consistent UI, but user asked to "remove it"
        }
      } catch (error) {
        console.error('Error deleting school:', error);
        toast.error(t('schools.deleteError'));
      }
    } else {
      toast.success(t('schools.deleteSuccess'));
    }
  };

  const handleToggleConfigure = (schoolId: string) => {
    setExpandedSchoolId(expandedSchoolId === schoolId ? null : schoolId);
  };

  // Class/Division management for form (currentSchool)
  const handleClassSelect = async (className: string) => {
    const existingClasses = currentSchool.classes || [];
    const foundClass = existingClasses.find((c) => c.class_name === className);

    if (foundClass) {
      setSelectedClass(className);
      setCustomClassName('');
      setShowCustomClassInput(false);
      return;
    }

    let class_id: number | undefined;
    if (currentSchool.schoolId) {
      try {
        const response = await schoolService.createClass(currentSchool.schoolId, {
          class_name: className,
          section: currentSchool.section,
        });
        if (response.success && response.data) {
          class_id = response.data.id;
          toast.success(t('classManagement.classAddedServer'));
        }
      } catch (error) {
        console.error('Error adding class:', error);
        toast.error(t('classManagement.classAddedError'));
        return;
      }
    }

    const newClass = {
      id: `class-${Date.now()}-${Math.random()}`,
      class_id: class_id,
      class_name: className,
      divisions: [],
    };

    setCurrentSchool({
      ...currentSchool,
      classes: [...existingClasses, newClass],
    });

    setSelectedClass(className);
    setCustomClassName('');
    setShowCustomClassInput(false);
    toast.success(class_id ? t('classManagement.classAddedSaved') : t('classManagement.classAdded'));
  };

  const handleAddCustomClass = () => {
    if (!customClassName.trim()) return;
    handleClassSelect(customClassName.trim());
  };

  const handleRemoveClassFromForm = async (className: string) => {
    const classToRemove = (currentSchool.classes || []).find((c) => c.class_name === className);
    if (!classToRemove) return;

    if (currentSchool.schoolId && classToRemove.class_id) {
      try {
        await schoolService.deleteClass(currentSchool.schoolId, classToRemove.class_id);
        toast.success(t('classManagement.classDeletedServer'));
      } catch (error) {
        console.error('Error deleting class:', error);
        toast.error(t('classManagement.classDeletedError'));
        return;
      }
    }

    const updatedClasses = (currentSchool.classes || []).filter((c) => c.class_name !== className);
    setCurrentSchool({
      ...currentSchool,
      classes: updatedClasses,
    });
    setSummaryData(summaryData.filter((r) => r.class_name !== className));
    if (selectedClass === className) {
      setSelectedClass('');
    }
    toast.success(t('classManagement.classRemovedSuccess'));
  };

  // Class/Division management for existing schools
  const handleAddClass = (schoolId: string) => {
    if (!selectedClass && !customClassName.trim()) {
      toast.error(t('classManagement.selectClassName'));
      return;
    }

    const className = customClassName.trim() || selectedClass;
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    if (school.classes.find((c) => c.class_name === className)) {
      toast.error(t('classManagement.classAlreadyAdded'));
      return;
    }

    const newClass = {
      id: `class-${Date.now()}-${Math.random()}`,
      class_name: className,
      divisions: [],
    };

    const updatedSchools = schools.map((s) =>
      s.id === schoolId ? { ...s, classes: [...s.classes, newClass] } : s
    );

    setSchools(updatedSchools);
    setSelectedClass('');
    setCustomClassName('');
    setShowCustomClassInput(false);
    toast.success(t('classManagement.classAdded'));
  };

  // Division management for form (currentSchool)
  const handleAddDivision = async () => {
    if (!selectedClass || !divisionName.trim() || !expectedStudents) {
      toast.error(t('classManagement.fillDivisionFields'));
      return;
    }

    const existingClasses = currentSchool.classes || [];
    const selectedClassData = existingClasses.find((c) => c.class_name === selectedClass);
    if (!selectedClassData) return;

    // Check if division already exists for this class
    const isDuplicate = selectedClassData.divisions.some(
      (d) => d.division_name.toLowerCase() === divisionName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(t('classManagement.divisionExists', { className: selectedClass }));
      return;
    }

    const teacher = selectedTeacher ? teachers.find((t) => t.name === selectedTeacher) : undefined;
    if (selectedTeacher && !teacher) {
      toast.error(t('classManagement.teacherNotFound'));
      return;
    }

    let division_id: number | undefined;
    if (currentSchool.schoolId && selectedClassData.class_id) {
      try {
        const response = await schoolService.createDivision(
          currentSchool.schoolId,
          selectedClassData.class_id,
          {
            division_name: divisionName.trim(),
            class_teacher: teacher?.name || '',
            teacher_id: teacher?.id,
            expected_students: expectedStudents,
          }
        );
        if (response.success && response.data) {
          division_id = response.data.id;
          toast.success(t('classManagement.divisionAddedServer'));
        }
      } catch (error) {
        console.error('Error adding division:', error);
        toast.error(t('classManagement.divisionAddedError'));
        return;
      }
    }

    const tempDivisionId = `div-${Date.now()}-${Math.random()}`;
    const newDivision = {
      id: tempDivisionId,
      division_id: division_id,
      division_name: divisionName.trim(),
      class_teacher: teacher?.name || '', // Use teacher's name if found, otherwise empty string
      teacher_id: teacher?.id,
      expected_students: expectedStudents,
    };

    const updatedClasses = existingClasses.map((c) =>
      c.class_name === selectedClass ? { ...c, divisions: [...c.divisions, newDivision] } : c
    );

    setCurrentSchool({
      ...currentSchool,
      classes: updatedClasses,
    });

    const summaryRow: SummaryRow = {
      id: tempDivisionId,
      section: currentSchool.section || '',
      class_name: selectedClass,
      division_name: newDivision.division_name,
      teacher_name: newDivision.class_teacher,
      teacher_id: teacher?.id,
      expected_students: newDivision.expected_students,
      class_id: selectedClassData.class_id,
      division_id: division_id,
    };

    setSummaryData([...summaryData, summaryRow]);

    setDivisionName('');
    setSelectedTeacher('');
    setExpectedStudents(0);
    setShowCustomDivisionInput(false);
    toast.success(division_id ? t('classManagement.divisionAddedSaved') : t('classManagement.divisionAdded'));
  };

  // Division management for existing schools
  const handleAddDivisionToSchool = (schoolId: string, classId: string) => {
    if (!divisionName.trim() || !expectedStudents) {
      toast.error(t('classManagement.fillDivisionFields'));
      return;
    }

    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const classData = school.classes.find((c) => c.id === classId);
    if (!classData) return;

    // Check if division already exists for this class in this school
    const isDuplicate = classData.divisions.some(
      (d) => d.division_name.toLowerCase() === divisionName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(t('classManagement.divisionExists', { className: classData.class_name }));
      return;
    }

    const newDivision = {
      id: `div-${Date.now()}-${Math.random()}`,
      division_name: divisionName.trim(),
      class_teacher: classTeacher.trim(),
      teacher_id: teachers.find((t) => t.name === classTeacher.trim())?.id,
      expected_students: expectedStudents,
    };

    const updatedSchools = schools.map((s) =>
      s.id === schoolId
        ? {
          ...s,
          classes: s.classes.map((c) =>
            c.id === classId ? { ...c, divisions: [...c.divisions, newDivision] } : c
          ),
        }
        : s
    );

    setSchools(updatedSchools);
    setDivisionName('');
    setClassTeacher('');
    setExpectedStudents(0);
    toast.success(t('classManagement.divisionAdded'));
  };

  const handleRemoveDivisionFromForm = (classId: string, divisionId: string) => {
    const updatedClasses = (currentSchool.classes || []).map((c) =>
      c.id === classId ? { ...c, divisions: c.divisions.filter((d) => d.id !== divisionId) } : c
    );
    setCurrentSchool({
      ...currentSchool,
      classes: updatedClasses,
    });
    toast.success(t('classManagement.divisionRemoved'));
  };

  // Remove handlers for existing schools
  const handleRemoveClass = (schoolId: string, classId: string) => {
    const updatedSchools = schools.map((s) =>
      s.id === schoolId ? { ...s, classes: s.classes.filter((c) => c.id !== classId) } : s
    );
    setSchools(updatedSchools);
    toast.success(t('classManagement.classRemoved'));
  };

  const handleRemoveDivision = (schoolId: string, classId: string, divisionId: string) => {
    const updatedSchools = schools.map((s) =>
      s.id === schoolId
        ? {
          ...s,
          classes: s.classes.map((c) =>
            c.id === classId
              ? { ...c, divisions: c.divisions.filter((d) => d.id !== divisionId) }
              : c
          ),
        }
        : s
    );
    setSchools(updatedSchools);
    toast.success(t('classManagement.divisionRemoved'));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 bg-white">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
        {isEditMode ? t('trusts.editTrust') : t('trusts.createTrust')}
      </h1>
      <p className="text-base md:text-lg text-gray-600 font-medium">
        {isEditMode ? t('trusts.update') : t('trusts.basicInfo')}
      </p>
      <Card className="w-full mt-6 rounded-xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
        <CardContent className="p-6">
          {/* <Separator className="my-4" /> */}

          {/* TRUST INFORMATION */}
          <h3 className="text-2xl font-semibold text-orange-600 mb-3 mt-0">📄 {t('trusts.basicInfo')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trust Name */}
            <div>
              <Label className="text-xs">
                {t('trusts.trustName')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="trustName"
                value={formData.trustName}
                onChange={handleChange}
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.trustNamePlaceholder')}
              />
              {errors.trustName && <p className="text-red-500 text-xs">{errors.trustName}</p>}
            </div>

            {/* Trust Email */}
            <div>
              <Label className="text-xs">
                {t('trusts.trustEmail')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="trustEmail"
                value={formData.trustEmail}
                onChange={handleChange}
                type="email"
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.trustEmailPlaceholder')}
              />
              {errors.trustEmail && <p className="text-red-500 text-xs">{errors.trustEmail}</p>}
            </div>

            {/* Trust Password */}
            <div>
              <Label className="text-xs">
                {t('common.password')} {!isEditMode && <span style={{ color: '#EA580C' }}>*</span>}
                {isEditMode && (
                  <span className="text-gray-500 text-xs ml-2">
                    {t('trusts.keepCurrentPassword')}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  style={{
                    height: '40px',
                    paddingLeft: '16px',
                    paddingRight: '48px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    width: '100%',
                    marginTop: '4px',
                  }}
                  placeholder={isEditMode ? t('schools.passwordPlaceholder') : t('common.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="hover:text-orange-500" />
                  ) : (
                    <Eye size={18} className="hover:text-orange-500" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>

            {/* Trust Confirm Password */}
            <div>
              <Label className="text-xs">
                {t('schools.confirmPassword')} {!isEditMode && <span style={{ color: '#EA580C' }}>*</span>}
              </Label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type={showConfirmPassword ? 'text' : 'password'}
                  style={{
                    height: '40px',
                    paddingLeft: '16px',
                    paddingRight: '48px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    width: '100%',
                    marginTop: '4px',
                  }}
                  placeholder={isEditMode ? t('schools.passwordPlaceholder') : t('common.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} className="hover:text-orange-500" />
                  ) : (
                    <Eye size={18} className="hover:text-orange-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Numbers of ID Generate */}
            <div>
              <Label className="text-xs">
                {t('trusts.numbersOfIdGenerate')} {!isEditMode && <span style={{ color: '#EA580C' }}>*</span>}
              </Label>
              <Input
                name="allotNoOfId"
                value={formData.allotNoOfId}
                onChange={handleChange}
                type="number"
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.idGeneratePlaceholder')}
              />
              {errors.allotNoOfId && <p className="text-red-500 text-xs">{errors.allotNoOfId}</p>}
            </div>

            {/* Trust Phone */}
            <div>
              <Label className="text-xs">
                {t('trusts.trustPhone')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="trustPhone"
                value={formData.trustPhone}
                onChange={handleChange}
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.trustPhonePlaceholder')}
              />
              {errors.trustPhone && <p className="text-red-500 text-xs">{errors.trustPhone}</p>}
            </div>
          </div>

          <br />

          {/* Address */}
          <div className="mt-5">
            <Label className="text-xs">
              {t('trusts.addressRequired')} <span style={{ color: '#EA580C' }}>*</span>
            </Label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="h-10 text-sm px-4 py-3 mt-1"
              placeholder={t('trusts.addressPlaceholder')}
            />
            {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
          </div>

          <br />

          {/* City / State / Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <Label className="text-xs">
                {t('approvals.city')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.cityPlaceholder')}
              />
              {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
            </div>

            <div>
              <Label className="text-xs">
                {t('approvals.state')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.statePlaceholder')}
              />
              {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}
            </div>

            <div>
              <Label className="text-xs">
                {t('approvals.pincode')} <span style={{ color: '#EA580C' }}>*</span>
              </Label>
              <Input
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="h-10 text-sm px-4 py-3 mt-1"
                placeholder={t('trusts.pincodePlaceholder')}
                maxLength={6}
              />
              {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode}</p>}
            </div>
          </div>

          <Separator className="my-6" />

          {/* ADD SCHOOL SECTION */}
          <>
            <h3 className="text-2xl font-semibold text-orange-600 mb-3 mt-0">
              🏫 {isEditMode ? t('schools.title') : t('schools.title')}
            </h3>

            {schools.length > 0 && (
              <div className="mb-4 space-y-2">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{school.schoolName}</span>
                      <span className="text-sm text-gray-500 ml-2">({school.email})</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSchool(school)}
                        className="border hover:border-green-600 hover:text-green-600 hover:bg-green-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {t('trusts.edit')}
                      </Button>
                      {/* <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleConfigure(school.id)}
                        className="border hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        {expandedSchoolId === school.id ? t('schools.hideConfig') : t('schools.configure')}
                      </Button> */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSchool(school.id)}
                        className="border hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddSchoolForm ? (
              <Card className="mb-4 border-2 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">
                      {currentSchool.schoolId ? t('schools.editSchool') : t('schools.addSchool')}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddSchoolForm(false);
                        setCurrentSchool({
                          schoolName: '',
                          schoolAdminName: '',
                          email: '',
                          phone: '',
                          address: '',
                          city: '',
                          state: '',
                          country: 'India',
                          pincode: '',
                          password: '',
                          confirmPassword: '',
                          section: '',
                          classes: [],
                        });
                        setTeachers([]);
                        setSummaryData([]);
                        setSelectedClass('');
                        setCustomClassName('');
                        setShowCustomClassInput(false);
                        setDivisionName('');
                        setSelectedTeacher('');
                        setClassTeacher('');
                        setExpectedStudents(0);
                        setCustomSectionName('');
                        setShowCustomSectionInput(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">
                        {t('schools.schoolName')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.schoolName || ''}
                        onChange={(e) => handleSchoolFormChange('schoolName', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('schools.enterSchoolName')}
                      />
                      {schoolErrors.schoolName && (
                        <p className="text-red-500 text-xs">{schoolErrors.schoolName}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">{t('schools.schoolAdminName')}</Label>
                      <Input
                        value={currentSchool.schoolAdminName || ''}
                        onChange={(e) => handleSchoolFormChange('schoolAdminName', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('schools.enterAdminName')}
                      />
                      {schoolErrors.schoolAdminName && (
                        <p className="text-red-500 text-xs">{schoolErrors.schoolAdminName}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('common.email')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        type="email"
                        value={currentSchool.email || ''}
                        onChange={(e) => handleSchoolFormChange('email', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('schools.enterEmail')}
                      />
                      {schoolErrors.email && (
                        <p className="text-red-500 text-xs">{schoolErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('common.phone')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.phone || ''}
                        onChange={(e) => handleSchoolFormChange('phone', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        maxLength={10}
                        placeholder={t('schools.enterPhone')}
                      />
                      {schoolErrors.phone && (
                        <p className="text-red-500 text-xs">{schoolErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="section" className="text-sm font-medium">
                        {t('schools.section')} <span className="text-red-500">*</span>
                      </Label>
                      {!showCustomSectionInput ? (
                        <div className="space-y-2">
                          <Select
                            value={currentSchool.section || ''}
                            onValueChange={handleSectionChange}
                          >
                            <SelectTrigger className="h-10 mt-1">
                              <SelectValue placeholder={t('schools.selectOrAddSection')} />
                            </SelectTrigger>
                            <SelectContent>
                              {predefinedSections.map((sec) => (
                                <SelectItem key={sec} value={sec}>
                                  {t(`sections.${sec}`)}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="__custom__"
                                className="font-semibold text-blue-600"
                              >
                                + {t('schools.addCustomSection')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {currentSchool.section && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {t('schools.selectedSection')}: {t(`sections.${currentSchool.section}`)}
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
                      {schoolErrors.section && (
                        <p className="text-sm text-red-500 mt-1">{schoolErrors.section}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('common.password')}{' '}
                        {!currentSchool.schoolId && <span style={{ color: '#EA580C' }}>*</span>}
                        {currentSchool.schoolId && (
                          <span className="text-gray-500 text-xs ml-2">
                            {t('schools.leaveEmptyPassword')}
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          type={showSchoolPassword ? 'text' : 'password'}
                          value={currentSchool.password || ''}
                          onChange={(e) => handleSchoolFormChange('password', e.target.value)}
                          className="h-10 text-sm px-4 py-3 mt-1 pr-10"
                          placeholder={
                            currentSchool.schoolId
                              ? t('schools.passwordPlaceholder')
                              : t('common.passwordPlaceholder')
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowSchoolPassword(!showSchoolPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          style={{ marginTop: '0.125rem' }} // adjusting for the mt-1 of input
                        >
                          {showSchoolPassword ? (
                            <EyeOff size={18} className="hover:text-orange-500" />
                          ) : (
                            <Eye size={18} className="hover:text-orange-500" />
                          )}
                        </button>
                      </div>
                      {schoolErrors.password && (
                        <p className="text-red-500 text-xs">{schoolErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('schools.confirmPassword')}{' '}
                        {!currentSchool.schoolId && <span style={{ color: '#EA580C' }}>*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={showSchoolConfirmPassword ? 'text' : 'password'}
                          value={currentSchool.confirmPassword || ''}
                          onChange={(e) =>
                            handleSchoolFormChange('confirmPassword', e.target.value)
                          }
                          className="h-10 text-sm px-4 py-3 mt-1 pr-10"
                          placeholder={
                            currentSchool.schoolId ? t('schools.passwordPlaceholder') : t('schools.confirmPassword')
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowSchoolConfirmPassword(!showSchoolConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          style={{ marginTop: '0.125rem' }}
                        >
                          {showSchoolConfirmPassword ? (
                            <EyeOff size={18} className="hover:text-orange-500" />
                          ) : (
                            <Eye size={18} className="hover:text-orange-500" />
                          )}
                        </button>
                      </div>
                      {schoolErrors.confirmPassword && (
                        <p className="text-red-500 text-xs">{schoolErrors.confirmPassword}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('trusts.addressRequired')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.address || ''}
                        onChange={(e) => handleSchoolFormChange('address', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('trusts.addressPlaceholder')}
                      />
                      {schoolErrors.address && (
                        <p className="text-red-500 text-xs">{schoolErrors.address}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('approvals.city')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.city || ''}
                        onChange={(e) => handleSchoolFormChange('city', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('trusts.cityPlaceholder')}
                      />
                      {schoolErrors.city && (
                        <p className="text-red-500 text-xs">{schoolErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('approvals.state')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.state || ''}
                        onChange={(e) => handleSchoolFormChange('state', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('trusts.statePlaceholder')}
                      />
                      {schoolErrors.state && (
                        <p className="text-red-500 text-xs">{schoolErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">
                        {t('approvals.pincode')} <span style={{ color: '#EA580C' }}>*</span>
                      </Label>
                      <Input
                        value={currentSchool.pincode || ''}
                        onChange={(e) => handleSchoolFormChange('pincode', e.target.value)}
                        className="h-10 text-sm px-4 py-3 mt-1"
                        placeholder={t('trusts.pincodePlaceholder')}
                        maxLength={6}
                      />
                      {schoolErrors.pincode && (
                        <p className="text-red-500 text-xs">{schoolErrors.pincode}</p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Classes and Divisions Configuration */}
                  {currentSchool.section && (
                    <Card className="mb-6 rounded-xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {t('schools.classConfiguration')}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('schools.addClassesDesc', { section: t(`sections.${currentSchool.section}`) })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Class Selection */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">{t('schools.selectClasses')}</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {predefinedClasses[currentSchool.section]?.map((className) => {
                                const isSelected = selectedClass === className;
                                const isAdded = (currentSchool.classes || []).find(
                                  (c) => c.class_name === className
                                );
                                return (
                                  <Button
                                    key={className}
                                    variant={isAdded ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleClassSelect(className)}
                                    className={
                                      isSelected ? 'ring-2 ring-offset-2 ring-orange-500' : ''
                                    }
                                  >
                                    {t(`classes.${className}`, className)}
                                  </Button>
                                );
                              })}
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
                                {t('schools.addDivision')} {selectedClass}
                              </Label>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">
                                    {t('schools.divisionName')} <span className="text-red-500">*</span>
                                  </Label>
                                  {!showCustomDivisionInput ? (
                                    <Select
                                      value={divisionName}
                                      onValueChange={handleDivisionChange}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder={t('schools.selectOrAddDivision')} />
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
                                      placeholder={t('schools.divisionName')}
                                      value={divisionName}
                                      onChange={(e) => setDivisionName(e.target.value)}
                                      className="h-10"
                                      autoFocus
                                    />
                                  )}
                                </div>

                                {/*  

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">Teacher</Label>
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
                                      <SelectValue placeholder="Select teacher" />
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
                                        + Add New Teacher
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div> */}

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">
                                    {t('schools.expectedStudents')} <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder={t('schools.enterNumber')}
                                    value={expectedStudents || ''}
                                    onChange={(e) =>
                                      setExpectedStudents(parseInt(e.target.value) || 0)
                                    }
                                    className="h-10"
                                    min="1"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium opacity-0">{t('common.actions')}</Label>
                                  <Button
                                    onClick={handleAddDivision}
                                    className="w-full h-10"
                                    disabled={!divisionName || !expectedStudents}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('schools.addDivision')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Selected Classes Display */}
                          {(currentSchool.classes || []).length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">{t('schools.selectClassesLabel')}</Label>
                              <div className="flex flex-wrap gap-2">
                                {(currentSchool.classes || []).map((classItem) => {
                                  const isSelected = selectedClass === classItem.class_name;
                                  return (
                                    <Badge
                                      key={classItem.id}
                                      variant="outline"
                                      className={`bg-green-50 text-green-700 px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-green-100 ${isSelected ? 'ring-2 ring-offset-1 ring-green-600' : ''
                                        }`}
                                      onClick={() => setSelectedClass(classItem.class_name)}
                                    >
                                      <span>{t(`classes.${classItem.class_name}`, classItem.class_name)}</span>
                                      <span className="text-xs text-gray-500">
                                        ({t('schools.divCount', { count: classItem.divisions.length })})
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent selecting when removing
                                          handleRemoveClassFromForm(classItem.class_name);
                                        }}
                                        className="ml-1 hover:text-red-600"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {schoolErrors.classes && (
                            <p className="text-sm text-red-500">{schoolErrors.classes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary Table */}
                  {summaryData.length > 0 && (
                    <Card className="mb-6 rounded-xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {t('schools.configSummary')}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('schools.configSummaryDesc')}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[120px]">{t('schools.section')}</TableHead>
                                <TableHead className="w-[150px]">{t('menu.classes')}</TableHead>
                                <TableHead className="w-[120px]">{t('schools.divisionName')}</TableHead>
                                <TableHead className="w-[200px]">{t('schools.classTeacher')}</TableHead>
                                <TableHead className="w-[120px]">{t('schools.expectedStudents')}</TableHead>
                                <TableHead className="w-[120px] text-right">{t('common.actions')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {summaryData.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell className="font-medium">
                                    <Badge variant="outline" className="bg-blue-50">
                                      {t(`sections.${row.section}`)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{t(`classes.${row.class_name}`, row.class_name)}</TableCell>
                                  <TableCell>
                                    {editingRowId === row.id ? (
                                      <Input
                                        value={editFormData.division_name || ''}
                                        onChange={(e) =>
                                          setEditFormData({
                                            ...editFormData,
                                            division_name: e.target.value,
                                          })
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
                                          <SelectValue placeholder={t('schools.selectTeacher')} />
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
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                        >
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

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddSchoolForm(false);
                        setCurrentSchool({
                          schoolName: '',
                          schoolAdminName: '',
                          email: '',
                          phone: '',
                          address: '',
                          city: '',
                          state: '',
                          country: 'India',
                          pincode: '',
                          password: '',
                          confirmPassword: '',
                          section: '',
                          classes: [],
                        });
                        setTeachers([]);
                        setSummaryData([]);
                        setSelectedClass('');
                        setCustomClassName('');
                        setShowCustomClassInput(false);
                        setDivisionName('');
                        setSelectedTeacher('');
                        setClassTeacher('');
                        setExpectedStudents(0);
                        setCustomSectionName('');
                        setShowCustomSectionInput(false);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveSchool}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {currentSchool.schoolId ||
                        (currentSchool.id && schools.some((s) => s.id === currentSchool.id))
                        ? t('schools.updateSchool')
                        : t('schools.addSchool')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button type="button" variant="outline" onClick={handleAddSchool} className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                {t('schools.addSchool')}
              </Button>
            )}

            {/* CONFIGURE SECTION */}
            {schools.map(
              (school) =>
                expandedSchoolId === school.id && (
                  <Card key={school.id} className="mb-4 border-2 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{t('schools.configure')}: {school.schoolName}</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('schools.configureDesc')}
                      </p>
                      {school.section ? (
                        <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-700">
                            {t('schools.selectedSection')}: {t(`sections.${school.section}`)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                          <p className="text-sm text-yellow-800">
                            {t('schools.selectSectionPrompt')}
                          </p>
                        </div>
                      )}

                      {/* Add Class */}
                      {school.section && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <Label className="text-xs font-medium mb-2 block">{t('schools.addClass')}</Label>
                          <div className="flex gap-2">
                            {!showCustomClassInput ? (
                              <>
                                <Select
                                  value={selectedClass}
                                  onValueChange={(value) => {
                                    if (value === '__custom__') {
                                      setShowCustomClassInput(true);
                                      setSelectedClass('');
                                    } else {
                                      setSelectedClass(value);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="flex-1 h-10">
                                    <SelectValue placeholder={t('schools.selectClass')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {school.section &&
                                      predefinedClasses[school.section]?.map((cls) => (
                                        <SelectItem key={cls} value={cls}>
                                          {t(`classes.${cls}`, cls)}
                                        </SelectItem>
                                      ))}
                                    <SelectItem value="__custom__">+ {t('schools.addCustomClass')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                {selectedClass && selectedClass !== '__custom__' && (
                                  <Button type="button" onClick={() => handleAddClass(school.id)}>
                                    {t('schools.addClass')}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <div className="flex gap-2 flex-1">
                                <Input
                                  value={customClassName}
                                  onChange={(e) => setCustomClassName(e.target.value)}
                                  placeholder={t('schools.enterClassName')}
                                  className="h-10"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && customClassName.trim()) {
                                      handleAddClass(school.id);
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (customClassName.trim()) {
                                      handleAddClass(school.id);
                                    }
                                  }}
                                >
                                  {t('common.add')}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setShowCustomClassInput(false);
                                    setCustomClassName('');
                                  }}
                                >
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Classes List */}
                      {school.classes.length > 0 && (
                        <div className="space-y-3">
                          {school.classes.map((cls) => (
                            <div key={cls.id} className="border rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{t(`classes.${cls.class_name}`, cls.class_name)}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveClass(school.id, cls.id)}
                                  className="hover:text-red-600 hover:bg-red-50 hover:border hover:border-red-500"
                                >
                                  <Trash2 className="h-4 w-4 " />
                                </Button>
                              </div>

                              {/* Add Division */}
                              <div className="mb-2 p-2 bg-gray-50 rounded">
                                <Label className="text-xs mb-1 block">{t('schools.addDivision')}</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <Input
                                    value={divisionName}
                                    onChange={(e) => setDivisionName(e.target.value)}
                                    placeholder={t('schools.divisionNamePlaceholder')}
                                    className="h-9 text-sm"
                                  />
                                  <Input
                                    value={classTeacher}
                                    onChange={(e) => setClassTeacher(e.target.value)}
                                    placeholder={t('schools.classTeacherPlaceholder')}
                                    className="h-9 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      value={expectedStudents || ''}
                                      onChange={(e) =>
                                        setExpectedStudents(parseInt(e.target.value) || 0)
                                      }
                                      placeholder={t('schools.expectedStudentsPlaceholder')}
                                      className="h-9 text-sm"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleAddDivisionToSchool(school.id, cls.id)}
                                      className="bg-green-600"
                                    >
                                      {t('common.add')}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Divisions List */}
                              {cls.divisions.length > 0 && (
                                <div className="space-y-1">
                                  {cls.divisions.map((div) => (
                                    <div
                                      key={div.id}
                                      className="flex justify-between items-center p-2 bg-white rounded text-sm"
                                    >
                                      <span>
                                        {div.division_name} - {div.class_teacher} (
                                        {t('schools.studentCount', { count: div.expected_students })})
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveDivision(school.id, cls.id, div.id)
                                        }
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
            )}
          </>

          {/* FOOTER */}
          <div className="flex items-center justify-end mt-6 gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleFormSave}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting
                ? isEditMode
                  ? t('common.updating')
                  : t('common.creating')
                : isEditMode
                  ? t('trusts.update')
                  : t('trusts.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Modal */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teachers.addNewTeacher')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {t('common.fullName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                placeholder={t('common.fullNamePlaceholder')}
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
                placeholder={t('common.emailPlaceholder')}
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
                placeholder={t('common.phonePlaceholder')}
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
                    placeholder={t('teachers.subjectPlaceholder')}
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
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
                {t('common.password')} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                placeholder={t('common.passwordPlaceholder')}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeacherModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTeacher}>{t('teachers.addTeacher')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
