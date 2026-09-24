import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    Eye,
    CheckCircle,
    XCircle,
    Filter,
    Users,
    ChevronLeft,
    Search,
    Pencil,
    Save,
    Clock,
    AlertCircle,
    Download,
    CheckSquare,
    Square,
    Trash2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CustomDialog } from './CustomDialog';

// ── Types ────────────────────────────────────────────────────────
interface StudentForm {
    id: string | number;
    // names
    student_name?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    // basic
    roll_number?: string | number;
    status?: string;
    class_name?: string;
    division_name?: string;
    gender?: string;
    dob?: string;
    blood_group?: string;
    emergency_contact?: string;
    // address
    address?: string;
    street_address?: string;
    city?: string;
    state?: string;
    pin_code?: string;
    // numbers
    id_number?: string;
    gr_number?: string;
    sr_number?: string;
    admission_number?: string;
    registration_number?: string;
    bus_number?: string;
    // father
    father_name?: string;
    father_phone?: string;
    father_email?: string;
    father_occupation?: string;
    father_office_address?: string;
    father_photo?: string;
    // mother
    mother_name?: string;
    mother_phone?: string;
    mother_email?: string;
    mother_occupation?: string;
    mother_office_address?: string;
    mother_photo?: string;
    // guardian
    guardian_name?: string;
    guardian_contact?: string;
    guardian_email?: string;
    guardian_occupation?: string;
    guardian_office_address?: string;
    guardian_photo?: string;
    guardian_relation?: string;
    // media
    photo?: string;
    sign?: string;
    // meta
    created_at?: string;
    daysWaiting?: number;
}

// ── EditableField ─────────────────────────────────────────────────
function EditableField({
    label,
    name,
    value,
    isEditing,
    onChange,
    type = 'text',
    options,
    placeholder,
}: {
    label: string;
    name: string;
    value?: string | null;
    isEditing: boolean;
    onChange: (name: string, val: string) => void;
    type?: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </p>
            {isEditing ? (
                type === 'select' ? (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(name, e.target.value)}
                        className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
                    >
                        {placeholder && <option value="" disabled>{placeholder}</option>}
                        {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={value || ''}
                        placeholder={placeholder}
                        className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
                        onChange={(e) => onChange(name, e.target.value)}
                    />
                )
            ) : (
                <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{value || '—'}</p>
            )}
        </div>
    );
}

function getGenderOptions(t: any) {
    return [
        { value: 'Male', label: t('studentForms.genderOptions.male') },
        { value: 'Female', label: t('studentForms.genderOptions.female') },
        { value: 'Other', label: t('studentForms.genderOptions.other') },
    ];
}

function getOccupationOptions(t: any) {
    return [
        { value: 'Business', label: t('studentForms.occupationOptions.business') },
        { value: 'Service', label: t('studentForms.occupationOptions.service') },
        { value: 'Self Employed', label: t('studentForms.occupationOptions.selfEmployed') },
        { value: 'Retired', label: t('studentForms.occupationOptions.retired') },
        { value: 'Housewife', label: t('studentForms.occupationOptions.housewife') },
    ];
}

// ── Main Component ────────────────────────────────────────────────
export function ClassStudentList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const genderOptions = useMemo(() => getGenderOptions(t), [t]);
    const occupationOptions = useMemo(() => getOccupationOptions(t), [t]);

    const { classInfo } = (location.state as {
        classInfo: { class: string; division: string };
    }) || {};

    const [students, setStudents] = useState<StudentForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Dialog state
    const [selectedStudent, setSelectedStudent] = useState<StudentForm | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<StudentForm>>({});
    const [newFiles, setNewFiles] = useState<Record<string, File>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const token = localStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // ── Redirect if missing state ───────────────────────────────────
    useEffect(() => {
        if (!classInfo) navigate('/teacher-dashboard/my-classes', { replace: true });
    }, [classInfo, navigate]);

    // ── Fetch ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!classInfo) return;
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${BACKEND_URL}/api/teacher/student-forms`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const all: StudentForm[] = (res.data.data || []).map(mapItem);
                setStudents(all.filter(
                    (f) => f.class_name === classInfo.class && f.division_name === classInfo.division
                ));
            } catch (err) {
                console.error('Failed to fetch students:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [classInfo, BACKEND_URL, token]);

    // ── Map raw API item → StudentForm ──────────────────────────────
    const mapItem = (item: any): StudentForm => ({
        id: item.id?.toString(),
        student_name: [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ') || item.student_name,
        first_name: item.first_name,
        middle_name: item.middle_name,
        last_name: item.last_name,
        roll_number: item.roll_number,
        status: item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'Rejected' : 'Pending',
        class_name: item.class_name,
        division_name: item.division_name,
        gender: item.gender,
        dob: item.dob,
        blood_group: item.blood_group,
        emergency_contact: item.emergency_contact,
        address: item.address,
        street_address: item.street_address,
        city: item.city,
        state: item.state,
        pin_code: item.pin_code,
        id_number: item.id_number,
        gr_number: item.gr_number,
        sr_number: item.sr_number,
        admission_number: item.admission_number,
        registration_number: item.registration_number,
        bus_number: item.bus_number,
        father_name: item.father_name,
        father_phone: item.father_phone,
        father_email: item.father_email,
        father_occupation: item.father_occupation,
        father_office_address: item.father_office_address,
        father_photo: resolveImageUrl(item.father_photo),
        mother_name: item.mother_name,
        mother_phone: item.mother_phone,
        mother_email: item.mother_email,
        mother_occupation: item.mother_occupation,
        mother_office_address: item.mother_office_address,
        mother_photo: resolveImageUrl(item.mother_photo),
        guardian_name: item.guardian_name,
        guardian_contact: item.guardian_contact,
        guardian_email: item.guardian_email,
        guardian_occupation: item.guardian_occupation,
        guardian_office_address: item.guardian_office_address,
        guardian_photo: resolveImageUrl(item.guardian_photo),
        guardian_relation: item.guardian_relation,
        photo: resolveImageUrl(item.photo),
        sign: resolveImageUrl(item.sign || item.signature || item.student_signature),
        created_at: item.created_at,
        daysWaiting: Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000),
    });

    function resolveImageUrl(path?: string | null): string {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
    }

    // ── Field change ────────────────────────────────────────────────
    const onFieldChange = (name: string, value: string) => {
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (name: string, file: File | null) => {
        if (file) setNewFiles((prev) => ({ ...prev, [name]: file }));
    };

    // ── handleUpdate (save edited form) ────────────────────────────
    const handleUpdate = async (nextStatus?: string) => {
        if (!selectedStudent) return;
        try {
            const formData = new FormData();
            const fieldMapping: Record<string, string> = {
                roll_number: 'roll_number',
                father_name: 'father_name',
                mother_name: 'mother_name',
                sign: 'student_signature',
                photo: 'photo',
            };
            const excluded = ['id', 'student_name', 'created_at', 'daysWaiting', 'class_name', 'division_name', 'father_photo', 'mother_photo', 'guardian_photo'];

            Object.entries(editData).forEach(([key, val]) => {
                if (key === 'status' && nextStatus) return;
                if (excluded.includes(key)) return;
                if (val !== null && val !== undefined) {
                    if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) return;
                    formData.append(fieldMapping[key] || key, String(val));
                }
            });

            if (nextStatus) formData.append('status', nextStatus.toLowerCase());

            Object.entries(newFiles).forEach(([name, file]) => {
                formData.append(fieldMapping[name] || name, file as Blob);
            });

            const resp = await axiosInstance.patch(
                `/api/teacher/student-forms/${selectedStudent.id}/update`,
                formData
            );

            if (resp.data.success) {
                const updated = mapItem(resp.data.data);
                setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? updated : s)));
                setSelectedStudent(updated);
                setIsEditing(false);
                setNewFiles({});
                toast.success(nextStatus ? t('studentForms.updateAndStatusSuccess', { status: t(`studentForms.${nextStatus}`) }) : t('studentForms.updateSuccess'));
                if (nextStatus) setIsDialogOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('studentForms.failedUpdate'));
        }
    };

    // ── Approve / Reject (quick) ────────────────────────────────────
    const handleApprove = async (id: string | number) => {
        try {
            const resp = await axiosInstance.patch(`/api/teacher/student-forms/${id}`, { status: 'approved' });
            if (resp.data.success) {
                toast.success(t('studentForms.approveSuccess'));
                setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)));
                setSelectedStudent((prev) => prev?.id === id ? { ...prev, status: 'approved' } : prev);
                setIsDialogOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('studentForms.failedApprove'));
        }
    };

    const handleReject = async (id: string | number) => {
        try {
            const resp = await axiosInstance.patch(`/api/teacher/student-forms/${id}`, { status: 'rejected' });
            if (resp.data.success) {
                toast.success(t('studentForms.rejectSuccess'));
                setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Rejected' } : s)));
                setSelectedStudent((prev) => prev?.id === id ? { ...prev, status: 'Rejected' } : prev);
                setIsDialogOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('studentForms.failedReject'));
        }
    };

    // ── Counts ──────────────────────────────────────────────────────
    const pendingCount = students.filter((s) => !['approved', 'rejected'].includes((s.status || '').toLowerCase())).length;
    const approvedCount = students.filter((s) => (s.status || '').toLowerCase() === 'approved').length;
    const rejectedCount = students.filter((s) => (s.status || '').toLowerCase() === 'rejected').length;

    // ── Selection Logic ──────────────────────────────────────────
    const toggleSelection = (id: string | number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
        }
    };

    // ── Bulk Delete ───────────────────────────────────────────────
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        try {
            const ids = Array.from(selectedIds);
            await axiosInstance.post('/api/teacher/student-forms/delete-bulk', { ids });
            setStudents((prev) => prev.filter((s) => !selectedIds.has(s.id)));
            const count = selectedIds.size;
            setSelectedIds(new Set());
            setIsDeleteConfirmOpen(false);
            toast.success(t('common.deleteSuccess', { count }));
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common.deleteError'));
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // ── Filter + Search ─────────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const name = (s.student_name || '').toLowerCase();
            const roll = String(s.roll_number || '').toLowerCase();
            const q = searchText.trim().toLowerCase();
            const matchSearch = q === '' || name.includes(q) || roll.includes(q);

            const status = (s.status || '').toLowerCase();
            const matchStatus =
                filterStatus === 'all' ? true
                    : filterStatus === 'approved' ? status === 'approved'
                        : filterStatus === 'Pending' ? !['approved', 'rejected'].includes(status)
                            : filterStatus === 'Rejected' ? status === 'rejected'
                                : true;

            return matchSearch && matchStatus;
        });
    }, [students, searchText, filterStatus]);

    // ── Helpers ─────────────────────────────────────────────────────
    const getStatusBadgeClass = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'rejected') return 'bg-red-100 text-red-400 border-red-200';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const getStatusLabel = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return t('studentForms.approved').toUpperCase();
        if (s === 'rejected') return t('studentForms.rejected').toUpperCase();
        return t('studentForms.pendingReview').toUpperCase();
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isPending = (status?: string) => !['approved', 'rejected'].includes((status || '').toLowerCase());

    // ── Export to Excel ─────────────────────────────────────────────
    const handleExport = () => {
        const TEMPLATE_HEADERS = [
            'GR Number', 'Roll Number', 'First Name', 'Middle Name', 'Last Name',
            'Date of Birth', 'Gender', 'Blood Group',
            'Father Name', 'Father Email', 'Father Phone',
            'Mother Name', 'Mother Phone',
            'Street Address', 'City', 'State', 'PIN Code',
            'Emergency Contact',
            'Guardian Name', 'Guardian Phone', 'Guardian Email',
        ];

        const rows = filteredStudents.map((s) => ({
            'GR Number': s.gr_number || '',
            'Roll Number': String(s.roll_number || ''),
            'First Name': s.first_name || '',
            'Middle Name': s.middle_name || '',
            'Last Name': s.last_name || '',
            'Date of Birth': s.dob || '',
            'Gender': s.gender || '',
            'Blood Group': s.blood_group || '',
            'Father Name': s.father_name || '',
            'Father Email': s.father_email || '',
            'Father Phone': s.father_phone || '',
            'Mother Name': s.mother_name || '',
            'Mother Phone': s.mother_phone || '',
            'Street Address': s.street_address || '',
            'City': s.city || '',
            'State': s.state || '',
            'PIN Code': s.pin_code || '',
            'Emergency Contact': s.emergency_contact || '',
            'Guardian Name': s.guardian_name || '',
            'Guardian Phone': s.guardian_contact || '',
            'Guardian Email': s.guardian_email || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: TEMPLATE_HEADERS });

        // Style header row width
        worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        const fileName = `Class_${classInfo.class}_Div_${classInfo.division}_Students.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast.success(`Exported ${filteredStudents.length} students to ${fileName}`);
    };

    if (!classInfo) return null;

    return (
        <div className="px-8 py-5 md:px-8 md:py-5 min-h-dvh mx-auto bg-white">

            {/* ── Page Header ── */}
            <div className="mb-6 md:mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-sm font-medium mb-3 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {t('common.backToMyClasses')}
                </button>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            {t('teacherClasses.classDivisionHeader', { class: classInfo.class, division: classInfo.division })}
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 font-medium">{t('teacherClasses.studentListSubtitle')}</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={filteredStudents.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        {t('teacherClasses.exportExcel', { count: filteredStudents.length })}
                    </button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: t('teacherDashboard.totalStudents'), value: students.length, color: '' },
                    { label: t('studentForms.pendingReview'), value: pendingCount, color: 'text-slate-500' },
                    { label: t('studentForms.approved'), value: approvedCount, color: 'text-green-600' },
                    { label: t('studentForms.rejected'), value: rejectedCount, color: 'text-red-500' },
                ].map(({ label, value, color }) => (
                    <Card key={label} className="border rounded-2xl shadow-md bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <p className="text-lg text-gray-600">{label}</p>
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Filters ── */}
            <Card className="mb-6 border rounded-2xl shadow-md bg-white overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{t('studentForms.filters')}</span>
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder={t('teacherClasses.searchPlaceholder')}
                                    className="flex-1 text-sm outline-none bg-transparent"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>
                            {selectedIds.size > 0 && (
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('teacherClasses.deleteSelected', { count: selectedIds.size })}
                                </button>
                            )}
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px] border border-gray-300">
                                <SelectValue placeholder={t('studentForms.allStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('studentForms.allStatus')}</SelectItem>
                                <SelectItem value="Pending">{t('studentForms.pendingReview')}</SelectItem>
                                <SelectItem value="approved">{t('studentForms.approved')}</SelectItem>
                                <SelectItem value="Rejected">{t('studentForms.rejected')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* ── Table ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {t('teacherClasses.formSubmissionsTitle', { count: filteredStudents.length })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-medium">{t('teacherClasses.loadingStudents')}</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-base font-semibold text-gray-500">{t('teacherClasses.noStudentsFound')}</p>
                            {searchText && <p className="text-sm text-gray-400 mt-1">{t('teacherClasses.tryDifferentSearch')}</p>}
                        </div>
                    ) : (
                        <div className="overflow-x-auto px-4">
                            <Table className="table-fixed w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px] text-center">
                                            <button
                                                onClick={toggleAll}
                                                className="flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
                                            >
                                                {filteredStudents.length > 0 && selectedIds.size === filteredStudents.length ? (
                                                    <CheckSquare size={18} className="text-indigo-600" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </TableHead>
                                        <TableHead>{t('studentForms.rollNo')}</TableHead>
                                        <TableHead className="w-[160px]">{t('studentForms.name')}</TableHead>
                                        <TableHead>{t('studentForms.class')}</TableHead>
                                        <TableHead>{t('studentForms.division')}</TableHead>
                                        <TableHead className="w-[160px]">{t('studentForms.father')}</TableHead>
                                        <TableHead className="w-[140px]">{t('studentForms.submittedOn')}</TableHead>
                                        <TableHead>{t('studentForms.status')}</TableHead>
                                        <TableHead>{t('studentForms.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((s, idx) => (
                                        <TableRow key={s.id || idx}>
                                            <TableCell className="text-center">
                                                <button
                                                    onClick={() => toggleSelection(s.id)}
                                                    className={`flex items-center justify-center cursor-pointer transition-colors ${selectedIds.has(s.id) ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-400'}`}
                                                >
                                                    {selectedIds.has(s.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </TableCell>
                                            <TableCell>{s.roll_number || '—'}</TableCell>
                                            <TableCell className="w-[160px]">
                                                <span className="block truncate font-medium" title={s.student_name || undefined}>
                                                    {s.student_name || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{s.class_name || '—'}</TableCell>
                                            <TableCell>{s.division_name || '—'}</TableCell>
                                            <TableCell className="w-[160px]">
                                                <span className="block truncate text-sm" title={s.father_name || undefined}>
                                                    {s.father_name || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[140px]">
                                                <span className="block truncate text-sm" title={formatDate(s.created_at)}>
                                                    {formatDate(s.created_at)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] font-bold border ${getStatusBadgeClass(s.status)}`}>
                                                    {getStatusLabel(s.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {/* View */}
                                                    <Eye
                                                        className="cursor-pointer text-gray-400 hover:text-gray-600 w-5 h-5 ml-2 transition-colors"
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setIsEditing(false);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    />
                                                    {/* Edit */}
                                                    <Pencil
                                                        className="cursor-pointer text-blue-400 hover:text-blue-600 w-5 h-5 ml-2 transition-colors"
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setEditData(s);
                                                            setIsEditing(true);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    />
                                                    {/* Approve / Reject — only when pending */}
                                                    {isPending(s.status) && (
                                                        <>
                                                            <CheckCircle
                                                                className="text-green-600 cursor-pointer w-5 h-5 hover:text-green-800 transition-colors"
                                                                onClick={() => handleApprove(s.id)}
                                                            />
                                                            <XCircle
                                                                className="text-red-600 cursor-pointer w-5 h-5 hover:text-red-800 transition-colors"
                                                                onClick={() => handleReject(s.id)}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* ── Delete Confirmation Dialog ── */}
            {isDeleteConfirmOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteConfirmOpen(false); }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{t('teacherClasses.deleteConfirmTitle')}</h3>
                                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                                    {t('teacherClasses.deleteConfirmDesc', { count: selectedIds.size })}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                disabled={isBulkDeleting}
                                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-60 active:scale-95"
                            >
                                {isBulkDeleting ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.deleting')}</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" />{t('teacherClasses.deleteSelected', { count: selectedIds.size })}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail / Edit Dialog ── */}
            <CustomDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                {selectedStudent && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff' }}>

                        {/* ── Banner header ── */}
                        <div
                            style={{ background: 'linear-gradient(to right, #1f2937, #374151, #4b5563)', padding: '24px' }}
                            className="text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl" />

                            <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                                {/* Student Photo */}
                                <div className="relative group">
                                    <div style={{ width: '120px', height: '120px', borderRadius: '16px', backgroundColor: '#fff', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.3)', position: 'relative' }}>
                                        {newFiles.photo ? (
                                            <img src={URL.createObjectURL(newFiles.photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : selectedStudent.photo ? (
                                            <img src={selectedStudent.photo} alt={selectedStudent.student_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-student.png'; }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                                                <Users style={{ width: '48px', height: '48px', color: '#d1d5db' }} />
                                            </div>
                                        )}
                                        {isEditing && (
                                            <label style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)} />
                                                <Pencil style={{ width: '24px', height: '24px', color: '#fff', marginBottom: '4px' }} />
                                                <p style={{ color: '#fff', fontSize: '9px', fontWeight: 800 }}>{t('studentForms.changePhoto')}</p>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Name + meta */}
                                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>
                                            {selectedStudent.student_name}
                                        </h2>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(12px)', padding: '4px 12px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock style={{ width: '12px', height: '12px' }} />
                                            {getStatusLabel(selectedStudent.status)}
                                        </div>
                                        {(selectedStudent.daysWaiting ?? 0) > 0 && (
                                            <div style={{ backgroundColor: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                {t('teacherClasses.daysWaiting', { count: selectedStudent.daysWaiting })}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '14px' }}>
                                        {[
                                            { lbl: t('studentForms.classLabel'), val: `${selectedStudent.class_name} - ${selectedStudent.division_name}` },
                                            { lbl: t('studentForms.rollLabel'), val: selectedStudent.roll_number || t('common.na') },
                                            { lbl: t('studentForms.bloodLabel'), val: selectedStudent.blood_group || t('common.na') },
                                        ].map(({ lbl, val }) => (
                                            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>{lbl}</span>
                                                <span>{val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Signature */}
                                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backdropFilter: 'blur(4px)', height: '50px', width: '150px' }}>
                                            {newFiles.sign ? (
                                                <img src={URL.createObjectURL(newFiles.sign)} alt="New Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : selectedStudent.sign ? (
                                                <img src={selectedStudent.sign} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>{t('teacherClasses.noSignature')}</div>
                                            )}
                                            {isEditing && (
                                                <label style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px' }}>
                                                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange('sign', e.target.files?.[0] || null)} />
                                                    <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: '24px 32px' }} className="space-y-8">

                            {/* Urgent alert */}
                            {(selectedStudent.daysWaiting ?? 0) >= 5 && (
                                <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px' }} className="rounded-lg flex items-center gap-3 shadow-sm">
                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                    <div>
                                        <p className="text-red-800 font-bold text-xs uppercase tracking-wider leading-none mb-1">{t('teacherClasses.criticalAttention')}</p>
                                        <p className="text-red-600 text-[10px]">{t('teacherClasses.reviewWindowExceeded')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Registry / School numbers */}
                            <div>
                                <SectionTitle color="#4b5563">{t('teacherClasses.registrySchoolDetails')}</SectionTitle>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                    {[
                                        { label: t('studentForms.rollNo'), value: selectedStudent.roll_number as string, name: 'roll_number' },
                                        { label: t('studentForms.idNumber'), value: selectedStudent.id_number, name: 'id_number' },
                                        { label: t('studentForms.grNumber'), value: selectedStudent.gr_number, name: 'gr_number' },
                                        { label: t('studentForms.srNumber'), value: selectedStudent.sr_number, name: 'sr_number' },
                                        { label: t('studentForms.admission_number'), value: selectedStudent.admission_number, name: 'admission_number' },
                                        { label: t('studentForms.registration_number'), value: selectedStudent.registration_number, name: 'registration_number' },
                                        { label: t('studentForms.bus_number'), value: selectedStudent.bus_number, name: 'bus_number' },
                                    ].map((item) => (
                                        <div key={item.name} style={{ backgroundColor: 'rgba(249,250,251,0.5)', border: '1px solid #f3f4f6', padding: '12px', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
                                            {isEditing ? (
                                                <input type="text" value={(editData as any)[item.name] || ''} className="w-full text-xs p-1 border rounded bg-white" onChange={(e) => onFieldChange(item.name, e.target.value)} />
                                            ) : (
                                                <p style={{ fontWeight: 700, color: '#374151', fontSize: '14px' }}>{item.value || t('common.na')}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Personal + Family side-by-side */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                                {/* Personal Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <SectionTitle color="#64748b">{t('studentForms.personalDetails')}</SectionTitle>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                                            <EditableField label={t('studentForms.first_name')} value={isEditing ? editData.first_name : selectedStudent.first_name} name="first_name" isEditing={isEditing} onChange={onFieldChange} />
                                            <EditableField label={t('studentForms.middle_name')} value={isEditing ? editData.middle_name : selectedStudent.middle_name} name="middle_name" isEditing={isEditing} onChange={onFieldChange} />
                                            <EditableField label={t('studentForms.last_name')} value={isEditing ? editData.last_name : selectedStudent.last_name} name="last_name" isEditing={isEditing} onChange={onFieldChange} />
                                            <EditableField label={t('studentForms.birthDate')} value={isEditing ? editData.dob : selectedStudent.dob} name="dob" isEditing={isEditing} onChange={onFieldChange} type="date" />
                                            <EditableField label={t('studentForms.gender')} value={isEditing ? editData.gender : selectedStudent.gender} name="gender" isEditing={isEditing} onChange={onFieldChange} type="select" options={genderOptions} placeholder={t('common.na')} />
                                            <EditableField label={t('studentForms.bloodGroup')} value={isEditing ? editData.blood_group : selectedStudent.blood_group} name="blood_group" isEditing={isEditing} onChange={onFieldChange} />
                                            <EditableField label={t('studentForms.emergency')} value={isEditing ? editData.emergency_contact : selectedStudent.emergency_contact} name="emergency_contact" isEditing={isEditing} onChange={onFieldChange} />
                                        </div>
                                        {/* Address */}
                                        <div style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('studentForms.addressInformation')}</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <EditableField label={t('studentForms.streetAddress')} value={isEditing ? editData.street_address : selectedStudent.street_address} name="street_address" isEditing={isEditing} onChange={onFieldChange} />
                                                </div>
                                                <EditableField label={t('studentForms.city')} value={isEditing ? editData.city : selectedStudent.city} name="city" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.state')} value={isEditing ? editData.state : selectedStudent.state} name="state" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.pinCode')} value={isEditing ? editData.pin_code : selectedStudent.pin_code} name="pin_code" isEditing={isEditing} onChange={onFieldChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Family Overview */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <SectionTitle color="#1f2937">{t('teacherClasses.familyOverview')}</SectionTitle>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>

                                        {/* Father */}
                                        <ParentCard
                                            label={t('studentForms.fatherDetails')}
                                            photoKey="father_photo"
                                            photoSrc={selectedStudent.father_photo}
                                            newFiles={newFiles}
                                            isEditing={isEditing}
                                            onFileChange={handleFileChange}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                                <EditableField label={t('studentForms.name')} value={isEditing ? editData.father_name : selectedStudent.father_name} name="father_name" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('common.phone')} value={isEditing ? editData.father_phone : selectedStudent.father_phone} name="father_phone" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.email')} value={isEditing ? editData.father_email : selectedStudent.father_email} name="father_email" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.occupation')} value={isEditing ? editData.father_occupation : selectedStudent.father_occupation} name="father_occupation" isEditing={isEditing} onChange={onFieldChange} type="select" options={occupationOptions} placeholder={t('common.na')} />
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <EditableField label={t('studentForms.officeAddress')} value={isEditing ? editData.father_office_address : selectedStudent.father_office_address} name="father_office_address" isEditing={isEditing} onChange={onFieldChange} />
                                                </div>
                                            </div>
                                        </ParentCard>

                                        {/* Mother */}
                                        <ParentCard
                                            label={t('studentForms.motherDetails')}
                                            photoKey="mother_photo"
                                            photoSrc={selectedStudent.mother_photo}
                                            newFiles={newFiles}
                                            isEditing={isEditing}
                                            onFileChange={handleFileChange}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                                <EditableField label={t('studentForms.name')} value={isEditing ? editData.mother_name : selectedStudent.mother_name} name="mother_name" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('common.phone')} value={isEditing ? editData.mother_phone : selectedStudent.mother_phone} name="mother_phone" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.email')} value={isEditing ? editData.mother_email : selectedStudent.mother_email} name="mother_email" isEditing={isEditing} onChange={onFieldChange} />
                                                <EditableField label={t('studentForms.occupation')} value={isEditing ? editData.mother_occupation : selectedStudent.mother_occupation} name="mother_occupation" isEditing={isEditing} onChange={onFieldChange} type="select" options={occupationOptions} placeholder={t('common.na')} />
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <EditableField label={t('studentForms.officeAddress')} value={isEditing ? editData.mother_office_address : selectedStudent.mother_office_address} name="mother_office_address" isEditing={isEditing} onChange={onFieldChange} />
                                                </div>
                                            </div>
                                        </ParentCard>

                                        {/* Guardian (if exists) */}
                                        {selectedStudent.guardian_name && (
                                            <ParentCard
                                                label={`${t('studentForms.guardianDetails')} (${selectedStudent.guardian_relation || ''})`}
                                                photoKey="guardian_photo"
                                                photoSrc={selectedStudent.guardian_photo}
                                                newFiles={newFiles}
                                                isEditing={isEditing}
                                                onFileChange={handleFileChange}
                                            >
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                                    <EditableField label={t('studentForms.name')} value={isEditing ? editData.guardian_name : selectedStudent.guardian_name} name="guardian_name" isEditing={isEditing} onChange={onFieldChange} />
                                                    <EditableField label={t('studentForms.relation')} value={isEditing ? editData.guardian_relation : selectedStudent.guardian_relation} name="guardian_relation" isEditing={isEditing} onChange={onFieldChange} />
                                                    <EditableField label={t('studentForms.emergency')} value={isEditing ? editData.guardian_contact : selectedStudent.guardian_contact} name="guardian_contact" isEditing={isEditing} onChange={onFieldChange} />
                                                    <EditableField label={t('studentForms.email')} value={isEditing ? editData.guardian_email : selectedStudent.guardian_email} name="guardian_email" isEditing={isEditing} onChange={onFieldChange} />
                                                    <EditableField label={t('studentForms.occupation')} value={isEditing ? editData.guardian_occupation : selectedStudent.guardian_occupation} name="guardian_occupation" isEditing={isEditing} onChange={onFieldChange} type="select" options={occupationOptions} placeholder={t('common.na')} />
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <EditableField label={t('studentForms.officeAddress')} value={isEditing ? editData.guardian_office_address : selectedStudent.guardian_office_address} name="guardian_office_address" isEditing={isEditing} onChange={onFieldChange} />
                                                    </div>
                                                </div>
                                            </ParentCard>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer Buttons ── */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', paddingBottom: '24px' }}>
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', fontWeight: 700, color: '#64748b', borderColor: '#e2e8f0' }} className="px-6 hover:bg-gray-50 uppercase tracking-wider" onClick={() => { setIsEditing(false); setEditData(selectedStudent); }}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button variant="outline" size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', fontWeight: 700, color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fff' }} className="px-6 hover:bg-red-50 uppercase tracking-wider" onClick={() => handleUpdate('rejected')}>
                                            {t('teacherClasses.reject')}
                                        </Button>
                                        <Button size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', backgroundColor: '#0f172a', fontWeight: 800 }} className="px-8 hover:bg-gray-800 text-white uppercase tracking-wider" onClick={() => handleUpdate('approved')}>
                                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> {t('teacherClasses.approve')}
                                        </Button>
                                        <Button size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', backgroundColor: '#2563eb', fontWeight: 800 }} className="px-8 hover:bg-blue-700 text-white uppercase tracking-wider" onClick={() => handleUpdate()}>
                                            <Save className="w-3.5 h-3.5 mr-2" /> {t('common.save')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline" size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', fontWeight: 700, color: '#64748b', borderColor: '#e2e8f0' }} className="px-6 hover:bg-gray-50 uppercase tracking-wider" onClick={() => setIsDialogOpen(false)}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button variant="outline" size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', fontWeight: 700, color: '#3b82f6', borderColor: '#dbeafe' }} className="px-6 hover:bg-blue-50 uppercase tracking-wider" onClick={() => { setIsEditing(true); setEditData(selectedStudent); }}>
                                            <Pencil className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                                        </Button>
                                        {isPending(selectedStudent.status) && (
                                            <>
                                                <Button variant="outline" size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', fontWeight: 700, color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fff' }} className="px-6 hover:bg-red-50 uppercase tracking-wider" onClick={() => handleReject(selectedStudent.id)}>
                                                    {t('teacherClasses.reject')}
                                                </Button>
                                                <Button size="sm" style={{ fontSize: '11px', height: '36px', borderRadius: '8px', backgroundColor: '#0f172a', fontWeight: 800 }} className="px-8 hover:bg-gray-800 text-white uppercase tracking-wider" onClick={() => handleApprove(selectedStudent.id)}>
                                                    <CheckCircle className="w-3.5 h-3.5 mr-2" /> {t('teacherClasses.approve')}
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CustomDialog>
        </div >
    );
}

// ── Sub-components ────────────────────────────────────────────────
function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ height: '12px', width: '4px', backgroundColor: color, borderRadius: '9999px' }} />
            {children}
        </h3>
    );
}

import React from 'react';
import { t } from 'i18next';

function ParentCard({
    label,
    photoKey,
    photoSrc,
    newFiles,
    isEditing,
    onFileChange,
    children,
}: {
    label: string;
    photoKey: string;
    photoSrc?: string;
    newFiles: Record<string, File>;
    isEditing: boolean;
    onFileChange: (name: string, file: File | null) => void;
    children: React.ReactNode;
}) {
    return (
        <div style={{ backgroundColor: '#fff', border: '2px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '12px' }}>
            {/* Parent photo */}
            <div style={{ width: '48px', height: '48px', backgroundColor: '#f9fafb', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f3f4f6', position: 'relative' }}>
                {newFiles[photoKey] ? (
                    <img src={URL.createObjectURL(newFiles[photoKey])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : photoSrc ? (
                    <img src={photoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#d1d5db', fontWeight: 700, textTransform: 'uppercase' }}>
                        {t('studentForms.photo')}
                    </div>
                )}
                {isEditing && (
                    <label style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px' }}>
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => onFileChange(photoKey, e.target.files?.[0] || null)} />
                        <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                    </label>
                )}
            </div>
            <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: '9px', fontWeight: 900, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</p>
                {children}
            </div>
        </div>
    );
}
