import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { CheckSquare, Download, Printer, Square, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  Edit,
  Users,
  Clock,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore
import { TemplateManager } from './components/TemplateManager';
// @ts-ignore
import { PrintPreview } from './components/PrintPreview';
import { CustomDialog } from '../teacher/CustomDialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { studentService } from '@/api/studentService';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';

const EditableField = ({
  label,
  value,
  name,
  isEditing,
  onChange,
  type = 'text',
  placeholder = '',
  maxLength,
}: {
  label: string;
  value: any;
  name: string;
  isEditing: boolean;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) => (
  <div>
    <p
      style={{
        fontSize: '9px',
        fontWeight: 700,
        color: '#64748b',
        marginBottom: '2px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </p>
    {isEditing ? (
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
        onChange={(e) => onChange(name, e.target.value)}
      />
    ) : (
      <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{value || t('studentDataSheet.na')}</p>
    )}
  </div>
);

const formatDate = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  // If it's an Excel serial number
  if (typeof val === 'number') {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    } catch (e) {
      return String(val);
    }
  }
  // If it's already a string, return as is
  return String(val);
};

const formatDateForDisplay = (val: any) => {
  const dateStr = formatDate(val);
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y.length === 4) return `${d}/${m}/${y}`;
  }
  return dateStr;
};

import { useAuth } from '@/hooks/useAuth';
import { t } from 'i18next';

export default function StudentDataSheet() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // In our UI component, Table has an internal wrapper with overflow-x-auto
      const container =
        scrollContainerRef.current.querySelector('[data-slot="table-container"]') ||
        scrollContainerRef.current;
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState<any>(null);

  const resolveImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (userData?.id) {
        try {
          const response = await axiosInstance.get(`/api/school/info/public/${userData.id}`);
          if (response.data) {
            // The API likely returns { success: true, data: { ... } } or just the object
            // Adjust based on typical API response structure in this project
            setSchool(response.data.data || response.data);
          }
        } catch (error) {
          console.error('Failed to fetch school info:', error);
        }
      }
    };
    fetchSchoolInfo();
  }, [userData?.id]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [template, setTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const { selectedClass } = location.state || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newFiles, setNewFiles] = useState<Record<string, File>>({});
  const [printLanguage, setPrintLanguage] = useState<string>('en');
  const [isLangLoading, setIsLangLoading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // const [students, setStudents] = useState<any[]>(selectedClass?.students || []);
  // const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  // const [viewStudent, setViewStudent] = useState<any | null>(null);

  // // Print & Template State
  // const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  // const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  // const [studentsToPrint, setStudentsToPrint] = useState<any[]>([]);

  // const normalizeStudentData = (data: any[]) => {
  //   return data.map((s) => {
  //     // If it already seems to have the Excel-like headers, check if we need to ensure Photo is there
  //     // But purely relying on 'Student Name' existence might be flaky if we mix data sources.
  //     // Let's force mapping if the snake_case keys exist to ensure consistency.

  //     return {
  //       ...s,
  //       'Student Name': s['Student Name'] || s.name || s.student_name || '',
  //       'Roll No': s['Roll No'] || s.roll_number || s.rollNo || '',
  //       DOB: s['DOB'] || s.dob || s.date_of_birth || '',
  //       Gender: s['Gender'] || s.gender || '',
  //       Blood: s['Blood'] || s.blood_group || s.bloodGroup || '',
  //       Address: s['Address'] || s.address || '',
  //       'Father Name': s['Father Name'] || s.father_name || s.fatherName || '',
  //       'Father Phone': s['Father Phone'] || s.father_phone || s.fatherPhone || '',
  //       'Mother Name': s['Mother Name'] || s.mother_name || s.motherName || '',
  //       'Mother Phone': s['Mother Phone'] || s.mother_phone || s.motherPhone || '',
  //       Emergency: s['Emergency'] || s.emergency_contact || s.emergencyContact || '',
  //       Photo: s['Photo'] || s.photo || s.url || s.profile_image || '',
  //       Status: s['Status'] || s.status || 'pending',
  //       'ID Status': s['ID Status'] || s.id_status || 'Not Printed',
  //       'Form ID': s['Form ID'] || s.id || s._id,
  //     };
  //   });
  // };

  // useEffect(() => {
  //   const fetchStudents = async () => {
  //     // If we don't have class info, we can't fetch
  //     if (!selectedClass?.class || !selectedClass?.division) return;

  //     try {
  //       // Use the API as requested
  //       const response = await axiosInstance.get('/api/school/class-students', {
  //         params: {
  //           className: selectedClass.class,
  //           division: selectedClass.division,
  //         },
  //       });

  //       // Handle response data - check if it's directly an array or inside a property
  //       const fetchedStudents = response.data?.students || response.data || [];

  //       if (Array.isArray(fetchedStudents)) {
  //         setStudents(normalizeStudentData(fetchedStudents));
  //       } else {
  //         // Fallback if structure is unexpected
  //         console.warn('Unexpected API response structure:', response.data);
  //         if (selectedClass?.students) {
  //           setStudents(normalizeStudentData(selectedClass.students));
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error fetching students:', error);
  //       toast.error('Failed to fetch updated student list');
  //       // Fallback to passed state if API fails
  //       if (selectedClass?.students) {
  //         setStudents(normalizeStudentData(selectedClass.students));
  //       }
  //     }
  //   };

  //   fetchStudents();
  // }, [selectedClass]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/school/class-students', {
          params: {
            className: selectedClass?.class,
            division: selectedClass?.division,
          },
        });

        if (!response.data) {
          throw new Error('Failed to fetch students');
        }

        const data = response.data;
        // Assuming the API returns an array or an object with a data property containing the array
        const studentsData = Array.isArray(data) ? data : data.students || data.data || [];

        const normalized = studentsData.map((s: any) => {
          const student_middle = s.middle_name || s.father_first_name || (s.father_name ? s.father_name.split(' ')[0] : '');
          const student_name = (s.first_name || s.last_name)
            ? `${s.first_name || ''} ${student_middle} ${s.last_name || ''}`
              .replace(/\s+/g, ' ')
              .trim()
            : s.student_name || s.name || '';

          const father_name = (s.father_first_name || s.father_last_name)
            ? `${s.father_first_name || ''} ${s.father_middle_name || ''} ${s.father_last_name || ''}`
              .replace(/\s+/g, ' ')
              .trim()
            : s.father_name || s.fatherName || '';

          const mother_name = (s.mother_first_name || s.mother_last_name)
            ? `${s.mother_first_name || ''} ${s.mother_middle_name || ''} ${s.mother_last_name || ''}`
              .replace(/\s+/g, ' ')
              .trim()
            : s.mother_name || s.motherName || '';

          return {
            ...s,
            student_name,
            'Student Name': student_name,
            father_name,
            'Father Name': father_name,
            mother_name,
            'Mother Name': mother_name,
          };
        });

        setStudents(normalized);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleUpdateStudent = async () => {
    if (!editStudent) return;

    const studentId =
      editStudent.id || editStudent.ID || editStudent.student_id || editStudent['Form ID'];

    if (!studentId) {
      toast.error(t('studentDataSheet.messages.idMissing'));
      return;
    }

    // Validation
    if (editData.father_phone && editData.father_phone.length !== 10) {
      toast.error(t('common.invalidPhone', 'Phone number must be exactly 10 digits'));
      return;
    }
    if (editData.mother_phone && editData.mother_phone.length !== 10) {
      toast.error(t('common.invalidPhone', 'Phone number must be exactly 10 digits'));
      return;
    }
    if (editData.emergency_contact && editData.emergency_contact.length !== 10) {
      toast.error(t('common.invalidPhone', 'Emergency contact must be exactly 10 digits'));
      return;
    }
    if (editData.pin_code && editData.pin_code.length !== 6) {
      toast.error(t('common.invalidPincode', 'Pincode must be exactly 6 digits'));
      return;
    }

    try {
      const formData = new FormData();

      // Construct names from pieces before sending
      const student_name = `${editData.first_name || ''} ${editData.middle_name || ''} ${editData.last_name || ''}`.replace(/\s+/g, ' ').trim();
      const father_name = `${editData.father_first_name || ''} ${editData.father_middle_name || ''} ${editData.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
      const mother_name = `${editData.mother_first_name || ''} ${editData.mother_middle_name || ''} ${editData.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();

      // Append text fields with multiple key variations for safety
      formData.append('name', student_name);
      formData.append('student_name', student_name);
      formData.append('first_name', String(editData.first_name || ''));
      formData.append('middle_name', String(editData.middle_name || ''));
      formData.append('last_name', String(editData.last_name || ''));

      formData.append('father_name', father_name);
      formData.append('father_first_name', String(editData.father_first_name || ''));
      formData.append('father_middle_name', String(editData.father_middle_name || ''));
      formData.append('father_last_name', String(editData.father_last_name || ''));

      formData.append('mother_name', mother_name);
      formData.append('mother_first_name', String(editData.mother_first_name || ''));
      formData.append('mother_middle_name', String(editData.mother_middle_name || ''));
      formData.append('mother_last_name', String(editData.mother_last_name || ''));

      formData.append('roll_number', String(editData.roll_number || ''));
      formData.append('rollNo', String(editData.roll_number || ''));
      formData.append('dob', formatDate(editData.dob) || '');
      formData.append('gender', String(editData.gender || ''));
      formData.append('blood_group', String(editData.blood_group || ''));
      formData.append('address', String(editData.address || ''));
      formData.append('father_phone', String(editData.father_phone || ''));
      formData.append('mother_phone', String(editData.mother_phone || ''));
      formData.append('emergency_contact', String(editData.emergency_contact || ''));
      formData.append('street_address', String(editData.street_address || ''));
      formData.append('city', String(editData.city || ''));
      formData.append('state', String(editData.state || ''));
      formData.append('pin_code', String(editData.pin_code || ''));
      formData.append('aadhar_no', String(editData.aadhar_no || ''));

      // Append Photo if selected
      if (newFiles.photo) {
        formData.append('photo', newFiles.photo);
      }

      // Append Sign if selected
      if (newFiles.sign) {
        formData.append('student_signature', newFiles.sign);
      }

      await studentService.updateStudent(studentId, formData);

      // update local table data
      const updatedStudents = students.map((s) => {
        const sId = s.id || s.ID || s.student_id || s['Form ID'];
        const eId =
          editStudent.id || editStudent.ID || editStudent.student_id || editStudent['Form ID'];
        const isMatch = sId && eId ? sId === eId : s === editStudent;

        if (isMatch) {
          const student_name = `${editData.first_name || ''} ${editData.middle_name || ''} ${editData.last_name || ''}`.replace(/\s+/g, ' ').trim();
          const father_name = `${editData.father_first_name || ''} ${editData.father_middle_name || ''} ${editData.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
          const mother_name = `${editData.mother_first_name || ''} ${editData.mother_middle_name || ''} ${editData.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();

          // Update local update object
          const updated = {
            ...s,
            student_name,
            'Student Name': student_name,
            first_name: editData.first_name,
            middle_name: editData.middle_name,
            last_name: editData.last_name,
            roll_number: editData.roll_number,
            'Roll No': editData.roll_number,
            dob: editData.dob,
            DOB: editData.dob,
            gender: editData.gender,
            Gender: editData.gender,
            blood_group: editData.blood_group,
            Blood: editData.blood_group,
            address: editData.address,
            Address: editData.address,
            father_name,
            'Father Name': father_name,
            father_first_name: editData.father_first_name,
            father_middle_name: editData.father_middle_name,
            father_last_name: editData.father_last_name,
            father_phone: editData.father_phone,
            'Father Phone': editData.father_phone,
            mother_name,
            'Mother Name': mother_name,
            mother_first_name: editData.mother_first_name,
            mother_middle_name: editData.mother_middle_name,
            mother_last_name: editData.mother_last_name,
            mother_phone: editData.mother_phone,
            'Mother Phone': editData.mother_phone,
            emergency_contact: editData.emergency_contact,
            Emergency: editData.emergency_contact,
            street_address: editData.street_address,
            city: editData.city,
            state: editData.state,
            pin_code: editData.pin_code,
            aadhar_no: editData.aadhar_no,
          };

          // If photo was updated, update the preview
          if (newFiles.photo) {
            updated.photo = URL.createObjectURL(newFiles.photo);
            updated['Photo'] = updated.photo;
          }
          // If sign was updated, update the preview
          if (newFiles.sign) {
            updated.student_signature = URL.createObjectURL(newFiles.sign);
            updated['Sign'] = updated.student_signature;
          }
          return updated;
        }
        return s;
      });

      setStudents(updatedStudents);
      setIsEditDialogOpen(false);
      setEditStudent(null);
      setNewFiles({}); // Clear selected files
      setIsEditing(false);
      toast.success(t('studentDataSheet.messages.updateSuccess'));
    } catch (error: any) {
      console.error('Student update failed', error);
      const errorMessage = error.response?.data?.message || t('studentDataSheet.messages.updateFailed');
      toast.error(errorMessage);
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setNewFiles((prev) => ({ ...prev, [name]: file }));
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(students || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `${selectedClass?.class}_${selectedClass?.division}_students.xlsx`);
  };

  // ⭐ FILTER + SEARCH
  // const filteredStudents = students.filter((s) => {
  //   const name = String(s['Student Name'] || '').toLowerCase();
  //   const roll = String(s['Roll No'] || '').toLowerCase();
  //   const father = String(s['Father Name'] || '').toLowerCase();
  //   const q = searchTerm.trim().toLowerCase();

  //   // Console log for debugging
  //   if (q.length > 0 && q.length < 3) {
  //     // Log only for short queries to avoid spam
  //     // console.log("Filtering:", { name, roll, father, q });
  //   }

  //   const matchSearch =
  //     q === '' ? true : name.includes(q) || roll.includes(q) || father.includes(q);

  //   const status = String(s.Status || '').toLowerCase();
  //   const matchFilter =
  //     filterType === 'All'
  //       ? true
  //       : filterType === 'Approved'
  //       ? status === 'approved'
  //       : filterType === 'Missing'
  //       ? status !== 'approved'
  //       : true;

  //   return matchSearch && matchFilter;
  // });

  // const [selectedStudents, setSelectedStudents] = useState([]);

  // console.log('Selected Students:', selectedStudents);

  const getStudentId = (student) => student.id; // adjust if your id key is different

  const isSelected = (student) =>
    selectedStudents.some((s) => getStudentId(s) === getStudentId(student));

  const mapStudentData = (student: any) => {
    return {
      ...student,
      // Map display keys to internal keys expected by PrintPreview/CardElement
      name: student['Student Name'],
      standard: `${selectedClass?.class} - ${selectedClass?.division}`,
      dob: student['DOB'],
      gender: student['Gender'],
      blood_group: student['Blood'],
      address: student['Address'],
      roll_number: student['Roll No'],
      father_name: student['Father Name'],
      mother_name: student['Mother Name'],
      father_phone: student['Father Phone'],
      mother_phone: student['Mother Phone'],
      emergency_contact: student['Emergency'],
      // Robust photo mapping: check mapped Capital Key, then lowercase, then others
      photo: student['Photo'] || student['photo'] || student['url'] || student['src'],
    };
  };

  // const handleGenerateIDs = (studentsToGenerate: any[]) => {
  //   setStudentsToPrint(studentsToGenerate);
  //   setIsTemplateManagerOpen(true);
  // };

  // const handleTemplateSelect = (template: any) => {
  //   setSelectedTemplate(template);
  //   // Allow React to render the portal content before printing
  //   setTimeout(() => {
  //     window.print();
  //   }, 500);
  // };

  // Load templates from local storage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('id_card_templates');
      const allTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
      setAvailableTemplates(allTemplates);

      // Try to load the "active" template first (legacy key), or fall back to the first available
      const savedActive = localStorage.getItem('id_card_template');
      let activeTemplate = savedActive ? JSON.parse(savedActive) : null;

      if (activeTemplate) {
        setTemplate(activeTemplate);
        setSelectedTemplateId(activeTemplate.id || '');
      } else if (allTemplates.length > 0) {
        const defaultT = allTemplates[0];
        setTemplate(defaultT);
        setSelectedTemplateId(defaultT.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const selected = availableTemplates.find((t) => t.id === id);
    if (selected) {
      setTemplate(selected);
      // Optional: persist selection as 'active' for other pages?
      // localStorage.setItem('id_card_template', JSON.stringify(selected));
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const filteredStudents = useMemo(
    () =>
      (students || []).filter(
        (s) =>
          (s.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.roll_number || '').toString().includes(searchTerm)
      ),
    [students, searchTerm]
  );

  const selectedStudents = useMemo(
    () => (students || []).filter((s) => selectedIds.has(s.id)),
    [students, selectedIds]
  );

  const mappedSchoolData = useMemo(() => {
    if (!school) return null;
    return {
      ...school,
      school_logo: school.logo
        ? school.logo.startsWith('http')
          ? school.logo
          : `${import.meta.env.VITE_BACKEND_URL}${school.logo}`
        : '',
      principal_sign:
        school.principal_sign || school.principal_signature
          ? (school.principal_sign || school.principal_signature).startsWith('http')
            ? school.principal_sign || school.principal_signature
            : `${import.meta.env.VITE_BACKEND_URL}${school.principal_sign || school.principal_signature
            }`
          : '',
    };
  }, [school]);

  const printStudents = useMemo(
    () =>
      selectedStudents.map((s) => ({
        ...s,
        school_name: school?.school_name || school?.name || '',
        school_address: school?.address || '',
        trust_name: school?.trust_name || '',
        school_logo: school?.school_logo
          ? school.school_logo.startsWith('http')
            ? school.school_logo
            : `${import.meta.env.VITE_BACKEND_URL}${school.school_logo}`
          : '',
        principal_sign:
          school?.principal_sign || school?.principal_signature
            ? (school.principal_sign || school.principal_signature).startsWith('http')
              ? school.principal_sign || school.principal_signature
              : `${import.meta.env.VITE_BACKEND_URL}${school.principal_sign || school.principal_signature
              }`
            : '',
        standard: `${selectedClass?.class} - ${selectedClass?.division}`,
      })),
    [selectedStudents, school, selectedClass]
  );

  const handlePrint = async () => {
    if (selectedStudents.length === 0) {
      alert(t('studentDataSheet.messages.selectStudent'));
      return;
    }
    if (!template) {
      alert(t('studentDataSheet.messages.templateNotFound'));
      return;
    }

    try {
      const studentIds = selectedStudents.map((s) => s.id);
      const response = await axiosInstance.post('/api/school/generate-id', {
        student_form_ids: studentIds,
      });

      if (response.data.success === true) {
        toast.success(t('studentDataSheet.messages.idsGenerated'));
        const originalTitle = document.title;
        document.title = `${selectedClass?.class} - ${t('studentDataSheet.stats.total')} Cards`;
        window.print();
        document.title = originalTitle;
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Failed to generate IDs', error);
      toast.error(error.response.data.message);
    }
  };

  // ── Bulk Delete ───────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await axiosInstance.post('/api/school/student-forms/delete-bulk', { ids });
      setStudents((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      const count = selectedIds.size;
      setSelectedIds(new Set());
      setIsDeleteConfirmOpen(false);
      toast.success(t('studentDataSheet.messages.deleteSuccess', { count }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('studentDataSheet.messages.deleteFailed'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        {/* Back Button */}
        <Button
          className="flex items-center text-orange-500 border bg-white border-orange-600 hover:bg-orange-500 hover:text-white group"
          onClick={() => navigate('/school-dashboard/digital-forms')}
        >
          {t('studentDataSheet.backToDigitalForms')}
        </Button>

        <div className="px-6 py-4 flex flex-col text-center">
          <h1 className="text-2xl font-bold">
            {t('studentDataSheet.header.class', { className: selectedClass?.class })} - {t('studentDataSheet.header.division', { divisionName: selectedClass?.division })}
          </h1>
          <p className="text-gray-600 text-[15px] ">
            {t('studentDataSheet.header.teacher', { teacherName: 'Mrs. Sharma' })} • {t('studentDataSheet.header.totalStudents', { count: students.length })}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-2">
          {/* Template Selector */}
          <div className="flex items-center space-x-2 mr-2">
            <span className="text-sm font-medium text-gray-600">{t('studentDataSheet.template')}</span>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {availableTemplates.length === 0 && <option value="">{t('studentDataSheet.noTemplates')}</option>}
              {availableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2 mr-2">
            <span className="text-sm font-medium text-gray-600">{t('studentDataSheet.lang')}</span>
            <select
              value={printLanguage}
              onChange={(e) => setPrintLanguage(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="en">{t('studentDataSheet.languages.en')}</option>
              <option value="mr">{t('studentDataSheet.languages.mr')}</option>
              <option value="hi">{t('studentDataSheet.languages.hi')}</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedIds.size === 0 || isLangLoading}
        >
          <Printer size={16} />
          <span>
            {isLangLoading
              ? t('studentDataSheet.translating', { progress: Math.round(translationProgress * 100) })
              : t('studentDataSheet.generatePdf', { count: selectedIds.size })}
          </span>
        </button>
        {/* <button
          onClick={() => {
            handleGenerateIDs(selectedStudents.length > 0 ? selectedStudents : students);
            console.log(
              'Generating IDs for:',
              selectedStudents.length > 0 ? selectedStudents : students
            );
          }}
          className={`w-fit text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group  ${
            selectedStudents.length > 0 ? 'visible' : 'invisible'
          }
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200`}
        >
          <Download className="w-6 h-6 text-white" />
          {selectedStudents.length > 0 ? 'Generate IDs for Selected' : 'Generate IDs for All'}
        </button> */}
      </div>

      {/* Class Header */}

      {/* ⭐ TOP STATS BAR */}
      <div className="bg-white border rounded-xl px-6 py-4 mb-6 shadow-xl mt-4 mx-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">{t('studentDataSheet.stats.selectedStudents')}</p>
            <p className="text-lg font-semibold">{selectedStudents.length}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">{t('studentDataSheet.stats.total')}</p>
            <p className="text-lg font-semibold">{students.length}</p>
          </div>

          {/* <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">Submitted</p>
            <p className="text-lg font-semibold ">
              {students.filter((s) => s.Status === 'approved').length}
            </p>
          </div> */}

          <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">{t('studentDataSheet.stats.teacherApproved')}</p>
            <p className="text-lg font-semibold ">
              {
                students.filter((s) => (s.status || s.Status || '').toLowerCase() === 'approved')
                  .length
              }
            </p>
          </div>
          {/* 
          <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">Admin Approved</p>
            <p className="text-lg font-semibold ">
              {students.filter((s) => s.Status === 'approved').length}
            </p>
          </div> */}

          <div className="flex-1 text-center">
            <p className="text-gray-500 font-semibold text-xl">{t('studentDataSheet.stats.missingPhoto')}</p>
            <p className="text-lg font-semibold">
              {
                students.filter((s) => {
                  const photo = s.photo || s.Photo || s.url || s.src || '';
                  return (
                    !photo ||
                    photo === '' ||
                    photo === 'null' ||
                    photo === 'undefined' ||
                    photo.toString().trim() === ''
                  );
                }).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* ⭐ SEARCH + FILTER BAR */}
      <div className="w-full flex items-center mb-1 gap-3 px-6">
        {/* Search Bar & Bulk Actions */}
        <div className="flex items-center flex-[1] gap-2">
          <div className="flex items-center flex-1 relative">
            <svg
              className="h-5 w-5 text-gray-400 absolute left-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 12.65z"
              />
            </svg>

            <input
              type="text"
              placeholder={t('studentDataSheet.search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-2 px-4 h-[42px] shadow-md transition-all whitespace-nowrap"
            >
              <Trash2 size={18} />
              <span className="font-bold">{t('studentDataSheet.delete.button', { count: selectedIds.size })}</span>
            </Button>
          )}
        </div>

        {/* Dropdown */}
        <div className="w-[150px]">
          <select
            className="border px-4 py-2 rounded-lg bg-white shadow-sm w-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">{t('studentDataSheet.filters.all')}</option>
            <option value="Approved">{t('studentDataSheet.filters.approved')}</option>
            <option value="Missing">{t('studentDataSheet.filters.missing')}</option>
            <option value="Submitted">{t('studentDataSheet.filters.submitted')}</option>
          </select>
        </div>

        {/* Scroll Buttons */}
        <div className="flex gap-1 ml-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollTable('left')}
            className="h-10 w-10 border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollTable('right')}
            className="h-10 w-10 border-gray-300 hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>



      {/* ── DELETE CONFIRMATION DIALOG ───────────────────── */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteConfirmOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{t('studentDataSheet.delete.confirmTitle')}</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {t('studentDataSheet.delete.confirmDesc', { count: selectedIds.size })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isBulkDeleting}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('studentDataSheet.delete.cancel')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-60 active:scale-95"
              >
                {isBulkDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('studentDataSheet.delete.deleting')}</>
                ) : (
                  <><Trash2 className="w-4 h-4" />{t('studentDataSheet.delete.confirmDelete', { count: selectedIds.size })}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 relative">
        <Table className="min-w-max border-collapse">
          <TableHeader className="sticky top-0 bg-gray-300 z-10 shadow-sm transition-all">
            <TableRow>

              <TableHead className="w-[40px] text-center">
                <button
                  onClick={toggleAll}
                  className="flex items-center justify-center text-gray-500 hover:text-blue-600 cursor-pointer"
                >
                  {filteredStudents.length > 0 && selectedIds.size === filteredStudents.length ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </TableHead>

              <TableHead>{t('studentDataSheet.table.rollNo')}</TableHead>

              <TableHead>{t('studentDataSheet.table.photo')}</TableHead>
              <TableHead>{t('studentDataSheet.table.studentName')}</TableHead>
              <TableHead>{t('studentDataSheet.table.dob')}</TableHead>
              <TableHead>{t('studentDataSheet.table.gender')}</TableHead>
              <TableHead>{t('studentDataSheet.table.bloodGroup')}</TableHead>
              <TableHead>{t('studentDataSheet.table.address')}</TableHead>
              <TableHead>{t('studentDataSheet.table.fatherName')}</TableHead>
              <TableHead>{t('studentDataSheet.table.fatherPhone')}</TableHead>
              <TableHead>{t('studentDataSheet.table.motherName')}</TableHead>
              <TableHead>{t('studentDataSheet.table.motherPhone')}</TableHead>
              <TableHead>{t('studentDataSheet.table.emergency')}</TableHead>
              <TableHead>{t('studentDataSheet.table.status')}</TableHead>
              <TableHead>{t('studentDataSheet.table.teacher')}</TableHead>
              <TableHead>{t('studentDataSheet.table.admin')}</TableHead>
              <TableHead>{t('studentDataSheet.table.sign')}</TableHead>
              <TableHead>{t('studentDataSheet.table.action')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredStudents.map((student) => {
              const isApproved = student?.status === 'approved';

              return (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="text-center">
                    <button
                      onClick={() => toggleSelection(student.id)}
                      className={`flex items-center justify-center cursor-pointer ${selectedIds.has(student.id)
                        ? 'text-blue-600'
                        : 'text-gray-300 hover:text-gray-400'
                        }`}
                    >
                      {selectedIds.has(student.id) ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </TableCell>

                  <TableCell>{student.roll_number}</TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border mx-auto overflow-hidden ${student.photo || student.Photo
                        ? 'bg-white border-gray-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      {(() => {
                        const photoUrl = student.photo || student.Photo || student.url || student.src;
                        return photoUrl && photoUrl !== 'null' && photoUrl !== 'undefined' ? (
                          <img
                            src={resolveImageUrl(photoUrl)}
                            alt={t('studentDataSheet.table.photo')}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-student.png';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-red-300" />
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="truncate cursor-default" title={student['Student Name']}>
                    {student.student_name}
                  </TableCell>
                  <TableCell>{formatDateForDisplay(student.dob || student.DOB)}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.blood_group}</TableCell>
                  <TableCell className="truncate cursor-default" title={student['Address']}>
                    {student.address}
                  </TableCell>
                  <TableCell className="truncate cursor-default" title={student['Father Name']}>
                    {student.father_name}
                  </TableCell>
                  <TableCell>{student.father_phone}</TableCell>
                  <TableCell className="truncate cursor-default" title={student['Mother Name']}>
                    {student.mother_name}
                  </TableCell>
                  <TableCell>{student.mother_phone}</TableCell>
                  <TableCell>{student.emergency_contact}</TableCell>

                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {/* {isApproved ? 'Submitted' : 'Missing Info'} */}
                      {isApproved
                        ? student.id_status === 'Not Printed'
                          ? t('studentDataSheet.status.submitted')
                          : student.id_status === 'Printed'
                            ? t('studentDataSheet.status.printed')
                            : student.id_status
                        : t('studentDataSheet.status.missingInfo')}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    {isApproved ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    {isApproved ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    )}
                  </TableCell>


                  <TableCell className="text-center">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border mx-auto ${student.student_signature || student.sign ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                        }`}
                    >
                      <Pencil
                        className={`w-4 h-4 ${student.student_signature || student.sign ? 'text-green-700' : 'text-red-700'}`}
                      />
                    </div>
                  </TableCell>

                  {/* <TableCell className="text-center">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border mx-auto ${student.student_signature || student.sign
                        ? 'bg-green-100 border-green-300'
                        : 'bg-red-100 border-red-300'
                        }`}
                    >
                      <Pencil
                        className={`w-4 h-4 ${student.student_signature || student.sign
                          ? 'text-green-700'
                          : 'text-red-700'
                          }`}
                      />
                    </div>
                  </TableCell> */}

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditStudent(student);
                          setEditData({
                            student_name: student.student_name || student['Student Name'] || '',
                            first_name: student.first_name || (() => {
                              const parts = (student.student_name || student['Student Name'] || '').trim().split(/\s+/);
                              return parts[0] || '';
                            })(),
                            middle_name: student.middle_name || student.father_first_name || (() => {
                              const parts = (student.student_name || student['Student Name'] || '').trim().split(/\s+/);
                              return parts.length >= 3 ? parts.slice(1, parts.length - 1).join(' ') : '';
                            })(),
                            last_name: student.last_name || (() => {
                              const parts = (student.student_name || student['Student Name'] || '').trim().split(/\s+/);
                              return parts.length >= 2 ? parts[parts.length - 1] : '';
                            })(),
                            roll_number: student.roll_number || student['Roll No'] || '',
                            dob: formatDate(student.dob || student['DOB']),
                            gender: student.gender || student['Gender'] || '',
                            phone: student.phone || student['Phone'] || '',
                            class: student.class || student['Class'] || '',
                            section: student.section || student['Section'] || '',
                            photo: student.photo || student['Photo'] || '',
                            sign: student.student_signature || student.sign || student['Sign'] || '',
                            blood_group: student.blood_group || student['Blood'] || '',
                            address: student.address || student['Address'] || '',
                            father_name: student.father_name || student['Father Name'] || '',
                            father_first_name: student.father_first_name || (() => {
                              const parts = (student.father_name || student['Father Name'] || '').trim().split(/\s+/);
                              return parts[0] || '';
                            })(),
                            father_middle_name: student.father_middle_name || (() => {
                              const parts = (student.father_name || student['Father Name'] || '').trim().split(/\s+/);
                              return parts.length >= 3 ? parts.slice(1, parts.length - 1).join(' ') : '';
                            })(),
                            father_last_name: student.father_last_name || (() => {
                              const parts = (student.father_name || student['Father Name'] || '').trim().split(/\s+/);
                              return parts.length >= 2 ? parts[parts.length - 1] : '';
                            })(),
                            father_phone: student.father_phone || student['Father Phone'] || '',
                            mother_name: student.mother_name || student['Mother Name'] || '',
                            mother_first_name: student.mother_first_name || (() => {
                              const parts = (student.mother_name || student['Mother Name'] || '').trim().split(/\s+/);
                              return parts[0] || '';
                            })(),
                            mother_middle_name: student.mother_middle_name || (() => {
                              const parts = (student.mother_name || student['Mother Name'] || '').trim().split(/\s+/);
                              return parts.length >= 3 ? parts.slice(1, parts.length - 1).join(' ') : '';
                            })(),
                            mother_last_name: student.mother_last_name || (() => {
                              const parts = (student.mother_name || student['Mother Name'] || '').trim().split(/\s+/);
                              return parts.length >= 2 ? parts[parts.length - 1] : '';
                            })(),
                            mother_phone: student.mother_phone || student['Mother Phone'] || '',
                            emergency_contact:
                              student.emergency_contact || student['Emergency'] || '',
                            city: student.city || '',
                            state: student.state || '',
                            pin_code: student.pin_code || '',
                            aadhar_no: student.aadhar_no || '',
                          });
                          setIsEditing(true);
                          setIsEditDialogOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700 hover:bg-green-100 px-2 py-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('studentDataSheet.actions.edit')}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/school-dashboard/student-data-sheet/view', {
                            state: { student },
                          });
                        }}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-700 hover:bg-orange-100 px-2 py-1 rounded"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{t('studentDataSheet.actions.view')}</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CustomDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="900px"
      >
        {editStudent && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(to right, #1f2937, #374151, #4b5563)',
                padding: '24px',
                borderRadius: '8px 8px 0 0',
              }}
              className="text-white relative overflow-hidden"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

              <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.2s ease-in-out',
                      position: 'relative',
                    }}
                  >
                    {newFiles.photo ? (
                      <img
                        src={URL.createObjectURL(newFiles.photo)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={t('studentDataSheet.table.photo')}
                      />
                    ) : editStudent.photo ? ( // Assuming Photo URL is in editStudent.Photo
                      <img
                        src={editStudent.photo}
                        alt={editData.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-student.png';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <Users style={{ width: '48px', height: '48px', color: '#d1d5db' }} />
                      </div>
                    )}

                    {isEditing && (
                      <label
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        className="hover:bg-black/60"
                      >
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                        />
                        <Pencil
                          style={{
                            width: '24px',
                            height: '24px',
                            color: '#fff',
                            marginBottom: '4px',
                          }}
                        />
                        <p style={{ color: '#fff', fontSize: '9px', fontWeight: 800 }}>
                          {t('studentDataSheet.dialog.changePhoto')}
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.2s ease-in-out',
                      position: 'relative',
                    }}
                  >
                    {newFiles.sign ? (
                      <img
                        src={URL.createObjectURL(newFiles.sign)}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        alt="Signature"
                      />
                    ) : editData.sign ? (
                      <img
                        src={editData.sign}
                        alt="Signature"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-sign.png';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <Pencil style={{ width: '48px', height: '48px', color: '#d1d5db' }} />
                      </div>
                    )}

                    {isEditing && (
                      <label
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        className="hover:bg-black/60"
                      >
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={(e) => handleFileChange('sign', e.target.files?.[0] || null)}
                        />
                        <Pencil
                          style={{
                            width: '24px',
                            height: '24px',
                            color: '#fff',
                            marginBottom: '4px',
                          }}
                        />
                        <p style={{ color: '#fff', fontSize: '9px', fontWeight: 800 }}>
                          {t('studentDataSheet.dialog.changeSign')}
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}
                  >
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        letterSpacing: '-0.025em',
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      {editStudent.student_name}
                    </h2>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Clock style={{ width: '12px', height: '12px' }} />{' '}
                      {editStudent.status?.toUpperCase() || t('studentDataSheet.dialog.unknownStatus')}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>{t('studentDataSheet.dialog.roll')}</span>
                      <span>{editStudent.roll_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-auto">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className=""
                    variant={isEditing ? 'default' : 'secondary'}
                    style={isEditing ? { backgroundColor: '#2563eb' } : {}}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" /> {t('studentDataSheet.dialog.saveMode')}
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" /> {t('studentDataSheet.dialog.editDetails')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div
              style={{ padding: '24px 32px' }}
              className="space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '32px',
                }}
              >
                {/* Personal Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#64748b',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('studentDataSheet.dialog.studentProfile')}
                  </h3>
                  <div
                    style={{
                      backgroundColor: 'rgba(249, 250, 251, 0.5)',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      padding: '20px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      <EditableField
                        label="First Name"
                        value={editData.first_name}
                        name="first_name"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label="Middle (Father's) Name"
                        value={editData.middle_name}
                        name="middle_name"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label="Last Name"
                        value={editData.last_name}
                        name="last_name"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.dialog.middleName')}
                        value={editData.middle_name}
                        name="middle_name"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.dialog.lastName')}
                        value={editData.last_name}
                        name="last_name"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.dialog.roll')}
                        value={isEditing ? editData.roll_number : editStudent.roll_number}
                        name="roll_number"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.dialog.birthDate')}
                        value={isEditing ? editData.dob : formatDateForDisplay(editStudent.dob || editStudent.DOB)}
                        name="dob"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                        type="date"
                      />
                      <EditableField
                        label={t('studentDataSheet.table.gender')}
                        value={isEditing ? editData.gender : editStudent.gender}
                        name="gender"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.table.bloodGroup')}
                        value={isEditing ? editData.blood_group : editStudent.blood_group}
                        name="blood_group"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.dialog.aadharNo')}
                        value={isEditing ? editData.aadhar_no : editStudent.aadhar_no}
                        name="aadhar_no"
                        isEditing={isEditing}
                        onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                      />
                      <EditableField
                        label={t('studentDataSheet.table.emergency')}
                        value={
                          isEditing ? editData.emergency_contact : editStudent.emergency_contact
                        }
                        name="emergency_contact"
                        isEditing={isEditing}
                        maxLength={10}
                        onChange={(n, v) => {
                          const sanitized = v.replace(/\D/g, '').slice(0, 10);
                          setEditData({ ...editData, [n]: sanitized });
                        }}
                      />
                    </div>

                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t('studentDataSheet.dialog.addressInfo')}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '12px',
                          fontSize: '12px',
                        }}
                      >
                        <EditableField
                          label={t('studentDataSheet.table.address')}
                          value={isEditing ? editData.address : editStudent.address}
                          name="address"
                          isEditing={isEditing}
                          onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                        />
                        <EditableField
                          label={t('studentDataSheet.dialog.city')}
                          value={isEditing ? editData.city : editStudent.city}
                          name="city"
                          isEditing={isEditing}
                          onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                        />
                        <EditableField
                          label={t('studentDataSheet.dialog.state')}
                          value={isEditing ? editData.state : editStudent.state}
                          name="state"
                          isEditing={isEditing}
                          onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                        />
                        <EditableField
                          label={t('studentDataSheet.dialog.pincode')}
                          value={isEditing ? editData.pin_code : editStudent.pin_code}
                          name="pin_code"
                          isEditing={isEditing}
                          maxLength={6}
                          onChange={(n, v) => {
                            const sanitized = v.replace(/\D/g, '').slice(0, 6);
                            setEditData({ ...editData, [n]: sanitized });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parents Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#1f2937',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('studentDataSheet.dialog.familyInfo')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {/* Father Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '8px',
                          }}
                        >
                          {t('studentDataSheet.dialog.fatherDetails')}
                        </p>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <EditableField
                            label="First Name"
                            value={editData.father_first_name || (isEditing ? '' : editData.father_name)}
                            name="father_first_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          />
                          {/* <EditableField
                            label="Middle (Grandfather's) Name"
                            value={editData.father_middle_name}
                            name="father_middle_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          /> */}
                          <EditableField
                            label="Last Name"
                            value={editData.father_last_name}
                            name="father_last_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          />
                          <EditableField
                            label="Phone"
                            value={editData.father_phone}
                            name="father_phone"
                            isEditing={isEditing}
                            maxLength={10}
                            onChange={(n, v) => {
                              const sanitized = v.replace(/\D/g, '').slice(0, 10);
                              setEditData({ ...editData, [n]: sanitized });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '8px',
                          }}
                        >
                          {t('studentDataSheet.dialog.motherDetails')}
                        </p>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <EditableField
                            label="First Name"
                            value={editData.mother_first_name || (isEditing ? '' : editData.mother_name)}
                            name="mother_first_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          />
                          {/* <EditableField
                            label="Middle (Husband's) Name"
                            value={editData.mother_middle_name}
                            name="mother_middle_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          /> */}
                          <EditableField
                            label="Last Name"
                            value={editData.mother_last_name}
                            name="mother_last_name"
                            isEditing={isEditing}
                            onChange={(n, v) => setEditData({ ...editData, [n]: v })}
                          />
                          <EditableField
                            label="Phone"
                            value={editData.mother_phone}
                            name="mother_phone"
                            isEditing={isEditing}
                            maxLength={10}
                            onChange={(n, v) => {
                              const sanitized = v.replace(/\D/g, '').slice(0, 10);
                              setEditData({ ...editData, [n]: sanitized });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('studentDataSheet.dialog.close')}
              </Button>

              {isEditing && <Button onClick={handleUpdateStudent}>{t('studentDataSheet.dialog.saveChanges')}</Button>}
            </div>
          </div>
        )}
      </CustomDialog>

      {/* Hidden Print Preview */}
      {
        template &&
        selectedStudents.length > 0 &&
        createPortal(
          <PrintPreview
            language={printLanguage}
            onTranslationStart={() => {
              setIsLangLoading(true);
              setTranslationProgress(0);
            }}
            onTranslationEnd={() => setIsLangLoading(false)}
            onProgress={setTranslationProgress}
            template={template}
            schoolData={mappedSchoolData}
            students={printStudents}
          />,
          document.getElementById('print-mount')
        )
      }
    </div >
  );
}
